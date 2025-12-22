-- Enable RLS on the table
ALTER TABLE phonebook_entries ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (or public if needed)
CREATE POLICY "Allow read access to all users" ON phonebook_entries
    FOR SELECT
    USING (true);

-- Allow all actions (Insert, Update, Delete) to authenticated users
-- You can restrict this to specific roles if needed, e.g. using (auth.role() = 'service_role')
-- But for this usage, we'll allow any logged in user.
CREATE POLICY "Allow full access to authenticated users" ON phonebook_entries
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
