import { createClient } from '@/lib/supabase/client'

export async function fetchDeprecadas(searchTerm: string = '', year: number = 2026) {
    const supabase = createClient()
    const start = `${year}-01-01`
    const end = `${year}-12-31`

    let query = supabase
        .from('sp_inqueritos_externos')
        .select('*')
        .ilike('observacoes', '%DEPRECADA%')
        .gte('data_entrada', start)
        .lte('data_entrada', end)
        .order('created_at', { ascending: false })

    if (searchTerm) {
        // Broad search, but must still match DEPRECADA
        query = query.or(`nuipc.ilike.%${searchTerm}%,assunto.ilike.%${searchTerm}%,numero_oficio.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function createDeprecada(formData: FormData) {
    const supabase = createClient()

    // Get current user to stamp ownership
    const { data: { user } } = await supabase.auth.getUser()

    const rawData = {
        srv: formData.get('srv') as string,
        numero_oficio: formData.get('numero_oficio') as string,
        nuipc: formData.get('nuipc') as string,
        origem: formData.get('origem') as string,
        assunto: formData.get('assunto') as string,
        destino: formData.get('destino') as string,
        data_entrada: formData.get('data_entrada') as string,
        // FORCE 'DEPRECADA' tag
        observacoes: `DEPRECADA ${formData.get('observacoes') || ''}`,
        user_id: user?.id || null // NEW: Stamp user_id
    }

    if (!rawData.nuipc) return { error: "NUIPC é obrigatório." }

    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .insert(rawData)

    if (error) return { error: error.message }

    // Integration: Create Pending Inquiry if SII ALBUFEIRA
    // (Same logic as External Inquiries)
    if (rawData.destino === 'SII ALBUFEIRA') {
        try {
            const { data: existing } = await supabase
                .from('inqueritos')
                .select('id')
                .eq('nuipc', rawData.nuipc)
                .single()

            if (!existing) {
                const { error: insertError } = await supabase.from('inqueritos').insert({
                    nuipc: rawData.nuipc,
                    estado: 'por_iniciar',
                    classificacao: 'normal',
                    user_id: null,
                    numero_oficio: rawData.numero_oficio,
                    observacoes: `[DEPRECADA] ${rawData.observacoes} | Assunto: ${rawData.assunto || ''} | Origem: ${rawData.origem || ''}`,
                    destino: 'SII ALBUFEIRA',
                    denunciados: [],
                    denunciantes: []
                })
                if (insertError) console.error('Error creating linked inquiry:', insertError)
            }
        } catch (err) {
            console.error('Integration error:', err)
        }
    }

    return { success: true }
}

export async function updateDeprecada(id: string, formData: FormData) {
    const supabase = createClient()

    // Ensure we keep 'DEPRECADA' if user edited it out, or just prepend it if missing
    let obs = formData.get('observacoes') as string || ''
    if (!obs.includes('DEPRECADA')) {
        obs = `DEPRECADA ${obs}`
    }

    const rawData = {
        srv: formData.get('srv') as string,
        numero_oficio: formData.get('numero_oficio') as string,
        nuipc: formData.get('nuipc') as string,
        origem: formData.get('origem') as string,
        assunto: formData.get('assunto') as string,
        destino: formData.get('destino') as string,
        data_entrada: formData.get('data_entrada') as string,
        observacoes: obs
    }

    if (!rawData.nuipc) return { error: "NUIPC é obrigatório." }

    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .update(rawData)
        .eq('id', id)

    if (error) return { error: error.message }

    return { success: true }
}

export async function deleteDeprecada(id: string) {
    const supabase = createClient()

    // 1. Get NUIPC before deleting to sync with SII
    const { data: deprecada } = await supabase
        .from('sp_inqueritos_externos')
        .select('nuipc')
        .eq('id', id)
        .single()

    // 2. Delete from SP (Source of Truth)
    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    // 3. Sync: Delete Linked Inquiry in SII if it exists
    if (deprecada?.nuipc) {
        try {
            // Safety: Only delete if it has the DEPRECADA tag in observations to avoid accidental deletes
            const { error: syncError } = await supabase
                .from('inqueritos')
                .delete()
                .eq('nuipc', deprecada.nuipc)
                .ilike('observacoes', '%DEPRECADA%')

            if (syncError) console.error('Error syncing delete to SII:', syncError)
        } catch (err) {
            console.error('Error in sync delete:', err)
        }
    }

    return { success: true }
}

export async function fetchAllDeprecadasForExport() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('sp_inqueritos_externos')
        .select('*')
        .ilike('observacoes', '%DEPRECADA%')
        .order('data_entrada', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}
