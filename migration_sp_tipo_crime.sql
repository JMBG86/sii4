-- Create SP Tipo Crime table
CREATE TABLE IF NOT EXISTS sp_tipo_crime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial crime types
INSERT INTO sp_tipo_crime (nome) VALUES 
('Furto em interior de residencia'),
('Roubo'),
('Trafico de Estupefacientes'),
('Condução sem habilitação'),
('Outro furtos em veículo motorizado'),
('Furto de Oportunidade'),
('Carteirista'),
('Burla'),
('Burla informatica'),
('Abuso de confiança'),
('Furto em interior de veículo')
ON CONFLICT (nome) DO NOTHING;

-- RLS Policies
ALTER TABLE sp_tipo_crime ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write for authenticated users only" ON sp_tipo_crime
    FOR ALL USING (auth.role() = 'authenticated');
