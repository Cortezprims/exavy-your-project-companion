-- Add category column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create project_documents junction table to pin documents to projects
CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  is_pinned BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, document_id)
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project documents"
ON public.project_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project documents"
ON public.project_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project documents"
ON public.project_documents FOR DELETE
USING (auth.uid() = user_id);

-- Create otp_codes table for email verification
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert OTP codes (needed for signup flow)
CREATE POLICY "Anyone can insert OTP codes"
ON public.otp_codes FOR INSERT
WITH CHECK (true);

-- Allow anyone to select their own OTP codes by email
CREATE POLICY "Anyone can verify OTP codes"
ON public.otp_codes FOR SELECT
USING (true);

-- Allow updates to mark as verified
CREATE POLICY "Anyone can update OTP codes"
ON public.otp_codes FOR UPDATE
USING (true);

-- Create function to auto-create 3-day trial subscription for new users
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create a 3-day trial premium subscription for new users
  INSERT INTO public.subscriptions (user_id, plan, status, started_at, expires_at)
  VALUES (
    NEW.id,
    'monthly',
    'active',
    now(),
    now() + INTERVAL '3 days'
  );
  RETURN NEW;
END;
$$;

-- Note: The trigger on auth.users cannot be created here, we'll handle trial creation in the auth flow instead