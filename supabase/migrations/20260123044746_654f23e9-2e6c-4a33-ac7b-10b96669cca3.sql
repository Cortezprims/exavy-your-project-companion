-- Fix overly permissive RLS policy
DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.pawapay_transactions;

-- Add policy for admins to view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.pawapay_transactions
FOR SELECT
USING (public.is_admin(auth.uid()));