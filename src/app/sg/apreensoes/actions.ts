'use server'

import { createClient } from '@/lib/supabase/server'

// Fetch consolidated data for different seizure types
// Filters will be applied based on the 'type' argument

export async function fetchSeizures(type: 'Droga' | 'Telemóveis' | 'Armas' | 'Veículos' | 'Numerário') {
    const supabase = await createClient()

    if (type === 'Droga') {
        // For drugs, we look at ap_processos_crime that have entries in sp_apreensoes_drogas
        const { data, error } = await supabase
            .from('sp_processos_crime')
            .select(`
                id,
                nuipc_completo,
                data_registo,
                sp_apreensoes_drogas (*)
            `)
            .not('sp_apreensoes_drogas', 'is', null) // Only those with drugs
            .order('data_registo', { ascending: false })

        if (error) throw new Error(error.message)
        // Filter out nulls manually if inner join isn't strict enough in postgrest syntax used here
        return data.filter(p => p.sp_apreensoes_drogas && Object.keys(p.sp_apreensoes_drogas).length > 0)
    } else {
        // For others, we query sp_apreensoes_info with filtering
        let filterKeyword = ''
        if (type === 'Telemóveis') filterKeyword = 'Telemoveis' // Matches "Material Informático: Telemoveis" (No accent in DB)
        if (type === 'Numerário') filterKeyword = 'Numerário'
        if (type === 'Armas') filterKeyword = 'Arma'
        if (type === 'Veículos') filterKeyword = 'Veículos' // Assuming 'Veículos' is the keyword used in SP (Wait, let me check detail-dialog.tsx)
        // Re-checking detail-dialog line 244: 'Veículos:' (With accent). Okay. 
        // But let's use a broader match if unsure? No, keeping strict for now based on what I saw.
        // Actually, type 'Viatura' was my previous guess, but line 244 says 'Veículos:'
        if (type === 'Veículos') filterKeyword = 'Veículos'

        const { data, error } = await supabase
            .from('sp_apreensoes_info')
            .select(`
                *,
                sp_processos_crime:processo_id ( nuipc_completo, data_registo )
            `)
            .ilike('tipo', `%${filterKeyword}%`)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data
    }
}

export async function updateSeizureStatus(id: string, remetido: boolean, local: string) {
    const supabase = await createClient()

    // If remetido = true, local -> local_remessa, clear local_deposito
    // If remetido = false, local -> local_deposito, clear local_remessa

    const updates = remetido
        ? { remetido: true, local_remessa: local, local_deposito: null }
        : { remetido: false, local_deposito: local, local_remessa: null }

    const { error } = await supabase
        .from('sp_apreensoes_info')
        .update(updates)
        .eq('id', id)

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function updateDrugStatus(id: string, entregue: boolean) {
    const supabase = await createClient()

    const updates = {
        entregue_lpc: entregue,
        data_entrega: entregue ? new Date().toISOString() : null
    }

    const { error } = await supabase
        .from('sp_apreensoes_drogas')
        .update(updates)
        .eq('id', id)

    if (error) throw new Error(error.message)
    return { success: true }
}
