CREATE TABLE IF NOT EXISTS correspondencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    srv TEXT NOT NULL,
    numero_oficio TEXT NOT NULL,
    nuipc TEXT,
    origem TEXT NOT NULL,
    assunto TEXT NOT NULL,
    destino TEXT NOT NULL,
    data_entrada DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE correspondencias ENABLE ROW LEVEL SECURITY;

-- Create policy for reading (allow authenticated users for now, can be restricted to SP access later)
CREATE POLICY "Allow read access for authenticated users" ON correspondencias
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for inserting
CREATE POLICY "Allow insert access for authenticated users" ON correspondencias
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for updating
CREATE POLICY "Allow update access for authenticated users" ON correspondencias
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Index for searching NUIPC
CREATE INDEX idx_correspondencias_nuipc ON correspondencias(nuipc);
