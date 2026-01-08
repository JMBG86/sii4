'use server'
import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

export async function fetchSGStatisticsData() {
    noStore()
    const supabase = await createClient()

    // Fetch all processes with related data for Charts
    // This mirrors SP logic but is isolated for SG to allow future advanced stats
    const { data, error } = await supabase
        .from('sp_processos_crime')
        .select(`
            id,
            data_registo,
            total_detidos,
            tipo_crime,
            entidade_destino,
            sp_detidos_info(nacionalidade),
            sp_apreensoes_drogas(*),
            sp_apreensoes_info(tipo)
        `)
        .not('nuipc_completo', 'is', null)
        .order('data_registo', { ascending: true })

    if (error) throw new Error(error.message)
    return data
}
