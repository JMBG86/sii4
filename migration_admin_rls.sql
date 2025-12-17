-- Allow Admins to update any inquiry
CREATE POLICY "Admins can update any inquiry"
ON inqueritos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow Admins to delete any inquiry
CREATE POLICY "Admins can delete any inquiry"
ON inqueritos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
