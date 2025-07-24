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

-- Study sessions table (for detailed tracking)
CREATE TABLE public.study_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    session_type TEXT NOT NULL, -- 'exam', 'practice', 'review'
    duration INTEGER NOT NULL, -- Duration in seconds
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    topics_covered TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT valid_duration CHECK (duration >= 0),
    CONSTRAINT valid_session_time CHECK (ended_at >= started_at),
    CONSTRAINT valid_answers_count CHECK (correct_answers >= 0 AND correct_answers <= questions_answered)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_exam_results_user_id ON public.exam_results(user_id);
CREATE INDEX idx_exam_results_type_level ON public.exam_results(exam_type, exam_level);
CREATE INDEX idx_exam_results_created_at ON public.exam_results(created_at DESC);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_started_at ON public.study_sessions(started_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

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

-- Study sessions policies
CREATE POLICY "Users can view own study sessions" ON public.study_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON public.study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- Function to calculate and update user progress
CREATE OR REPLACE FUNCTION public.update_user_progress_stats(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_time INTEGER;
    total_exams INTEGER;
    best_challenge DECIMAL(5,2);
    current_streak INTEGER;
BEGIN
    -- Calculate total study time from exam results
    SELECT COALESCE(SUM(time_spent), 0) INTO total_time
    FROM public.exam_results
    WHERE user_id = user_uuid;

    -- Calculate total exams taken
    SELECT COUNT(*) INTO total_exams
    FROM public.exam_results
    WHERE user_id = user_uuid;

    -- Calculate best challenge score
    SELECT COALESCE(MAX(score), 0) INTO best_challenge
    FROM public.exam_results
    WHERE user_id = user_uuid AND exam_type = 'CHALLENGE';

    -- Calculate current challenge streak (simplified)
    SELECT COALESCE(COUNT(*), 0) INTO current_streak
    FROM public.exam_results
    WHERE user_id = user_uuid
      AND exam_type = 'CHALLENGE'
      AND score >= 80
      AND created_at >= NOW() - INTERVAL '7 days';

    -- Update user progress
    UPDATE public.user_progress
    SET
        total_study_time = total_time,
        total_exams_taken = total_exams,
        challenge_best_score = best_challenge,
        challenge_streak = current_streak,
        last_activity = NOW(),
        updated_at = NOW()
    WHERE user_id = user_uuid;
END;
$$ language 'plpgsql' SECURITY DEFINER;
