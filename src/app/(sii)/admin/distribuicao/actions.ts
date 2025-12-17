'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnassignedInquiries() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('inqueritos')
        .select('*')
        .is('user_id', null)
        .eq('estado', 'por_iniciar') // Likely pending start
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getUsers() {
    const supabase = await createClient()

    // Get profiles with roles or just all users? Usually admin assigns to investigators.
    // For now, get all profiles
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')

    if (error) {
        return []
    }

    return data
}

export async function assignInquiry(inquiryId: string, userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('inqueritos')
        .update({
            user_id: userId,
            data_atribuicao: new Date().toISOString()
        })
        .eq('id', inquiryId)
        .select()

    if (error) {
        return { error: error.message }
    }

    if (!data || data.length === 0) {
        return { error: 'Inquérito não encontrado ou sem permissão (RLS).' }
    }

    revalidatePath('/admin/distribuicao')
    revalidatePath('/inqueritos')
    return { success: true }
}
