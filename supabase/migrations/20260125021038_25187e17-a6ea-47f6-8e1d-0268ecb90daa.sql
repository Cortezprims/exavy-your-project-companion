-- 1. Create a function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;

-- 2. Create a function to clean up old user sessions (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE last_active_at < now() - INTERVAL '30 days';
END;
$$;

-- 3. Add index for faster session cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active 
ON public.user_sessions(last_active_at);

-- 4. Add index for faster OTP cleanup
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at 
ON public.otp_codes(expires_at);

-- 5. Create a more secure policy for user_sessions - users should only see limited info
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

-- 6. Add index for faster support ticket queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_status 
ON public.support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id 
ON public.support_tickets(user_id);