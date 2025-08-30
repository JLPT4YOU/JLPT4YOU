-- JLPT4YOU Database Schema
-- Supabase PostgreSQL Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('Free', 'Premium');
CREATE TYPE exam_type AS ENUM ('JLPT', 'CHALLENGE', 'DRIVING');
CREATE TYPE exam_mode AS ENUM ('practice', 'challenge', 'official');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    display_name TEXT, -- Tên hiển thị có thể khác với name
    avatar_url TEXT,
    avatar_icon TEXT, -- Tên icon từ lucide-react để làm avatar
    role user_role DEFAULT 'Free' NOT NULL,
    subscription_expires_at TIMESTAMPTZ,
    password_updated_at TIMESTAMPTZ, -- Thời gian đổi mật khẩu lần cuối
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Exam results table
CREATE TABLE public.exam_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    exam_type exam_type NOT NULL,
    exam_level TEXT NOT NULL, -- N1, N2, N3, N4, N5 for JLPT; KARIMEN, HONMEN for DRIVING
    exam_mode exam_mode NOT NULL,
    score DECIMAL(5,2) NOT NULL, -- Percentage score (0-100)
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_spent INTEGER NOT NULL, -- Time in seconds
    answers JSONB NOT NULL, -- Array of answer objects
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
    CONSTRAINT valid_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
    CONSTRAINT valid_time CHECK (time_spent >= 0)
);

-- User progress table
CREATE TABLE public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- JLPT Progress (0-100%)
    jlpt_n5_progress DECIMAL(5,2) DEFAULT 0 NOT NULL,
    jlpt_n4_progress DECIMAL(5,2) DEFAULT 0 NOT NULL,
    jlpt_n3_progress DECIMAL(5,2) DEFAULT 0 NOT NULL,
    jlpt_n2_progress DECIMAL(5,2) DEFAULT 0 NOT NULL,
    jlpt_n1_progress DECIMAL(5,2) DEFAULT 0 NOT NULL,
    
    -- Challenge mode stats
    challenge_streak INTEGER DEFAULT 0 NOT NULL,
    challenge_best_score DECIMAL(5,2) DEFAULT 0 NOT NULL,
    
    -- General stats
    total_study_time INTEGER DEFAULT 0 NOT NULL, -- Total time in seconds
    total_exams_taken INTEGER DEFAULT 0 NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Achievements and metadata
    achievements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_progress CHECK (
        jlpt_n5_progress >= 0 AND jlpt_n5_progress <= 100 AND
        jlpt_n4_progress >= 0 AND jlpt_n4_progress <= 100 AND
        jlpt_n3_progress >= 0 AND jlpt_n3_progress <= 100 AND
        jlpt_n2_progress >= 0 AND jlpt_n2_progress <= 100 AND
        jlpt_n1_progress >= 0 AND jlpt_n1_progress <= 100
    ),
    CONSTRAINT valid_challenge_score CHECK (challenge_best_score >= 0 AND challenge_best_score <= 100),
    CONSTRAINT valid_streak CHECK (challenge_streak >= 0),
    CONSTRAINT valid_study_time CHECK (total_study_time >= 0),
    CONSTRAINT valid_exam_count CHECK (total_exams_taken >= 0)
);

-- User API Keys table (for encrypted API key storage)
CREATE TABLE public.user_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini','groq')),
    key_encrypted TEXT NOT NULL, -- Base64 encoded encrypted data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Books table for library management
CREATE TABLE public.books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('n1', 'n2', 'n3', 'n4', 'n5', 'other')),
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_name TEXT NOT NULL, -- Original file name
    file_size BIGINT NOT NULL, -- File size in bytes
    pages INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_exam_results_user_id ON public.exam_results(user_id);
CREATE INDEX idx_exam_results_type_level ON public.exam_results(exam_type, exam_level);
CREATE INDEX idx_exam_results_created_at ON public.exam_results(created_at DESC);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON public.user_api_keys(provider);
CREATE INDEX idx_books_category ON public.books(category);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX idx_books_uploaded_by ON public.books(uploaded_by);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Exam results policies
CREATE POLICY "Users can view own exam results" ON public.exam_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam results" ON public.exam_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User progress policies
CREATE POLICY "Users can view own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
    FOR ALL USING (auth.uid() = user_id);

-- User API Keys policies
CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Functions and Triggers
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Create initial progress record
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper functions for API key encryption/decryption
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key TEXT, user_secret TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT encode(extensions.pgp_sym_encrypt(api_key, user_secret), 'base64');
$$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT, user_secret TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT extensions.pgp_sym_decrypt(decode(encrypted_key, 'base64'), user_secret);
$$;

-- Books policies
-- All users can view published books
CREATE POLICY "Anyone can view published books" ON public.books
    FOR SELECT USING (status = 'published');

-- Only admins can insert books
CREATE POLICY "Admins can insert books" ON public.books
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Only admins can update books
CREATE POLICY "Admins can update books" ON public.books
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Only admins can delete books
CREATE POLICY "Admins can delete books" ON public.books
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );
