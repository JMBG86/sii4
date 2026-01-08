'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fetchInformacoes(searchTerm: string = '') {
    const supabase = await createClient()

    let query = supabase
        .from('sp_informacoes_servico')
        .select(`
            *,
            profiles:user_id ( full_name, email )
        `)
        .order('importante', { ascending: false }) // Important first
        .order('data', { ascending: false })

    if (searchTerm) {
        query = query.or(`assunto.ilike.%${searchTerm}%,conteudo.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
}

export async function createInformacao(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Não autenticado" }

    const rawData = {
        data: formData.get('data') as string,
        assunto: formData.get('assunto') as string,
        conteudo: formData.get('conteudo') as string,
        importante: formData.get('importante') === 'on',
        user_id: user.id
    }

    if (!rawData.assunto) return { error: "Assunto é obrigatório." }

    const { error } = await supabase
        .from('sp_informacoes_servico')
        .insert(rawData)

    if (error) return { error: error.message }
    revalidatePath('/sp/informacoes')
    return { success: true }
}

export async function deleteInformacao(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('sp_informacoes_servico').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/sp/informacoes')
    return { success: true }
}
