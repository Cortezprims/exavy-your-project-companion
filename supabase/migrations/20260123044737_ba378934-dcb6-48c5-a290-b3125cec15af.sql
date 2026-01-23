-- Create table for PawaPay transactions
CREATE TABLE IF NOT EXISTS public.pawapay_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deposit_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  phone_number TEXT NOT NULL,
  provider TEXT NOT NULL,
  subscription_plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'INITIATED',
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  callback_received BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.pawapay_transactions ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_pawapay_transactions_user_id ON public.pawapay_transactions(user_id);
CREATE INDEX idx_pawapay_transactions_deposit_id ON public.pawapay_transactions(deposit_id);

-- RLS policies
CREATE POLICY "Users can view their own transactions"
ON public.pawapay_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update (edge functions)
CREATE POLICY "Service role can manage all transactions"
ON public.pawapay_transactions
FOR ALL
USING (true)
WITH CHECK (true);