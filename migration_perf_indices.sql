-- Optimizing performance with indices on frequently queried columns

-- Enable pg_trgm extension for GIN indices (gin_trgm_ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Inqueritos Table
CREATE INDEX IF NOT EXISTS idx_inqueritos_user_id ON public.inqueritos(user_id);
CREATE INDEX IF NOT EXISTS idx_inqueritos_estado ON public.inqueritos(estado);
CREATE INDEX IF NOT EXISTS idx_inqueritos_created_at ON public.inqueritos(created_at);
CREATE INDEX IF NOT EXISTS idx_inqueritos_observacoes_gin ON public.inqueritos USING gin(observacoes gin_trgm_ops); -- For 'DEPRECADA' search
CREATE INDEX IF NOT EXISTS idx_inqueritos_destino ON public.inqueritos(destino);

-- 2. Diligencias Table
CREATE INDEX IF NOT EXISTS idx_diligencias_inquerito_id ON public.diligencias(inquerito_id);
CREATE INDEX IF NOT EXISTS idx_diligencias_estado ON public.diligencias(estado);

-- 3. SP Processos Crime (Critical for SP Report & Search)
CREATE INDEX IF NOT EXISTS idx_sp_processos_nuipc ON public.sp_processos_crime(nuipc_completo);
CREATE INDEX IF NOT EXISTS idx_sp_processos_data_registo ON public.sp_processos_crime(data_registo);
CREATE INDEX IF NOT EXISTS idx_sp_processos_destino ON public.sp_processos_crime(entidade_destino);
CREATE INDEX IF NOT EXISTS idx_sp_processos_detidos ON public.sp_processos_crime(total_detidos);

-- 4. SP Detidos (Foreign Key)
CREATE INDEX IF NOT EXISTS idx_sp_detidos_processo_id ON public.sp_detidos_info(processo_id);

-- 5. SP Apreensoes (Foreign Key)
CREATE INDEX IF NOT EXISTS idx_sp_apreensoes_processo_id ON public.sp_apreensoes_info(processo_id);
CREATE INDEX IF NOT EXISTS idx_sp_drogas_processo_id ON public.sp_apreensoes_drogas(processo_id);
