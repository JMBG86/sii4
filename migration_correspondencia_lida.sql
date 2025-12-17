-- Add read status to correspondence
ALTER TABLE correspondencias 
ADD COLUMN lida BOOLEAN DEFAULT FALSE;

-- Update RLS if necessary (usually existing policies cover updates if robust, otherwise allow update)
-- Assuming investigators can update correspondence related to their inquiries?
-- Currently RLS for correspondence might be restricted to SP users or read-only for SII.
-- We need to ensure SII users can UPDATE 'lida' field.

-- Let's check policies later, but first the column.
