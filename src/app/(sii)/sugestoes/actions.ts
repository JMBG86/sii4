import { createClient } from '@/lib/supabase/client'
import { SuggestionStatus } from '@/types/database'

export async function createSuggestion(formData: FormData) {
    const supabase = createClient()

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

    // Success - caller handles refresh
}

export async function updateSuggestionStatus(id: string, newStatus: SuggestionStatus) {
    const supabase = createClient()
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
}

export async function deleteSuggestion(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('sugestoes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete error', error)
        return { error: 'Erro ao apagar (apenas o criador pode apagar).' }
    }
}
