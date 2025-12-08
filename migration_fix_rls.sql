-- Ensure Authenticated Users can view Oficios data
-- Using DO block to avoid errors if policy already exists

DO $$
BEGIN
    -- Policy for Categories
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'oficio_categories' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" 
        ON "public"."oficio_categories" 
        AS PERMISSIVE FOR SELECT 
        TO "authenticated" 
        USING (true);
    END IF;

    -- Policy for Templates
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'oficio_templates' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" 
        ON "public"."oficio_templates" 
        AS PERMISSIVE FOR SELECT 
        TO "authenticated" 
        USING (true);
    END IF;
END
$$;
