import { createClient } from '@/lib/supabase/client'

export async function fetchInqueritosExternos(searchTerm: string = '', year: number = 2025) {
    const supabase = createClient()
    const start = `${year}-01-01`
    const end = `${year}-12-31`

    let query = supabase
        .from('sp_inqueritos_externos')
        .select('*')
        .gte('data_entrada', start)
        .lte('data_entrada', end)
        .order('created_at', { ascending: false })

    if (searchTerm) {
        query = query.or(`nuipc.ilike.%${searchTerm}%,assunto.ilike.%${searchTerm}%,numero_oficio.ilike.%${searchTerm}%`)
    }

    // Exclude Deprecadas (Observacoes containing DEPRECADA)
    query = query.not('observacoes', 'ilike', '%DEPRECADA%')

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function createInqueritoExterno(formData: FormData) {
    const supabase = createClient()

    const rawData = {
        srv: formData.get('srv') as string,
        numero_oficio: formData.get('numero_oficio') as string,
        nuipc: formData.get('nuipc') as string,
        origem: formData.get('origem') as string,
        assunto: formData.get('assunto') as string,
        destino: formData.get('destino') as string,
        data_entrada: formData.get('data_entrada') as string,
        observacoes: formData.get('observacoes') as string
    }

    if (!rawData.nuipc) return { error: "NUIPC é obrigatório." }

    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .insert(rawData)

    if (error) return { error: error.message }

    // --- Integration: Create/Update Inquiry if SII ALBUFEIRA ---
    if (rawData.destino === 'SII ALBUFEIRA') {
        try {
            const { data: existing } = await supabase
                .from('inqueritos')
                .select('id, user_id, estado, observacoes')
                .eq('nuipc', rawData.nuipc)
                .single()

            if (existing) {
                // If exists, update it.
                // Logic: If it has a user, we want to reset it for redistribution BUT keep the history.
                // We add a tag to observations: [Anterior: UUID]

                let updatePayload: any = {
                    numero_oficio: rawData.numero_oficio,
                    // Append import note to existing or replace? User says "atualizar estes dados".
                    // Let's prepend to keep history visible
                    observacoes: `[Atualização SP: ${new Date().toLocaleDateString()}] ${rawData.observacoes || ''} | Assunto: ${rawData.assunto || ''} \n\n${existing.observacoes || ''}`
                }

                // If it was assigned (or concluded), reset state to 'por_iniciar' and clear user for distribution
                if (existing.user_id) {
                    updatePayload.user_id = null
                    updatePayload.estado = 'por_iniciar'
                    // Store previous user in observations for the suggestion logic
                    updatePayload.observacoes = `[Anterior Responsável: ${existing.user_id}] ` + updatePayload.observacoes
                } else if (existing.estado === 'concluido' || existing.estado === 'arquivado') {
                    // Even if user_id was null (unlikely if concluded), force reset
                    updatePayload.estado = 'por_iniciar'
                }

                const { error: updateError } = await supabase
                    .from('inqueritos')
                    .update(updatePayload)
                    .eq('id', existing.id)

                if (updateError) {
                    console.error('Error updating linked inquiry from External:', updateError)
                }

            } else {
                const { error: insertError } = await supabase.from('inqueritos').insert({
                    nuipc: rawData.nuipc,
                    estado: 'por_iniciar',
                    classificacao: 'normal',
                    user_id: null,
                    numero_oficio: rawData.numero_oficio,
                    observacoes: `[Importado de Inq. Externos] ${rawData.observacoes || ''} | Assunto: ${rawData.assunto || ''} | Origem: ${rawData.origem || ''}`,
                    destino: 'SII ALBUFEIRA',
                    denunciados: [],
                    denunciantes: []
                })

                if (insertError) {
                    console.error('Error creating linked inquiry from External:', insertError)
                }
            }
        } catch (err) {
            console.error('Integration error:', err)
        }
    }

    return { success: true }
}

export async function updateInqueritoExterno(id: string, formData: FormData) {
    const supabase = createClient()

    const rawData = {
        srv: formData.get('srv') as string,
        numero_oficio: formData.get('numero_oficio') as string,
        nuipc: formData.get('nuipc') as string,
        origem: formData.get('origem') as string,
        assunto: formData.get('assunto') as string,
        destino: formData.get('destino') as string,
        data_entrada: formData.get('data_entrada') as string,
        observacoes: formData.get('observacoes') as string
    }

    if (!rawData.nuipc) return { error: "NUIPC é obrigatório." }

    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .update(rawData)
        .eq('id', id)

    if (error) return { error: error.message }

    // --- Integration: Create/Update Inquiry if changed to SII ALBUFEIRA ---
    if (rawData.destino === 'SII ALBUFEIRA') {
        try {
            const { data: existing } = await supabase
                .from('inqueritos')
                .select('id, user_id, estado, observacoes')
                .eq('nuipc', rawData.nuipc)
                .single()

            if (existing) {
                // Update existing
                let updatePayload: any = {
                    numero_oficio: rawData.numero_oficio,
                    observacoes: `[Atualização SP: ${new Date().toLocaleDateString()}] ${rawData.observacoes || ''} | Assunto: ${rawData.assunto || ''} \n\n${existing.observacoes || ''}`
                }

                if (existing.user_id) {
                    updatePayload.user_id = null
                    updatePayload.estado = 'por_iniciar'
                    updatePayload.observacoes = `[Anterior Responsável: ${existing.user_id}] ` + updatePayload.observacoes
                } else if (existing.estado === 'concluido' || existing.estado === 'arquivado') {
                    updatePayload.estado = 'por_iniciar'
                }

                const { error: updateError } = await supabase
                    .from('inqueritos')
                    .update(updatePayload)
                    .eq('id', existing.id)

                if (updateError) console.error('Error updating linked inquiry:', updateError)

            } else {
                // Create new
                const { error: insertError } = await supabase.from('inqueritos').insert({
                    nuipc: rawData.nuipc,
                    estado: 'por_iniciar', // Reset state
                    classificacao: 'normal',
                    user_id: null,
                    numero_oficio: rawData.numero_oficio,
                    observacoes: `[Importado de Inq. Externos] ${rawData.observacoes || ''} | Assunto: ${rawData.assunto || ''} | Origem: ${rawData.origem || ''}`,
                    destino: 'SII ALBUFEIRA',
                    denunciados: [],
                    denunciantes: []
                })

                if (insertError) {
                    console.error('Error creating linked inquiry from External Update:', insertError)
                }
            }
        } catch (err) {
            console.error('Integration error:', err)
        }
    }

    return { success: true }
}

export async function deleteInqueritoExterno(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    return { success: true }
}

export async function checkNuipcAssociation(nuipc: string) {
    const supabase = createClient()

    // Check in 'inqueritos' for any record with this NUIPC (even if user is null? User said "se tiver user").
    // Actually user said: "verificar se esse NUIPC ja está associado a alguem"
    // AND "se o estado... for CONCLUIDO... mostrar o nome e o estado"
    // So check for NUIPC existence first.
    const { data, error } = await supabase
        .from('inqueritos')
        .select(`
            user_id,
            estado,
            profiles:user_id ( full_name )
        `)
        .eq('nuipc', nuipc)
        .limit(1)
        .maybeSingle()

    if (error || !data) {
        return null
    }

    // Return the details if user exists (or just status if we want to warn about existence?)
    // Requirements: "verificar se... associado a alguem, mostrar o nome... e se estiver concluido..."
    // If user is null, it's unassigned.
    return {
        hasUser: !!data.user_id,
        userName: (data.profiles as any)?.full_name || 'Sem militar associado',
        status: data.estado
    }
}

export async function fetchAllInqueritosExternosForExport() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('sp_inqueritos_externos')
        .select('*')
        .not('observacoes', 'ilike', '%DEPRECADA%')
        .order('data_entrada', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}
