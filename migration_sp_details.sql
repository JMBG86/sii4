-- Add 'sexo' to sp_detidos_info
ALTER TABLE sp_detidos_info ADD COLUMN IF NOT EXISTS sexo text;

-- Add new flags to sp_processos_crime
ALTER TABLE sp_processos_crime ADD COLUMN IF NOT EXISTS criancas_sinalizadas boolean DEFAULT false;
ALTER TABLE sp_processos_crime ADD COLUMN IF NOT EXISTS apreensoes boolean DEFAULT false;

-- Create sp_criancas_info
CREATE TABLE IF NOT EXISTS sp_criancas_info (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    processo_id uuid REFERENCES sp_processos_crime(id) ON DELETE CASCADE,
    nacionalidade text,
    quantidade integer,
    sexo text,
    created_at timestamptz DEFAULT now()
);

-- Create sp_apreensoes_info
CREATE TABLE IF NOT EXISTS sp_apreensoes_info (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    processo_id uuid REFERENCES sp_processos_crime(id) ON DELETE CASCADE,
    tipo text, -- 'Estupefacientes', 'Armas', etc.
    quantidade text, -- Using text to allow "500g", "2 Unidades" etc, or stick to integer if user wants strict counting. User said "Existem Apreensões". Usually free text description + Qty.
    descricao text,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE sp_criancas_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_apreensoes_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON sp_criancas_info FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON sp_criancas_info FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON sp_criancas_info FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON sp_criancas_info FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON sp_apreensoes_info FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON sp_apreensoes_info FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON sp_apreensoes_info FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON sp_apreensoes_info FOR DELETE USING (auth.role() = 'authenticated');
