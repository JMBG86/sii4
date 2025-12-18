'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchSPGlobal(query: string) {
    if (!query || query.length < 2) return { results: null }

    const supabase = await createClient()
    const term = `%${query}%`

    // 1. Search Correspondence
    const { data: correspondence } = await supabase
        .from('correspondencias')
        .select('*')
        .or(`assunto.ilike.${term},numero_oficio.ilike.${term},nuipc.ilike.${term},origem.ilike.${term}`)
        .order('data_entrada', { ascending: false })
        .limit(10)

    // 2. Search Inquiries (to find owner/status)
    const { data: inquiries } = await supabase
        .from('inqueritos')
        .select(`
            id, 
            nuipc, 
            estado, 
            user_id, 
            profiles:user_id (full_name)
        `)
        .ilike('nuipc', term)
        .limit(5)

    // 3. Search SP Processes
    const { data: processos } = await supabase
        .from('sp_processos_crime')
        .select('*')
        .or(`nuipc_completo.ilike.${term},denunciante.ilike.${term},arguido.ilike.${term},vitima.ilike.${term}`)
        .limit(5)

    return {
        correspondence: correspondence || [],
        inquiries: inquiries || [],
        processos: processos || []
    }
}
