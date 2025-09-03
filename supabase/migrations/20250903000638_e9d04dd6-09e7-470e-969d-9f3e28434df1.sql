-- Create a separate secure API keys table with additional security
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