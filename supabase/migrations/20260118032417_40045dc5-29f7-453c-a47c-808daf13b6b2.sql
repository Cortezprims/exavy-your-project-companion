-- Add missing UPDATE policies for tables that need them
CREATE POLICY "Users can update their own decks"
ON public.flashcard_decks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
ON public.quizzes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries"
ON public.summaries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mind maps"
ON public.mind_maps FOR UPDATE
USING (auth.uid() = user_id);

-- Add missing DELETE policies for data management
CREATE POLICY "Users can delete their own tips"
ON public.daily_tips_shown FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exabot profile"
ON public.exabot_profiles FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own usage tracking"
ON public.usage_tracking FOR DELETE
USING (auth.uid() = user_id);

-- Create exercises table for exercise generator feature (Premium)
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  exercise_type TEXT NOT NULL DEFAULT 'practice',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  solutions JSONB NOT NULL DEFAULT '[]'::jsonb,
  hints JSONB DEFAULT '[]'::jsonb,
  concept TEXT,
  variant_number INTEGER DEFAULT 1,
  time_estimate_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercises"
ON public.exercises FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercises"
ON public.exercises FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises"
ON public.exercises FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises"
ON public.exercises FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create presentations table for presentation generator (Premium)
CREATE TABLE public.presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  theme TEXT DEFAULT 'modern',
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  speaker_notes JSONB DEFAULT '[]'::jsonb,
  design_settings JSONB DEFAULT '{}'::jsonb,
  export_format TEXT DEFAULT 'pdf',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own presentations"
ON public.presentations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presentations"
ON public.presentations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations"
ON public.presentations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations"
ON public.presentations FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_presentations_updated_at
BEFORE UPDATE ON public.presentations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create projects table for project manager
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create tasks table for to-do lists
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notes table for bloc notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_pinned BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#ffffff',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
ON public.notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
ON public.notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();