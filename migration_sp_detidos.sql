CREATE TABLE IF NOT EXISTS sp_detidos_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID REFERENCES sp_processos_crime(id) ON DELETE CASCADE,
    nacionalidade TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sp_detidos_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write for authenticated users only" ON sp_detidos_info
    FOR ALL USING (auth.role() = 'authenticated');
