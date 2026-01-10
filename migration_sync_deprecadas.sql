-- Migration: Sync Missing Deprecadas to Distribution List
-- Purpose: Ensure all 'Deprecada' records in sp_inqueritos_externos destined for SII appear in 'Inquéritos por Distribuir'.

-- 1. Insert missing Deprecadas
INSERT INTO inqueritos (nuipc, created_at, estado, classificacao, numero_oficio, observacoes, destino, user_id, denunciados, denunciantes)
SELECT 
    sp.nuipc,
    sp.data_entrada::timestamp, -- Use data_entrada as created_at
    'por_iniciar', 
    'normal', 
    sp.numero_oficio, 
    '[DEPRECADA] ' || sp.observacoes || ' | Assunto: ' || COALESCE(sp.assunto, '') || ' | Origem: ' || COALESCE(sp.origem, ''), 
    'SII', 
    NULL, 
    '[]'::jsonb, 
    '[]'::jsonb
FROM sp_inqueritos_externos sp
WHERE 
    sp.observacoes ILIKE '%DEPRECADA%' 
    AND (sp.destino = 'SII' OR sp.destino = 'SII ALBUFEIRA')
    AND NOT EXISTS (SELECT 1 FROM inqueritos i WHERE i.nuipc = sp.nuipc);

-- 2. Update existing UNASSIGNED Deprecadas to ensure they are distributable
-- This fixes cases where they exist but might have wrong destination or state, but are NOT assigned to anyone.
UPDATE inqueritos i
SET 
    destino = 'SII',
    estado = 'por_iniciar',
    observacoes = CASE 
        WHEN i.observacoes ILIKE '%DEPRECADA%' THEN i.observacoes 
        ELSE '[DEPRECADA] ' || i.observacoes || ' | +Synced'
    END
FROM sp_inqueritos_externos sp
WHERE 
    i.nuipc = sp.nuipc
    AND sp.observacoes ILIKE '%DEPRECADA%'
    AND (sp.destino = 'SII' OR sp.destino = 'SII ALBUFEIRA')
    AND i.user_id IS NULL;
