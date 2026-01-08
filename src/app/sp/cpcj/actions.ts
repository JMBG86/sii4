'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fetchCPCJRecords(searchTerm: string = '', year?: number) {
    const supabase = await createClient()

    let query = supabase
        .from('sp_cpcj')
        .select('*')
        .order('data_entrada', { ascending: false })

    if (searchTerm) {
        query = query.or(`nome_menor.ilike.%${searchTerm}%,nuipc.ilike.%${searchTerm}%`)
    }

    if (year) {
        const start = `${year}-01-01`
        const end = `${year}-12-31`
        query = query.gte('data_entrada', start).lte('data_entrada', end)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
}

export async function createCPCJRecord(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        data_entrada: formData.get('data_entrada') as string,
        nuipc: formData.get('nuipc') as string,
        nome_menor: formData.get('nome_menor') as string,
        idade: formData.get('idade') ? parseInt(formData.get('idade') as string) : null,
        data_nascimento: formData.get('data_nascimento') as string || null,
        motivo: formData.get('motivo') as string,
        estado: formData.get('estado') as string,
        observacoes: formData.get('observacoes') as string
    }

    if (!rawData.nome_menor) return { error: "Nome do menor é obrigatório." }

    const { error } = await supabase
        .from('sp_cpcj')
        .insert(rawData)

    if (error) return { error: error.message }
    revalidatePath('/sp/cpcj')
    return { success: true }
}

export async function updateCPCJRecord(id: string, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        data_entrada: formData.get('data_entrada') as string,
        nuipc: formData.get('nuipc') as string,
        nome_menor: formData.get('nome_menor') as string,
        idade: formData.get('idade') ? parseInt(formData.get('idade') as string) : null,
        data_nascimento: formData.get('data_nascimento') as string || null,
        motivo: formData.get('motivo') as string,
        estado: formData.get('estado') as string,
        observacoes: formData.get('observacoes') as string
    }

    const { error } = await supabase
        .from('sp_cpcj')
        .update(rawData)
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/sp/cpcj')
    return { success: true }
}

export async function deleteCPCJRecord(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('sp_cpcj').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/sp/cpcj')
    return { success: true }
}
