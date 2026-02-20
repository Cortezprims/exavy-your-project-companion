
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow insert from service role" ON public.notifications;

-- Drop the duplicate user insert policy  
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create proper insert policy allowing service role and user inserts
CREATE POLICY "Anyone can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Attach trigger for auto trial subscription on new user
CREATE OR REPLACE FUNCTION public.create_trial_and_notifications()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Create a 3-day trial premium subscription
  INSERT INTO public.subscriptions (user_id, plan, status, started_at, expires_at)
  VALUES (
    NEW.id,
    'monthly',
    'active',
    now(),
    now() + INTERVAL '3 days'
  );

  -- Welcome notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Bienvenue sur EXAVY ! 🎉',
    'De la part de l''équipe d''Exavy, nous sommes ravis de vous accueillir. Explorez nos outils d''apprentissage intelligent pour booster vos révisions !',
    'welcome'
  );

  -- Trial notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Essai Premium offert ! 🎁',
    'Vous avez reçu 03 jours d''essai gratuits de l''abonnement Premium. Profitez de toutes les fonctionnalités sans limite !',
    'trial'
  );

  RETURN NEW;
END;
$$;

-- Attach to auth.users on insert
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_and_notifications();
