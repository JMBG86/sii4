-- Migration: Add SP CPCJ and Info Service tables

-- 1. CPCJ Table
CREATE TABLE IF NOT EXISTS public.sp_cpcj (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    data_entrada date DEFAULT CURRENT_DATE,
    nuipc text,
    nome_menor text NOT NULL,
    data_nascimento date,
    motivo text,
    estado text DEFAULT 'Pendente' CHECK (estado IN ('Pendente', 'Acompanhamento', 'Arquivado')),
    observacoes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Informacoes de Servico Table
CREATE TABLE IF NOT EXISTS public.sp_informacoes_servico (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    data date DEFAULT CURRENT_DATE,
    assunto text NOT NULL,
    conteudo text,
    user_id uuid REFERENCES auth.users(id),
    importante boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE public.sp_cpcj ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sp_informacoes_servico ENABLE ROW LEVEL SECURITY;

-- Note: In a real prod environment we might restrict this to 'access_sp' role only, 
-- but for now consistent with generic authenticated access.

CREATE POLICY "Enable read access for authenticated users" ON public.sp_cpcj
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.sp_cpcj
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.sp_cpcj
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.sp_cpcj
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.sp_informacoes_servico
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.sp_informacoes_servico
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.sp_informacoes_servico
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.sp_informacoes_servico
    FOR DELETE TO authenticated USING (true);
