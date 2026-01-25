import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AskRequest {
  question: string;
  hotel_name: string;
  analysis: {
    adjustedRating: number;
    valueScore?: number;
    keyIssues: Array<{ issue: string }>;
    keyStrengths: Array<{ strength: string }>;
  };
  reviews: Array<{ rating: number; text: string }>;
  session_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY")!;

    const body: AskRequest = await req.json();
    const { question, hotel_name, analysis, reviews } = body;

    if (!question || !reviews?.length) {
      return new Response(
        JSON.stringify({ error: "question and reviews are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from analysis summary
    const analysisContext = `
Hotel: ${hotel_name}
Quality Score: ${analysis.adjustedRating}/10
Value Score: ${analysis.valueScore || 'N/A'}/10
Key Issues: ${analysis.keyIssues.slice(0, 3).map(i => i.issue).join(', ')}
Key Strengths: ${analysis.keyStrengths.slice(0, 3).map(s => s.strength).join(', ')}
`;

    const systemPrompt = `Answer the user's question based ONLY on the review data and analysis provided.

RULES:
- Be specific and cite evidence from reviews (e.g., "Based on 11 mentions...")
- Do NOT mention how many reviews were analyzed
- If reviews don't mention the topic, say so honestly
- Keep answers concise (2-4 sentences max)
- Focus on facts, not speculation

Analysis Summary:
${analysisContext}`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" }
          }
        ],
        messages: [{
          role: "user",
          content: `Reviews:\n${JSON.stringify(reviews)}\n\nQuestion: ${question}`
        }],
      }),
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const claudeData = await claudeResponse.json();
    const answer = claudeData.content[0].text;

    return new Response(
      JSON.stringify({ answer }),
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
