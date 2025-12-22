-- Create Configuration Table for Fiscal Years
CREATE TABLE IF NOT EXISTS sp_config_years (
    year INTEGER PRIMARY KEY,
    stock_processos_start INTEGER DEFAULT 0,
    stock_precatorias_start INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add 'ano' column to sp_processos_crime
ALTER TABLE sp_processos_crime ADD COLUMN IF NOT EXISTS ano INTEGER DEFAULT 2025;

-- IMPORTANT: Handle Unique Constraints
-- We need to DROP the existing Unique constraint on 'numero_sequencial' if it exists.
-- Since we don't know the exact name, we try the standard naming convention.
ALTER TABLE sp_processos_crime DROP CONSTRAINT IF EXISTS sp_processos_crime_numero_sequencial_key;
-- Also try other potential names just in case
ALTER TABLE sp_processos_crime DROP CONSTRAINT IF EXISTS sp_processos_crime_numero_sequencial_unique;

-- Create Composite Unique Constraint
-- Do this ONLY if we successfully dropped the global one, or if it didn't exist.
-- To be safe, we add a new constraint that includes 'ano'.
ALTER TABLE sp_processos_crime
    ADD CONSTRAINT sp_processos_crime_ano_sequencial_key UNIQUE (ano, numero_sequencial);

-- RLS Policies for Config Years
ALTER TABLE sp_config_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sp_config_years;
CREATE POLICY "Enable read access for authenticated users" ON sp_config_years
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sp_config_years;
CREATE POLICY "Enable all access for authenticated users" ON sp_config_years
    FOR ALL TO authenticated USING (true);
