-- Add phone number security measures (since migration failed, check if table exists first)
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'phone_hash') THEN
    ALTER TABLE public.profiles ADD COLUMN phone_hash text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'data_protection_level') THEN
    ALTER TABLE public.profiles ADD COLUMN data_protection_level text DEFAULT 'standard';
  END IF;
END $$;

-- Create function to hash phone numbers
CREATE OR REPLACE FUNCTION public.hash_phone_number(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(digest(phone_input, 'sha256'), 'hex');
END;
$$;

-- Create or replace trigger function for phone hashing
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

-- Drop and recreate the trigger to ensure it's properly configured
DROP TRIGGER IF EXISTS update_phone_hash_trigger ON public.profiles;
CREATE TRIGGER update_phone_hash_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_phone_hash();