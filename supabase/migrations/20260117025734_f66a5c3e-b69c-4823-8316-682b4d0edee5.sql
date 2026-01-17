-- Create table for offline content sync tracking
CREATE TABLE public.offline_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'document', 'quiz', 'flashcard', 'mindmap', 'summary'
  content_id UUID NOT NULL,
  compressed_data TEXT, -- Base64 compressed content
  file_size INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE public.offline_content ENABLE ROW LEVEL SECURITY;

-- RLS policies for offline_content
CREATE POLICY "Users can view their own offline content"
ON public.offline_content FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own offline content"
ON public.offline_content FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offline content"
ON public.offline_content FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offline content"
ON public.offline_content FOR DELETE
USING (auth.uid() = user_id);

-- Create table for EXABOT conversation history and user profile
CREATE TABLE public.exabot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  personality_type TEXT DEFAULT 'encouraging', -- 'encouraging', 'strict', 'friendly', 'analytical'
  study_preferences JSONB DEFAULT '{}',
  learning_style TEXT DEFAULT 'visual', -- 'visual', 'auditory', 'kinesthetic', 'reading'
  optimal_study_times JSONB DEFAULT '[]', -- Array of preferred times
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  burnout_score INTEGER DEFAULT 0, -- 0-100, tracked over time
  total_study_minutes INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_break_suggestion_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exabot_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for exabot_profiles
CREATE POLICY "Users can view their own exabot profile"
ON public.exabot_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exabot profile"
ON public.exabot_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exabot profile"
ON public.exabot_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create table for generated exams
CREATE TABLE public.mock_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL, -- 'bac', 'brevet', 'concours', 'custom'
  subject TEXT, -- 'math', 'physics', 'french', etc.
  duration_minutes INTEGER DEFAULT 120,
  total_points INTEGER DEFAULT 20,
  questions JSONB NOT NULL DEFAULT '[]',
  grading_scale JSONB DEFAULT '{}', -- Barème de notation
  instructions TEXT,
  difficulty TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'draft', -- 'draft', 'in_progress', 'completed'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  user_score NUMERIC(5,2),
  user_answers JSONB DEFAULT '{}',
  ai_feedback JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mock_exams ENABLE ROW LEVEL SECURITY;

-- RLS policies for mock_exams
CREATE POLICY "Users can view their own mock exams"
ON public.mock_exams FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mock exams"
ON public.mock_exams FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mock exams"
ON public.mock_exams FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mock exams"
ON public.mock_exams FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_offline_content_updated_at
BEFORE UPDATE ON public.offline_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exabot_profiles_updated_at
BEFORE UPDATE ON public.exabot_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mock_exams_updated_at
BEFORE UPDATE ON public.mock_exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();