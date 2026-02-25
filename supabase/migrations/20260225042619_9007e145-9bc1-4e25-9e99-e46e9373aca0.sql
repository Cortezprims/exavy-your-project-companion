
-- Set default value for user_id to auth.uid()
ALTER TABLE public.support_tickets ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Create trigger to force user_id = auth.uid() on insert (defense in depth)
CREATE OR REPLACE FUNCTION public.set_support_ticket_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_support_ticket_user_id
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_support_ticket_user_id();
