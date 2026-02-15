
-- Create a function that auto-assigns admin role to avydigitalbusiness@gmail.com on sign-in
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the new user's email is the admin email, assign admin role
  IF NEW.email = 'avydigitalbusiness@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
CREATE OR REPLACE TRIGGER on_auth_user_created_assign_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_admin_role();
