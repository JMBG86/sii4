-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.inqueritos;

-- Create a new insert policy that allows:
-- 1. Users to insert for themselves (user_id = auth.uid())
-- 2. Admins to insert for anyone (exists a profile for auth.uid() with role 'admin')
CREATE POLICY "Enable insert for users and admins" ON public.inqueritos 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
