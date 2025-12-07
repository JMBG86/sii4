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

    // Default values
    const estado = 'por_iniciar'

    const { error } = await supabase.from('inqueritos').insert({
        nuipc,
        tipo_crime,
        data_ocorrencia: data_ocorrencia || null,
        data_participacao: data_participacao || null,
        classificacao,
        observacoes,
        estado,
    })

    if (error) {
        console.error(error)
        return { error: 'Failed to create inquiry. NUIPC might be duplicate.' }
    }

    revalidatePath('/inqueritos')
    redirect('/inqueritos')
}

export async function updateInquiryState(inquiryId: string, newState: string, comment: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Get old state
    const { data: current } = await supabase.from('inqueritos').select('estado').eq('id', inquiryId).single()
    const oldState = current?.estado

    if (oldState === newState) return

    // 2. Update Inquerito
    const { error: updateError } = await supabase
        .from('inqueritos')
        .update({ estado: newState })
        .eq('id', inquiryId)

    if (updateError) throw new Error('Failed to update status')

    // 3. Insert History
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
    const data_prevista = formData.get('data_prevista') as string

    const { error } = await supabase.from('diligencias').insert({
        inquerito_id,
        descricao,
        entidade,
        tipo,
        data_prevista: data_prevista || null,
        estado: 'pendente'
    })

    if (error) {
        console.error(error)
        return
    }

    revalidatePath(`/inqueritos/${inquerito_id}`)
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
