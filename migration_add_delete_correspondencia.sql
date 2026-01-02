-- Allow authenticated users to delete correspondence
CREATE POLICY "Allow delete access for authenticated users" ON correspondencias
    FOR DELETE USING (auth.role() = 'authenticated');
