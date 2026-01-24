-- Fix OTP codes RLS policies - make them more restrictive
DROP POLICY IF EXISTS "Anyone can insert OTP codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Anyone can verify OTP codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Anyone can update OTP codes" ON public.otp_codes;

-- Service role will handle OTP operations via edge functions
CREATE POLICY "Service role can manage OTP codes"
ON public.otp_codes FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);