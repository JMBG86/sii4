'use server'
import { createClient } from '@/lib/supabase/server'
import { SPProcessoCrime } from '@/types/database'

export async function fetchImagensRows(
    page: number = 1,
    limit: number = 50,
    searchTerm: string = '',
    year: number = 2026
) {
    const supabase = await createClient()

    let query = supabase
        .from('sp_processos_crime')
        .select('*', { count: 'exact' })
        .eq('imagens_associadas', true)
        // Logic: (ano = year) OR (ano < year AND notificacao_resolvida = false)
        // This ensures we see RED (Unnotified) and YELLOW (Notified but Unresolved) from past years
        .or(`ano.eq.${year},and(ano.lt.${year},notificacao_resolvida.eq.false)`)
        .order('data_factos', { ascending: true })

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

export async function fetchUnresolvedCounts() {
    const supabase = await createClient()

    // Fetch all unresolved items (Red or Yellow)
    const { data, error } = await supabase
        .from('sp_processos_crime')
        .select('ano')
        .eq('imagens_associadas', true)
        .eq('notificacao_resolvida', false)

    if (error) {
        console.error('Error fetching counts:', error)
        return {}
    }

    // Group by year
    const counts: Record<number, number> = {}
    data.forEach((row: any) => {
        const y = row.ano || 2026
        counts[y] = (counts[y] || 0) + 1
    })

    return counts
}

export async function updateImagensFlags(id: string, imagens: boolean, notificacao: boolean) {
    const supabase = await createClient()

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

export async function removeImageAssociation(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('sp_processos_crime')
        .update({
            imagens_associadas: false,
            notificacao_imagens: false,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function checkProcessExists(nuipc: string) {
    const supabase = await createClient()
    const clean = nuipc.trim()

    // Attempt year extract
    let year = new Date().getFullYear()
    const match = clean.match(/\/(\d{2})[./]/)
    if (match && match[1]) {
        year = 2000 + parseInt(match[1])
    }

    const { data } = await supabase
        .from('sp_processos_crime')
        .select('*')
        .eq('nuipc_completo', clean)
        .eq('ano', year)
        .maybeSingle()

    return data
}

export async function upsertImageNotification(data: any) {
    const supabase = await createClient()

    // normalize fields
    const nuipc = data.nuipc.trim()

    // Attempt to extract year from NUIPC "123/24.0..."
    let year = new Date().getFullYear() // Default
    const match = nuipc.match(/\/(\d{2})[./]/)
    if (match && match[1]) {
        year = 2000 + parseInt(match[1])
    }

    // Check if exists
    const { data: existing } = await supabase
        .from('sp_processos_crime')
        .select('id')
        .eq('nuipc_completo', nuipc)
        .eq('ano', year)
        .maybeSingle()

    const payload = {
        nuipc_completo: nuipc,
        ano: year,
        data_factos: data.data_factos,
        tipo_crime: data.tipo_crime,
        data_registo: data.data_registo,
        localizacao: data.localizacao,
        imagens_associadas: data.imagens_associadas,
        notificacao_militar: data.notificacao_militar,
        notificacao_data_entrega: data.notificacao_data_entrega,
        notificacao_data_devolucao: data.notificacao_data_devolucao,
        notificacao_resolvida: data.notificacao_resolvida,
        // Sync green status
        notificacao_imagens: data.notificacao_imagens,
        updated_at: new Date().toISOString()
    }

    if (existing) {
        // Update
        const { error } = await supabase
            .from('sp_processos_crime')
            .update(payload)
            .eq('id', existing.id)
        if (error) throw new Error(error.message)
    } else {
        // Insert
        const { data: max } = await supabase
            .from('sp_processos_crime')
            .select('numero_sequencial')
            .eq('ano', year)
            .order('numero_sequencial', { ascending: false })
            .limit(1)

        const nextSeq = (max?.[0]?.numero_sequencial || 0) + 1

        const { error } = await supabase
            .from('sp_processos_crime')
            .insert({
                ...payload,
                numero_sequencial: nextSeq,
                detidos: false,
                created_at: new Date().toISOString()
            })
        if (error) throw new Error(error.message)
    }

    return { success: true }
}
