-- Add default_app column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS default_app TEXT CHECK (default_app IN ('sii', 'sp', 'sg')) DEFAULT 'sii';

-- Optional: Update existing users to 'sii' if null (though DEFAULT handles new/future)
UPDATE profiles SET default_app = 'sii' WHERE default_app IS NULL;
