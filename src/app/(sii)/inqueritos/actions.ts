import { createClient } from '@/lib/supabase/client'

export async function createInquiry(formData: FormData) {
    const supabase = createClient()

    const nuipc = formData.get('nuipc') as string
    const tipo_crime = formData.get('tipo_crime') as string
    const data_ocorrencia = formData.get('data_ocorrencia') as string
    const data_participacao = formData.get('data_participacao') as string
    const data_atribuicao = formData.get('data_atribuicao') as string || new Date().toISOString().split('T')[0]
    const classificacao = formData.get('classificacao') as string
    const observacoes = formData.get('observacoes') as string

    // Parse JSON fields
    const denunciantesRaw = formData.get('denunciantes') as string
    const denunciadosRaw = formData.get('denunciados') as string

    let denunciantes = null
    let denunciados = null

    try {
        if (denunciantesRaw) denunciantes = JSON.parse(denunciantesRaw)
        if (denunciadosRaw) denunciados = JSON.parse(denunciadosRaw)
    } catch (e) {
        console.error('Error parsing parties JSON', e)
    }

    let assignedUserId = formData.get('assigned_user_id') as string

    // Check if current user is admin to allow assignment
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        // If not admin, force userId to be self (ignore form data)
        if (profile?.role !== 'admin') {
            assignedUserId = user.id
        } else {
            // If admin but no user selected (or selected 'self'), default to self
            if (!assignedUserId || assignedUserId === 'self') {
                assignedUserId = user.id
            }
        }
    }

    // Default values
    const estado = 'por_iniciar'

    const { error } = await supabase.from('inqueritos').insert({
        nuipc,
        tipo_crime,
        data_ocorrencia: data_ocorrencia || null,
        data_participacao: data_participacao || null,
        data_atribuicao: data_atribuicao || null,
        classificacao,
        observacoes,
        denunciantes,
        denunciados,
        user_id: assignedUserId,
        estado,
    })

    if (error) {
        console.error(error)
        return { error: 'Erro ao criar inquérito: ' + error.message || error.details || 'Erro desconhecido.' }
    }

    return { success: true }
}

export async function updateInquiryState(inquiryId: string, newState: string, comment: string, numeroOficio?: string, destino?: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Get old state
    const { data: current } = await supabase.from('inqueritos').select('estado').eq('id', inquiryId).single()
    const oldState = current?.estado

    if (oldState === newState) return

    // 2. Prepare update data
    const updateData: any = { estado: newState }

    // If marking as concluded, save office number, completion date, and destination
    if (newState === 'concluido' && numeroOficio) {
        updateData.numero_oficio = numeroOficio
        updateData.data_conclusao = new Date().toISOString()
        if (destino) updateData.destino = destino
    }

    // 3. Update Inquerito
    const { error: updateError } = await supabase
        .from('inqueritos')
        .update(updateData)
        .eq('id', inquiryId)

    if (updateError) throw new Error('Failed to update status')

    // 4. Sync Destination to Source if applicable
    const isConcluding = newState === 'concluido'
    const isActiveState = !isConcluding
    const finalDestino = isActiveState ? 'SII' : (destino!)

    if ((isConcluding && destino) || isActiveState) {
        const { data: inquiry } = await supabase.from('inqueritos').select('nuipc').eq('id', inquiryId).single()

        if (isActiveState) {
            console.log('[DEBUG] Reopening inquiry', inquiryId)
            await supabase.from('inqueritos').update({ destino: 'SII', numero_oficio: null, data_conclusao: null }).eq('id', inquiryId)
        }

        console.log('[DEBUG] Syncing Destino:', {
            inquiryId,
            nuipc: inquiry?.nuipc,
            finalDestino
        })

        if (inquiry?.nuipc) {
            // Attempt 1: Parallel Update
            const [spRes, extRes] = await Promise.all([
                supabase.from('sp_processos_crime')
                    .update({ entidade_destino: finalDestino })
                    .eq('nuipc_completo', inquiry.nuipc)
                    .select(),

                supabase.from('sp_inqueritos_externos')
                    .update({ destino: finalDestino })
                    .eq('nuipc', inquiry.nuipc)
                    .select()
            ])

            console.log('[DEBUG] Sync Results (Attempt 1):', {
                spUpdated: spRes.data?.length || 0,
                spError: spRes.error,
                extUpdated: extRes.data?.length || 0
            })

            // Fallback: If SP update failed to find rows, maybe try matching 'nuipc' column if it exists or trimmed version?
            // Or maybe the inquiry.nuipc has spaces?
            if ((spRes.data?.length || 0) === 0) {
                // Try removing spaces?
                const cleanNuipc = inquiry.nuipc.replace(/\s/g, '')
                if (cleanNuipc !== inquiry.nuipc) {
                    console.log('[DEBUG] Retrying SP update with clean NUIPC:', cleanNuipc)
                    await supabase.from('sp_processos_crime')
                        .update({ entidade_destino: finalDestino })
                        .eq('nuipc_completo', cleanNuipc)
                }
            }
        }
    }

    // 5. Insert History
    const { error: historyError } = await supabase.from('historico_estados').insert({
        inquerito_id: inquiryId,
        estado_anterior: oldState,
        estado_novo: newState,
        utilizador: user?.email || 'system'
    })

    if (historyError) console.error('History error', historyError)
}

export async function addDiligence(formData: FormData) {
    const supabase = createClient()

    const inquerito_id = formData.get('inquerito_id') as string
    const descricao = formData.get('descricao') as string
    const entidade = formData.get('entidade') as string
    const tipo = formData.get('tipo') as string
    const data_enviado = formData.get('data_enviado') as string
    const status = formData.get('status') as string || 'a_realizar'

    const { error } = await supabase.from('diligencias').insert({
        inquerito_id,
        descricao,
        entidade,
        tipo,
        data_enviado: data_enviado || null,
        status,
        estado: 'pendente'
    })

    if (error) {
        console.error('Error adding diligence:', error)
        return { error: error.message || 'Erro ao criar diligência.' }
    }
}

export async function deleteInquiry(inquiryId: string) {
    const supabase = createClient()

    // 1. Fetch to check origin and assignment status
    const { data: inquiry } = await supabase
        .from('inqueritos')
        .select('observacoes, nuipc, user_id')
        .eq('id', inquiryId)
        .single()

    const isSP = inquiry?.observacoes?.includes('[Importado da SP]')
    const isUnassigned = inquiry?.user_id === null

    // If it's from SP but already unassigned (e.g. from Distribution page), we allow Hard Delete to clear it.
    // If it's from SP and assigned, we Soft Delete (Unassign) to prevent accidental data loss.
    if (isSP && !isUnassigned) {
        // Soft delete: Unassign and reset status
        const { error } = await supabase
            .from('inqueritos')
            .update({
                user_id: null,
                estado: 'por_iniciar',
                data_atribuicao: null,
            })
            .eq('id', inquiryId)

        if (error) {
            console.error('Error unassigning SP inquiry:', error)
            return { error: 'Erro ao desatribuir: ' + error.message }
        }
    } else {
        // Hard delete for manual inquiries
        const { error } = await supabase
            .from('inqueritos')
            .delete()
            .eq('id', inquiryId)

        if (error) {
            console.error('Error deleting inquiry:', error)
            return { error: 'Failed to delete inquiry' }
        }
    }
    return { success: true }
}

export async function updateDiligence(diligenceId: string, formData: FormData) {
    const supabase = createClient()

    const descricao = formData.get('descricao') as string
    const entidade = formData.get('entidade') as string
    const data_enviado = formData.get('data_enviado') as string
    const status = formData.get('status') as string

    const { error } = await supabase
        .from('diligencias')
        .update({
            descricao,
            entidade: entidade || null,
            data_enviado: data_enviado || null,
            status,
        })
        .eq('id', diligenceId)

    if (error) {
        console.error('Error updating diligence:', error)
        throw error
    }
}

export async function deleteDiligence(diligenceId: string, inquiryId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('diligencias')
        .delete()
        .eq('id', diligenceId)

    if (error) {
        console.error('Error deleting diligence:', error)
        throw error
    }
}

export async function updateInquiry(inquiryId: string, formData: FormData) {
    const supabase = createClient()

    const nuipc = formData.get('nuipc') as string
    const tipo_crime = formData.get('tipo_crime') as string
    const data_ocorrencia = formData.get('data_ocorrencia') as string
    const data_participacao = formData.get('data_participacao') as string
    const data_atribuicao = formData.get('data_atribuicao') as string
    const classificacao = formData.get('classificacao') as string
    const observacoes = formData.get('observacoes') as string

    // Parse JSON fields
    const denunciantesRaw = formData.get('denunciantes') as string
    const denunciadosRaw = formData.get('denunciados') as string

    let denunciantes = null
    let denunciados = null

    try {
        if (denunciantesRaw) denunciantes = JSON.parse(denunciantesRaw)
        if (denunciadosRaw) denunciados = JSON.parse(denunciadosRaw)
    } catch (e) {
        console.error('Error parsing parties JSON', e)
    }


    const { error } = await supabase
        .from('inqueritos')
        .update({
            nuipc,
            tipo_crime,
            data_ocorrencia: data_ocorrencia || null,
            data_participacao: data_participacao || null,
            data_atribuicao: data_atribuicao || null,
            classificacao,
            observacoes,
            denunciantes,
            denunciados,
            numero_oficio: formData.get('numero_oficio') as string || null,
            destino: formData.get('destino') as string || null,
        })
        .eq('id', inquiryId)

    if (error) {
        console.error('Error updating inquiry:', error)
        return { error: 'Failed to update inquiry' }
    }
    return { success: true }
}
