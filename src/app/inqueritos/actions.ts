'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInquiry(formData: FormData) {
    const supabase = await createClient()

    const nuipc = formData.get('nuipc') as string
    const tipo_crime = formData.get('tipo_crime') as string
    const data_ocorrencia = formData.get('data_ocorrencia') as string
    const data_participacao = formData.get('data_participacao') as string
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
        classificacao,
        observacoes,
        denunciantes,
        denunciados,
        user_id: assignedUserId,
        estado,
    })

    if (error) {
        console.error(error)
        console.error(error)
        return { error: 'Erro ao criar inquérito: ' + error.message || error.details || 'Erro desconhecido.' }
    }

    // Trigger Notification if assigned to another user
    if (assignedUserId !== user?.id) {
        await supabase.from('notifications').insert({
            user_id: assignedUserId,
            message: `Novo inquérito atribuído: ${nuipc} - ${tipo_crime}`,
            link: `/inqueritos` // Ideally we'd link to ID but we don't have it easily from insert without select
        })
    }


    revalidatePath('/inqueritos')
    redirect('/inqueritos')
}

export async function updateInquiryState(inquiryId: string, newState: string, comment: string, numeroOficio?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Get old state
    const { data: current } = await supabase.from('inqueritos').select('estado').eq('id', inquiryId).single()
    const oldState = current?.estado

    if (oldState === newState) return

    // 2. Prepare update data
    const updateData: any = { estado: newState }

    // If marking as concluded, save office number and completion date
    if (newState === 'concluido' && numeroOficio) {
        updateData.numero_oficio = numeroOficio
        updateData.data_conclusao = new Date().toISOString()
    }

    // 3. Update Inquerito
    const { error: updateError } = await supabase
        .from('inqueritos')
        .update(updateData)
        .eq('id', inquiryId)

    if (updateError) throw new Error('Failed to update status')

    // 4. Insert History
    const { error: historyError } = await supabase.from('historico_estados').insert({
        inquerito_id: inquiryId,
        estado_anterior: oldState,
        estado_novo: newState,
        utilizador: user?.email || 'system'
    })

    if (historyError) console.error('History error', historyError)

    revalidatePath(`/inqueritos/${inquiryId}`)
    revalidatePath('/')
}

export async function addDiligence(formData: FormData) {
    const supabase = await createClient()

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
        console.error(error)
        return
    }

    revalidatePath(`/inqueritos/${inquerito_id}`)
    revalidatePath('/')
    redirect(`/inqueritos/${inquerito_id}`)
}

export async function deleteInquiry(inquiryId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('inqueritos')
        .delete()
        .eq('id', inquiryId)

    if (error) {
        console.error('Error deleting inquiry:', error)
        return { error: 'Failed to delete inquiry' }
    }

    revalidatePath('/inqueritos')
    revalidatePath('/')
}

export async function updateDiligence(diligenceId: string, formData: FormData) {
    const supabase = await createClient()

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

    revalidatePath('/inqueritos')
    revalidatePath('/')
}

export async function deleteDiligence(diligenceId: string, inquiryId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('diligencias')
        .delete()
        .eq('id', diligenceId)

    if (error) {
        console.error('Error deleting diligence:', error)
        throw error
    }

    revalidatePath(`/inqueritos/${inquiryId}`)
    revalidatePath('/inqueritos')
    revalidatePath('/')
}

export async function updateInquiry(inquiryId: string, formData: FormData) {
    const supabase = await createClient()

    const nuipc = formData.get('nuipc') as string
    const tipo_crime = formData.get('tipo_crime') as string
    const data_ocorrencia = formData.get('data_ocorrencia') as string
    const data_participacao = formData.get('data_participacao') as string
    const classificacao = formData.get('classificacao') as string
    const observacoes = formData.get('observacoes') as string
    const localizacao = formData.get('localizacao') as string // Keeping for legacy handling if needed, but we rely on new fields mostly

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
            classificacao,
            observacoes,
            denunciantes,
            denunciados
        })
        .eq('id', inquiryId)

    if (error) {
        console.error('Error updating inquiry:', error)
        return { error: 'Failed to update inquiry' }
    }

    revalidatePath(`/inqueritos/${inquiryId}`)
    revalidatePath('/inqueritos')
    revalidatePath('/')
}


