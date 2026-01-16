-- Create table to track shown daily tips (to avoid repeating)
CREATE TABLE public.daily_tips_shown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tip_hash TEXT NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tip_hash)
);

-- Enable RLS
ALTER TABLE public.daily_tips_shown ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own shown tips"
ON public.daily_tips_shown FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shown tips"
ON public.daily_tips_shown FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create table for weekly report preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  weekly_reports_enabled BOOLEAN NOT NULL DEFAULT true,
  email TEXT,
  last_report_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create weekly stats table for reports
CREATE TABLE public.weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  documents_created INTEGER NOT NULL DEFAULT 0,
  quizzes_created INTEGER NOT NULL DEFAULT 0,
  flashcards_created INTEGER NOT NULL DEFAULT 0,
  summaries_created INTEGER NOT NULL DEFAULT 0,
  mind_maps_created INTEGER NOT NULL DEFAULT 0,
  study_time_minutes INTEGER NOT NULL DEFAULT 0,
  goals_set INTEGER NOT NULL DEFAULT 0,
  goals_achieved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_stats
CREATE POLICY "Users can view their own weekly stats"
ON public.weekly_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage weekly stats"
ON public.weekly_stats FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();