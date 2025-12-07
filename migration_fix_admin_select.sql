-- Drop the restrictive select policy
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.inqueritos;

-- Create a new select policy that allows:
-- 1. Users to see their own inquiries (user_id = auth.uid())
-- 2. Admins to see ALL inquiries
CREATE POLICY "Enable select for users and admins" ON public.inqueritos 
FOR SELECT USING (
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
