import { createClient } from '@/lib/supabase/client'
import { SPProcessoCrime } from '@/types/database'

export async function fetchImagensRows(
    page: number = 1,
    limit: number = 50,
    searchTerm: string = '',
    year: number = 2025
) {
    const supabase = createClient()

    let query = supabase
        .from('sp_processos_crime')
        .select('*', { count: 'exact' })
        .eq('imagens_associadas', true)
        // Logic: (ano = year) OR (ano < year AND notificacao_imagens = false)
        .or(`ano.eq.${year},and(ano.lt.${year},notificacao_imagens.eq.false)`)
        .order('data_registo', { ascending: false })

    if (searchTerm) {
        query = query.or(`nuipc_completo.ilike.%${searchTerm}%,tipo_crime.ilike.%${searchTerm}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching imagens rows:', error)
        throw new Error('Failed to fetch imagens rows')
    }

    return {
        rows: data as SPProcessoCrime[],
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0
    }
}

export async function updateImagensFlags(id: string, imagens: boolean, notificacao: boolean) {
    const supabase = createClient()

    const { error } = await supabase
        .from('sp_processos_crime')
        .update({
            imagens_associadas: imagens,
            notificacao_imagens: notificacao,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function getPendingImagesCount() {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('sp_processos_crime')
        .select('*', { count: 'exact', head: true })
        .eq('imagens_associadas', true)
        .eq('notificacao_imagens', false)

    if (error) {
        console.error('Error fetching pending images count:', error)
        return 0
    }

    return count || 0
}
