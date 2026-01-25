-- Unmask Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Note: Supabase Auth creates auth.users automatically
-- This table extends it with app-specific data

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 0,
    free_analyses_used INTEGER NOT NULL DEFAULT 0,
    free_tier_reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HOTEL_ANALYSES TABLE (Cached Analyses - The Moat)
-- ============================================

CREATE TABLE IF NOT EXISTS hotel_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id TEXT NOT NULL UNIQUE,
    hotel_name TEXT NOT NULL,
    booking_url TEXT,
    analysis_data JSONB NOT NULL,
    adjusted_rating DECIMAL(3, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER_ANALYSES TABLE (Tracks Who Analyzed What)
-- ============================================

CREATE TABLE IF NOT EXISTS user_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    hotel_analysis_id UUID NOT NULL REFERENCES hotel_analyses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure we have either user_id or session_id for tracking
    CONSTRAINT user_or_session_required CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- ============================================
-- INDEXES
-- ============================================

-- hotel_analyses indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_analyses_hotel_id ON hotel_analyses(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_analyses_updated_at ON hotel_analyses(updated_at);

-- user_analyses indexes
CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_session_id ON user_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_hotel_analysis_id ON user_analyses(hotel_analysis_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to hotel_analyses table
DROP TRIGGER IF EXISTS update_hotel_analyses_updated_at ON hotel_analyses;
CREATE TRIGGER update_hotel_analyses_updated_at
    BEFORE UPDATE ON hotel_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Hotel analyses are readable by everyone (public cache)
CREATE POLICY "Hotel analyses are publicly readable" ON hotel_analyses
    FOR SELECT TO authenticated, anon
    USING (true);

-- Only service role can insert/update hotel analyses
CREATE POLICY "Service role can manage hotel analyses" ON hotel_analyses
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Users can view their own analyses
CREATE POLICY "Users can view own analyses" ON user_analyses
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all user analyses
CREATE POLICY "Service role can manage user analyses" ON user_analyses
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, credits, free_analyses_used)
    VALUES (NEW.id, NEW.email, 0, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
