-- Create exercise_sets table to store AI-generated exercises
CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('n5', 'n4', 'n3', 'n2', 'n1')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('vocabulary', 'grammar', 'reading', 'kanji', 'mixed')),
  questions JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  generated_by VARCHAR(100) DEFAULT 'gemini-2.0-flash',
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_exercise_sets_level_type ON public.exercise_sets(level, type);
CREATE INDEX idx_exercise_sets_created_at ON public.exercise_sets(created_at DESC);
CREATE INDEX idx_exercise_sets_created_by ON public.exercise_sets(created_by);

-- Create study_materials table for source data
CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('n5', 'n4', 'n3', 'n2', 'n1')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('vocabulary', 'grammar', 'kanji')),
  content JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for study_materials
CREATE INDEX idx_study_materials_level_type ON public.study_materials(level, type);
CREATE INDEX idx_study_materials_tags ON public.study_materials USING GIN(tags);
CREATE INDEX idx_study_materials_active ON public.study_materials(is_active);

-- Create exercise_statistics table for anonymous tracking
CREATE TABLE IF NOT EXISTS public.exercise_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_set_id UUID REFERENCES public.exercise_sets(id) ON DELETE CASCADE,
  difficulty_rating DECIMAL(3,2) CHECK (difficulty_rating >= 0 AND difficulty_rating <= 5),
  completion_rate DECIMAL(3,2) CHECK (completion_rate >= 0 AND completion_rate <= 1),
  average_score DECIMAL(3,2) CHECK (average_score >= 0 AND average_score <= 1),
  total_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for statistics
CREATE INDEX idx_exercise_statistics_set_id ON public.exercise_statistics(exercise_set_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_exercise_sets_updated_at BEFORE UPDATE ON public.exercise_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_materials_updated_at BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_statistics_updated_at BEFORE UPDATE ON public.exercise_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_sets
-- Everyone can read exercise sets
CREATE POLICY "Exercise sets are viewable by everyone" ON public.exercise_sets
  FOR SELECT USING (true);

-- Authenticated users can create exercise sets
CREATE POLICY "Authenticated users can create exercise sets" ON public.exercise_sets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own exercise sets
CREATE POLICY "Users can update own exercise sets" ON public.exercise_sets
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for study_materials
-- Everyone can read study materials
CREATE POLICY "Study materials are viewable by everyone" ON public.study_materials
  FOR SELECT USING (true);

-- Only admins can modify study materials (implement admin check as needed)
CREATE POLICY "Admins can insert study materials" ON public.study_materials
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for exercise_statistics
-- Everyone can read statistics
CREATE POLICY "Statistics are viewable by everyone" ON public.exercise_statistics
  FOR SELECT USING (true);

-- Anyone can insert statistics (anonymous tracking)
CREATE POLICY "Anyone can insert statistics" ON public.exercise_statistics
  FOR INSERT WITH CHECK (true);

-- Sample data for testing (optional - comment out in production)
-- INSERT INTO public.study_materials (level, type, content, tags) VALUES
-- ('n5', 'vocabulary', '{"word": "本", "reading": "ほん", "meaning": "book", "example": "これは本です。"}', '{"noun", "common"}'),
-- ('n5', 'vocabulary', '{"word": "水", "reading": "みず", "meaning": "water", "example": "水を飲みます。"}', '{"noun", "common"}'),
-- ('n5', 'grammar', '{"pattern": "これ/それ/あれ", "meaning": "this/that/that over there", "example": "これは本です。"}', '{"demonstrative", "basic"}');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
