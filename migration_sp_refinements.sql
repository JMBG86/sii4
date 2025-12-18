-- Refine sp_criancas_info
ALTER TABLE sp_criancas_info DROP COLUMN IF EXISTS nacionalidade;
ALTER TABLE sp_criancas_info DROP COLUMN IF EXISTS quantidade;
ALTER TABLE sp_criancas_info DROP COLUMN IF EXISTS sexo;

ALTER TABLE sp_criancas_info ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE sp_criancas_info ADD COLUMN IF NOT EXISTS idade integer;

-- Create sp_apreensoes_drogas
CREATE TABLE IF NOT EXISTS sp_apreensoes_drogas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    processo_id uuid REFERENCES sp_processos_crime(id) ON DELETE CASCADE UNIQUE, -- ensure 1:1
    heroina_g numeric(10,3),
    cocaina_g numeric(10,3),
    cannabis_folhas_g numeric(10,3),
    cannabis_resina_g numeric(10,3),
    cannabis_oleo_g numeric(10,3),
    sinteticas_g numeric(10,3),
    cannabis_plantas_un integer,
    substancias_psicoativas_un integer,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE sp_apreensoes_drogas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON sp_apreensoes_drogas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON sp_apreensoes_drogas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON sp_apreensoes_drogas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON sp_apreensoes_drogas FOR DELETE USING (auth.role() = 'authenticated');
