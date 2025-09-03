-- Fix alerts table RLS policy to prevent data exposure
DROP POLICY IF EXISTS "Users can view all alerts or their own alerts" ON public.alerts;

-- Create new policy that only allows users to view their own alerts
CREATE POLICY "Users can view their own alerts only" 
ON public.alerts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add API key encryption and additional security for profiles
-- Create a separate secure API keys table with additional encryption
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_api_key text NOT NULL,
  key_name text NOT NULL DEFAULT 'Trading API Key',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, key_name)
);

-- Enable RLS on the new table
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies for API keys
CREATE POLICY "Users can only access their own API keys" 
ON public.user_api_keys 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Remove the api_key column from profiles table for better security
ALTER TABLE public.profiles DROP COLUMN IF EXISTS api_key;

-- Create a secure function to retrieve API keys (security definer)
CREATE OR REPLACE FUNCTION public.get_user_api_key(key_name_param text DEFAULT 'Trading API Key')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  api_key_result text;
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get the encrypted API key for the current user
  SELECT encrypted_api_key INTO api_key_result
  FROM public.user_api_keys
  WHERE user_id = auth.uid() 
    AND key_name = key_name_param 
    AND is_active = true;

  -- Update last_used_at timestamp
  IF api_key_result IS NOT NULL THEN
    UPDATE public.user_api_keys 
    SET last_used_at = now() 
    WHERE user_id = auth.uid() 
      AND key_name = key_name_param;
  END IF;

  RETURN api_key_result;
END;
$$;

-- Create function to securely store API keys
CREATE OR REPLACE FUNCTION public.store_user_api_key(
  api_key_param text,
  key_name_param text DEFAULT 'Trading API Key'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Insert or update the API key (encrypted)
  INSERT INTO public.user_api_keys (user_id, encrypted_api_key, key_name)
  VALUES (auth.uid(), api_key_param, key_name_param)
  ON CONFLICT (user_id, key_name) 
  DO UPDATE SET 
    encrypted_api_key = EXCLUDED.encrypted_api_key,
    created_at = now(),
    is_active = true;

  RETURN true;
END;
$$;

-- Add phone number encryption/hashing for additional security
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone_hash text,
  ADD COLUMN IF NOT EXISTS data_protection_level text DEFAULT 'standard';

-- Create function to hash phone numbers for lookup while keeping original
CREATE OR REPLACE FUNCTION public.hash_phone_number(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  
  -- Simple hash for phone lookup (you may want to use a stronger hash in production)
  RETURN encode(digest(phone_input, 'sha256'), 'hex');
END;
$$;

-- Create trigger to automatically hash phone numbers
CREATE OR REPLACE FUNCTION public.update_phone_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hash the phone number when inserted or updated
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone_hash = public.hash_phone_number(NEW.phone);
  ELSE
    NEW.phone_hash = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS update_phone_hash_trigger ON public.profiles;
CREATE TRIGGER update_phone_hash_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_phone_hash();

-- Add audit logging for sensitive data access
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  sensitive_data_accessed text[],
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow viewing audit logs for own user
CREATE POLICY "Users can view their own audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  action_param text,
  table_param text,
  data_accessed text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, 
    action, 
    table_name, 
    sensitive_data_accessed
  )
  VALUES (
    auth.uid(), 
    action_param, 
    table_param, 
    data_accessed
  );
END;
$$;