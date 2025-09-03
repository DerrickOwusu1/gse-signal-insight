-- Fix alerts table RLS policy to prevent data exposure
DROP POLICY IF EXISTS "Users can view all alerts or their own alerts" ON public.alerts;

-- Create new policy that only allows users to view their own alerts
CREATE POLICY "Users can view own alerts only" 
ON public.alerts 
FOR SELECT 
USING (auth.uid() = user_id);