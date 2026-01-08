-- Add access_sg column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS access_sg BOOLEAN DEFAULT FALSE;

-- Update role check constraint if it exists, or just document the valid values.
-- Since Supabase/Postgres constraints might be named differently, we'll try to drop and recreate the check if it's strict.
-- Assuming there might be a check constraint on 'role'. 

DO $$ 
BEGIN 
    -- Try to drop constraint if it exists (common naming convention)
    BEGIN
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Add the constraint back with 'sargento'
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'readonly', 'sargento'));

END $$;

-- Policies for SG Access
-- Assume simple policy: users can read their own profile. Admins/Sargentos might read all?
-- For now, existing RLS likely covers basic profile reading.
-- We might need to ensure 'sargento' has admin-like privileges if that's the requirement.

-- Grant sargento same access as admin for now if policies look for 'admin' string.
-- This might require updating MULTIPLE policies across the DB if they hardcode 'admin'.
-- For this migration, we just set up the column and role. 
-- We will need to grep for 'admin' in RLS policies or code later to ensure Full Access.
