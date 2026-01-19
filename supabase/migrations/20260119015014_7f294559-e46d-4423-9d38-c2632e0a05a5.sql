-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin (for subscription bypass)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can create tickets
CREATE POLICY "Users can create tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Admins can manage all tickets
CREATE POLICY "Admins can manage tickets"
ON public.support_tickets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_sessions table for tracking logins
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  logged_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own sessions
CREATE POLICY "Users can insert their sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create user_blocks table
CREATE TABLE public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  is_permanent BOOLEAN DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocks
CREATE POLICY "Admins can manage blocks"
ON public.user_blocks
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can check if they are blocked
CREATE POLICY "Users can check their own block status"
ON public.user_blocks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE user_id = _user_id
      AND (is_permanent = true OR blocked_until > now())
  )
$$;

-- Update check_usage_limit to bypass for admins
CREATE OR REPLACE FUNCTION public.check_usage_limit(p_user_id uuid, p_resource_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  -- Check if user is admin - bypass all limits
  IF public.is_admin(p_user_id) THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'current', 0,
      'limit', -1,
      'plan', 'admin'
    );
  END IF;

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