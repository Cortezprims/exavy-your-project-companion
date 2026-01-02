-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcard_decks table
CREATE TABLE public.flashcard_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create summaries table
CREATE TABLE public.summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  short_summary TEXT,
  long_summary TEXT,
  key_concepts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mind_maps table
CREATE TABLE public.mind_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;

-- Quizzes policies
CREATE POLICY "Users can view their own quizzes" ON public.quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quizzes" ON public.quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quizzes" ON public.quizzes FOR DELETE USING (auth.uid() = user_id);

-- Flashcard decks policies
CREATE POLICY "Users can view their own decks" ON public.flashcard_decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own decks" ON public.flashcard_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own decks" ON public.flashcard_decks FOR DELETE USING (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Users can view their own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- Summaries policies
CREATE POLICY "Users can view their own summaries" ON public.summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own summaries" ON public.summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own summaries" ON public.summaries FOR DELETE USING (auth.uid() = user_id);

-- Mind maps policies
CREATE POLICY "Users can view their own mind maps" ON public.mind_maps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own mind maps" ON public.mind_maps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mind maps" ON public.mind_maps FOR DELETE USING (auth.uid() = user_id);