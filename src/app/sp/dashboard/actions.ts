'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardCounts() {
    const supabase = await createClient()

    // 1. Correspondence (Table name is 'correspondencias')
    // Corrected from incorrect assumption 'sp_correspondencia_entrada'
    const { count: correspondenciaCount, error: errCorr } = await supabase
        .from('correspondencias')
        .select('*', { count: 'exact', head: true })

    // 2. Criminal Processes (Active/Assigned)
    // We only want to count those that have a NUIPC assigned (not null) AND are not "deleted" (soft delete usually sets NUIPC to null).
    const { count: processosCount, error: errProc } = await supabase
        .from('sp_processos_crime')
        .select('*', { count: 'exact', head: true })
        .not('nuipc_completo', 'is', null)

    return {
        correspondencia: correspondenciaCount || 0,
        processos: processosCount || 0
    }
}
