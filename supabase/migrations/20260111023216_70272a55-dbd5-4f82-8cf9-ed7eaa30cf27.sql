-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'monthly', 'yearly');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usage tracking table (resets monthly)
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  documents_count INTEGER NOT NULL DEFAULT 0,
  quizzes_count INTEGER NOT NULL DEFAULT 0,
  flashcards_count INTEGER NOT NULL DEFAULT 0,
  summaries_count INTEGER NOT NULL DEFAULT 0,
  mind_maps_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS policies for usage_tracking
CREATE POLICY "Users can view their own usage"
ON public.usage_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.usage_tracking FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.usage_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to get user plan limits
CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_type subscription_plan)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE plan_type
    WHEN 'free' THEN
      RETURN jsonb_build_object(
        'documents_limit', 3,
        'quizzes_limit', 10,
        'flashcards_limit', 20,
        'summaries_limit', 3,
        'mind_maps_limit', 3,
        'has_planning', false,
        'has_transcription', false,
        'has_offline', false
      );
    WHEN 'monthly', 'yearly' THEN
      RETURN jsonb_build_object(
        'documents_limit', -1,
        'quizzes_limit', -1,
        'flashcards_limit', -1,
        'summaries_limit', -1,
        'mind_maps_limit', -1,
        'has_planning', true,
        'has_transcription', true,
        'has_offline', true
      );
    ELSE
      RETURN jsonb_build_object(
        'documents_limit', 3,
        'quizzes_limit', 10,
        'flashcards_limit', 20,
        'summaries_limit', 3,
        'mind_maps_limit', 3,
        'has_planning', false,
        'has_transcription', false,
        'has_offline', false
      );
  END CASE;
END;
$$;

-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id UUID,
  p_resource_type TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan subscription_plan;
  v_limits jsonb;
  v_usage RECORD;
  v_limit_key TEXT;
  v_count_key TEXT;
  v_current_count INTEGER;
  v_limit_value INTEGER;
BEGIN
  -- Get user's current plan
  SELECT plan INTO v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  AND (expires_at IS NULL OR expires_at > now());
  
  -- Default to free if no subscription
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;
  
  -- Get limits for plan
  v_limits := public.get_plan_limits(v_plan);
  
  -- Get or create usage tracking
  SELECT * INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id;
  
  -- Reset if new month
  IF v_usage IS NOT NULL AND v_usage.period_start < date_trunc('month', now()) THEN
    UPDATE public.usage_tracking
    SET documents_count = 0,
        quizzes_count = 0,
        flashcards_count = 0,
        summaries_count = 0,
        mind_maps_count = 0,
        period_start = date_trunc('month', now()),
        updated_at = now()
    WHERE user_id = p_user_id;
    
    SELECT * INTO v_usage FROM public.usage_tracking WHERE user_id = p_user_id;
  END IF;
  
  -- If no usage record, create one
  IF v_usage IS NULL THEN
    INSERT INTO public.usage_tracking (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_usage;
  END IF;
  
  -- Determine which limit to check
  v_limit_key := p_resource_type || '_limit';
  v_count_key := p_resource_type || '_count';
  
  -- Get current count
  CASE p_resource_type
    WHEN 'documents' THEN v_current_count := v_usage.documents_count;
    WHEN 'quizzes' THEN v_current_count := v_usage.quizzes_count;
    WHEN 'flashcards' THEN v_current_count := v_usage.flashcards_count;
    WHEN 'summaries' THEN v_current_count := v_usage.summaries_count;
    WHEN 'mind_maps' THEN v_current_count := v_usage.mind_maps_count;
    ELSE v_current_count := 0;
  END CASE;
  
  -- Get limit value
  v_limit_value := (v_limits ->> v_limit_key)::INTEGER;
  
  -- Check if unlimited (-1) or under limit
  IF v_limit_value = -1 OR v_current_count < v_limit_value THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'current', v_current_count,
      'limit', v_limit_value,
      'plan', v_plan
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', false,
      'current', v_current_count,
      'limit', v_limit_value,
      'plan', v_plan,
      'message', 'Limite atteinte. Passez à Premium pour un accès illimité.'
    );
  END IF;
END;
$$;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_resource_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure usage record exists
  INSERT INTO public.usage_tracking (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Reset if new month
  UPDATE public.usage_tracking
  SET documents_count = 0,
      quizzes_count = 0,
      flashcards_count = 0,
      summaries_count = 0,
      mind_maps_count = 0,
      period_start = date_trunc('month', now()),
      updated_at = now()
  WHERE user_id = p_user_id
  AND period_start < date_trunc('month', now());
  
  -- Increment the appropriate counter
  CASE p_resource_type
    WHEN 'documents' THEN
      UPDATE public.usage_tracking SET documents_count = documents_count + 1, updated_at = now() WHERE user_id = p_user_id;
    WHEN 'quizzes' THEN
      UPDATE public.usage_tracking SET quizzes_count = quizzes_count + 1, updated_at = now() WHERE user_id = p_user_id;
    WHEN 'flashcards' THEN
      UPDATE public.usage_tracking SET flashcards_count = flashcards_count + 1, updated_at = now() WHERE user_id = p_user_id;
    WHEN 'summaries' THEN
      UPDATE public.usage_tracking SET summaries_count = summaries_count + 1, updated_at = now() WHERE user_id = p_user_id;
    WHEN 'mind_maps' THEN
      UPDATE public.usage_tracking SET mind_maps_count = mind_maps_count + 1, updated_at = now() WHERE user_id = p_user_id;
  END CASE;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
BEFORE UPDATE ON public.usage_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();