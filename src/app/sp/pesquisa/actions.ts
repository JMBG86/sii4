import { createClient } from '@/lib/supabase/client'

export async function searchSPGlobal(query: string) {
    if (!query || query.length < 2) return { results: null }

    const supabase = createClient()
    const term = `%${query}%`

    const [
        { data: correspondence },
        { data: inquiries },
        { data: processos }
    ] = await Promise.all([
        // 1. Search Correspondence
        supabase
            .from('correspondencias')
            .select('*')
            .or(`assunto.ilike.${term},numero_oficio.ilike.${term},nuipc.ilike.${term},origem.ilike.${term}`)
            .order('data_entrada', { ascending: false })
            .limit(10),

        // 2. Search Inquiries (SII)
        supabase
            .from('inqueritos')
            .select(`
                id, 
                nuipc, 
                estado, 
                user_id, 
                profiles:user_id (full_name)
            `)
            .ilike('nuipc', term)
            .limit(5),

        // 3. Search SP Processos Crime
        supabase
            .from('sp_processos_crime')
            .select('*')
            .or(`nuipc_completo.ilike.${term},denunciante.ilike.${term},arguido.ilike.${term},vitima.ilike.${term},localizacao.ilike.${term},observacoes.ilike.${term},numero_oficio_envio.ilike.${term}`)
            .limit(10)
    ])

    return {
        correspondence: correspondence || [],
        inquiries: inquiries || [],
        processos: processos || []
    }
}
