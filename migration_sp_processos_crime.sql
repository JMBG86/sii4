-- Create SP Entidades table
CREATE TABLE IF NOT EXISTS sp_entidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial entities
INSERT INTO sp_entidades (nome) VALUES 
('SII ALBUFEIRA'),
('DIAP ALBUFEIRA'),
('PJ FARO')
ON CONFLICT (nome) DO NOTHING;

-- Create SP Processos Crime table
CREATE TABLE IF NOT EXISTS sp_processos_crime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_sequencial INTEGER UNIQUE NOT NULL, -- The 1-4000 number
    nuipc_completo TEXT,
    data_registo DATE,
    detidos BOOLEAN DEFAULT FALSE,
    nacionalidade TEXT,
    localizacao TEXT,
    tipo_crime TEXT,
    denunciante TEXT,
    vitima TEXT, -- Vitima/Lesado/Ofendido
    arguido TEXT, -- Arguido/Suspeito
    envio_em DATE,
    numero_oficio_envio TEXT,
    entidade_destino TEXT, -- Stores the name directly for simplicity, or could reference ID. Text is safer for "historic" if entity name changes.
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 4000 slots
INSERT INTO sp_processos_crime (numero_sequencial)
SELECT generate_series(1, 4000)
ON CONFLICT (numero_sequencial) DO NOTHING;

-- RLS Policies (Standard)
ALTER TABLE sp_entidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_processos_crime ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write for authenticated users only" ON sp_entidades
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read/write for authenticated users only" ON sp_processos_crime
    FOR ALL USING (auth.role() = 'authenticated');
