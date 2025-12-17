'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SuggestionStatus } from '@/types/database'

export async function createSuggestion(formData: FormData) {
    const supabase = await createClient()

    const titulo = formData.get('titulo') as string
    const descricao = formData.get('descricao') as string
    const tipo = formData.get('tipo') as string

    if (!titulo || !descricao) {
        return { error: 'Título e descrição são obrigatórios.' }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('sugestoes').insert({
        user_id: user?.id,
        titulo,
        descricao,
        tipo,
        status: 'enviada' // Default status
    })

    if (error) {
        console.error('Error creating suggestion:', error)
        return { error: 'Erro ao criar sugestão.' }
    }

    revalidatePath('/sugestoes')
}

export async function updateSuggestionStatus(id: string, newStatus: SuggestionStatus) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autenticado.' }

    // Check if Admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Apenas administradores podem alterar o estado.' }
    }

    const { error } = await supabase
        .from('sugestoes')
        .update({ status: newStatus })
        .eq('id', id)

    if (error) {
        console.error('Error updating suggestion status:', error)
        return { error: 'Erro ao atualizar estado.' }
    }

    revalidatePath('/sugestoes')
}

export async function deleteSuggestion(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // We rely on RLS for "Owner" check, but RLS might be tricky if we want Admin to delete too.
    // Let's do a double check here or trust RLS.
    // Migration said: "Enable delete for owners".
    // If we want Admins to delete too, we need RLS update OR Service Key (avoid).
    // Let's stick to RLS. If Admin needs to delete, they might need policy update.
    // For now, simple delete.

    const { error } = await supabase
        .from('sugestoes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete error', error)
        return { error: 'Erro ao apagar (apenas o criador pode apagar).' }
    }

    revalidatePath('/sugestoes')
}
