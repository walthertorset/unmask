import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  hotel_id: string;
  hotel_name: string;
  reviews: Array<{ rating: number; title?: string; text: string }>;
  price_data?: { currency: string; pricePerNight: number };
  location?: string;
  language?: string;
  session_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header (optional - supports anonymous)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const userClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    const body: AnalyzeRequest = await req.json();
    const {
      hotel_id,
      hotel_name,
      reviews,
      price_data,
      location,
      language = 'English',
      session_id
    } = body;

    if (!hotel_id || !reviews?.length) {
      return new Response(
        JSON.stringify({ error: "hotel_id and reviews are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // CHECK CACHE FIRST (The Moat!)
    // ========================================
    const { data: cachedAnalysis } = await supabase
      .from("hotel_analyses")
      .select("*")
      .eq("hotel_id", hotel_id)
      .single();

    if (cachedAnalysis) {
      // Log this analysis access
      await supabase.from("user_analyses").insert({
        user_id: userId,
        session_id: userId ? null : session_id,
        hotel_analysis_id: cachedAnalysis.id,
      });

      return new Response(
        JSON.stringify({
          cached: true,
          analysis: cachedAnalysis.analysis_data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // BUILD THE EXACT SAME PROMPT AS EXTENSION
    // ========================================
    let priceContext = `   - Infer price tier from review mentions of "value", "expensive", "budget"`;

    if (price_data?.pricePerNight) {
      const price = `${price_data.currency} ${price_data.pricePerNight}`;
      const loc = location || "this location";
      priceContext = `   - Price: ${price}/night
   - Evaluate expectations for this price point in ${loc}
   - Compare amenities/quality to local market rate`;
    }

    const systemPrompt = `Analyze hotel reviews and return JSON in ${language}.

CORE PRINCIPLE: Impact = Severity × Frequency. A critical issue mentioned by 1% matters less than a medium issue mentioned by 40%.

FILTERING (track what you exclude):
- Skip entirely: Spam, weather complaints, airline issues, exact duplicates
- Halve weight: Generic praise/complaints without specifics ("nice hotel", "good stay")
- Full weight: Detailed, specific observations with verifiable details

SEVERITY LEVELS:
- CRITICAL: Safety, bedbugs, mold, serious hygiene, security breaches
- HIGH: Broken AC/plumbing, dirty rooms, hostile staff, unsafe location
- MEDIUM: Slow maintenance, WiFi issues, minor cleanliness gaps
- LOW: Cosmetic wear, decor taste, normal urban noise

RECENCY: Last 3 months = 100% weight, 3-12 months = 75%, 12+ months = 50%

RATING ANALYSIS FRAMEWORK:
Start by assuming the listed rating is accurate. Only adjust when review patterns clearly contradict it.

Use this logic to guide your adjusted rating, applying judgment based on patterns:

Issues (pull rating down):
- Critical >5% OR High >10% OR Medium >15% OR Low >20% → consider 1-2 point reduction
- Critical 2.5-5% OR High 5-10% OR Medium 7.5-15% OR Low 10-20% → consider 0.5-1 point reduction
- All issues below half-threshold → minimal to no penalty

Strengths (pull rating up):
- Strength >50% → consider 0.5-1 point increase each (cap total at +2 points)
- Strength 25-50% → consider 0.2-0.5 point increase each
- Strength <25% → minimal impact

Recent trend: Declining pattern may warrant additional 0.5-1 point reduction.

Maximum adjustment: ±3 points from listed rating. Final score caps at 10.0 (very rare).

CONFIDENCE LEVEL:
- HIGH: 20+ detailed reviews, consistent patterns, <30% filtered
- MEDIUM: 10-19 reviews OR moderate conflicts OR 30-50% filtered
- LOW: <10 reviews OR major conflicts OR >50% filtered OR sharp recent trend shift

${priceContext}

Return JSON only:
{
  "adjustedRating": number (1.0-10.0, never exceed 10.0),
  "confidenceLevel": "high"|"medium"|"low",
  "ignoredReviewsCount": number (spam, generic, off-topic),
  "keyIssues": [{"issue": string, "severity": "critical"|"high"|"medium"|"low", "mentionedInPercent": number}],
  "keyStrengths": [{"strength": string, "mentionedInPercent": number}],
  "trendText": string (1 sentence),
  "trendDirection": "improving"|"stable"|"declining"|"insufficient_data",
  "recommendation": string (1-2 sentences in ${language})
}`;

    // ========================================
    // CALL CLAUDE API
    // ========================================
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" }
          }
        ],
        messages: [{
          role: "user",
          content: `Analyze these ${reviews.length} reviews for ${hotel_name}:\n\n${JSON.stringify(reviews)}`
        }],
      }),
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const claudeData = await claudeResponse.json();
    const analysisText = claudeData.content[0].text;

    // Parse Claude's JSON response
    let analysisData;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysisData = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch {
      throw new Error("Failed to parse analysis response");
    }

    // ========================================
    // CACHE THE RESULT
    // ========================================
    const { data: newAnalysis, error: insertError } = await supabase
      .from("hotel_analyses")
      .insert({
        hotel_id,
        hotel_name,
        booking_url: null,
        analysis_data: analysisData,
        adjusted_rating: analysisData.adjustedRating,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Cache insert error:", insertError);
      // Don't fail the request, just skip caching
    }

    // Log the analysis access
    if (newAnalysis) {
      await supabase.from("user_analyses").insert({
        user_id: userId,
        session_id: userId ? null : session_id,
        hotel_analysis_id: newAnalysis.id,
      });
    }

    return new Response(
      JSON.stringify({
        cached: false,
        analysis: analysisData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
