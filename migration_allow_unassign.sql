-- Allow users to "give up" an inquiry (set user_id to NULL)
-- This is necessary because the standard update policy usually requires user_id = auth.uid() for both old and new rows.

CREATE POLICY "Users can unassign themselves"
ON inqueritos
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id IS NULL);
