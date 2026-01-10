'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchSGGlobal(query: string) {
    // Trim query to avoid whitespace issues
    const cleanQuery = query.trim()
    const debugLog: string[] = []

    debugLog.push(`Search started for: "${cleanQuery}"`)

    if (!cleanQuery || cleanQuery.length < 2) {
        debugLog.push('Query too short or empty after trimming.')
        return { results: null, debugLog }
    }

    const supabase = await createClient()

    // Debug Auth Status
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
            debugLog.push(`Auth Error: ${authError.message}`)
        } else if (user) {
            debugLog.push(`Authenticated User: ${user.id} (${user.email})`)
        } else {
            debugLog.push('No User Authenticated (Anonymous) - RLS might block results')
        }
    } catch (e) {
        debugLog.push('Failed to check auth status')
    }

    const term = `%${cleanQuery}%`

    // Detect explicit "Seq/Year" pattern (e.g. "2/26" or "500/2025")
    const seqMatch = cleanQuery.match(/^(\d+)\/(\d{2,4})$/)

    // Initialize results arrays
    let correspondence: any[] = []
    let inquiries: any[] = []
    let processos: any[] = []

    // We will run queries in parallel but catch errors individually to prevent total failure
    const promises = []

    // 1. Correspondence
    promises.push(
        supabase
            .from('correspondencias')
            .select('*')
            .or(`assunto.ilike.${term},numero_oficio.ilike.${term},nuipc.ilike.${term},origem.ilike.${term}`)
            .order('data_entrada', { ascending: false })
            .limit(10)
            .then(({ data, error }) => {
                if (error) debugLog.push(`Correspondence Error: ${error.message}`)
                if (data) {
                    correspondence = data
                    debugLog.push(`Correspondence found: ${data.length}`)
                }
            })
    )

    // 2. Inquiries
    promises.push(
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
            .limit(5)
            .then(({ data, error }) => {
                if (error) debugLog.push(`Inquiries Error: ${error.message}`)
                if (data) {
                    inquiries = data
                    debugLog.push(`Inquiries found: ${data.length}`)
                }
            })
    )

    // 3. Processos Text Search
    promises.push(
        supabase
            .from('sp_processos_crime')
            .select('*')
            .or(`nuipc_completo.ilike.${term},denunciante.ilike.${term},arguido.ilike.${term},vitima.ilike.${term},localizacao.ilike.${term},observacoes.ilike.${term},numero_oficio_envio.ilike.${term}`)
            .limit(10)
            .then(({ data, error }) => {
                if (error) debugLog.push(`Processos (Text) Error: ${error.message}`)
                if (data) {
                    processos.push(...data)
                    debugLog.push(`Processos (Text) found: ${data.length}`)
                }
            })
    )

    // 4. Processos Sequence Search (if match)
    if (seqMatch) {
        const seq = parseInt(seqMatch[1])
        let year = parseInt(seqMatch[2])
        if (year < 100) year += 2000

        debugLog.push(`Sequence matched: Seq=${seq}, Year=${year}`)

        promises.push(
            supabase
                .from('sp_processos_crime')
                .select('*')
                .eq('numero_sequencial', seq)
                .eq('ano', year)
                .then(({ data, error }) => {
                    if (error) debugLog.push(`Processos (Seq) Error: ${error.message}`)
                    if (data) {
                        processos.push(...data)
                        debugLog.push(`Processos (Seq) found: ${data.length}`)
                    }
                })
        )
    } else {
        debugLog.push(`No sequence pattern matched for "${cleanQuery}"`)
    }

    // 5. Seizure Search (Indirect Process Search)
    promises.push(
        supabase
            .from('sp_apreensoes_info')
            .select('processo_id')
            .or(`tipo.ilike.${term},descricao.ilike.${term}`)
            .limit(20)
            .then(async ({ data, error }) => {
                if (error) {
                    debugLog.push(`Seizure Search Error: ${error.message}`)
                    return
                }

                const processIds = data?.map((d: any) => d.processo_id).filter(Boolean) || []
                debugLog.push(`Seizures found items: ${processIds.length}`)

                if (processIds.length > 0) {
                    // Fetch related processes
                    // Remove duplicates
                    const uniqueIds = Array.from(new Set(processIds))
                    debugLog.push(`Unique Seizure Process IDs: ${uniqueIds.join(', ')}`)

                    const { data: related, error: relError } = await supabase
                        .from('sp_processos_crime')
                        .select('*')
                        .in('id', uniqueIds)

                    if (relError) debugLog.push(`Related Process Seizure Error: ${relError.message}`)
                    if (related) {
                        processos.push(...related)
                        debugLog.push(`Related Processes found: ${related.length}`)
                    }
                }
            })
    )

    // 6. Vehicle Search
    let vehicles: any[] = []
    promises.push(
        supabase
            .from('sp_apreensoes_veiculos')
            .select('*')
            .or(`matricula.ilike.${term},nuipc.ilike.${term},marca_modelo.ilike.${term}`)
            .limit(10)
            .then(({ data, error }) => {
                if (error) debugLog.push(`Vehicle Search Error: ${error.message}`)
                if (data) {
                    vehicles = data
                    debugLog.push(`Vehicles found: ${data.length}`)
                }
            })
    )

    // Wait for all safe promises
    await Promise.all(promises)

    // Deduplicate processes by ID
    let uniqueProcessos = Array.from(new Map(processos.map(item => [item.id, item])).values())
    debugLog.push(`Total Unique Processes: ${uniqueProcessos.length}`)

    // Post-processing: Fetch Linked Users for SP Processes
    if (uniqueProcessos.length > 0) {
        const nuipcs = uniqueProcessos.map((p: any) => p.nuipc_completo).filter(Boolean)

        if (nuipcs.length > 0) {
            const { data: linkedInquiries, error: linkError } = await supabase
                .from('inqueritos')
                .select('nuipc, user_id, profiles:user_id(full_name)')
                .in('nuipc', nuipcs)

            if (linkedInquiries) {
                const linkMap = new Map(linkedInquiries.map((i: any) => [i.nuipc, i.profiles?.full_name]))

                // Attach display user
                uniqueProcessos = uniqueProcessos.map((p: any) => {
                    const linkedName = linkMap.get(p.nuipc_completo)

                    // Priority:
                    // 1. Linked SII User
                    // 2. Militar Participante (ID)
                    // 3. Entidade Destino
                    let displayUser = null
                    let userSource = null

                    if (linkedName) {
                        displayUser = linkedName
                        userSource = 'SII'
                    } else if (p.militar_participante) {
                        displayUser = `Militar nº ${p.militar_participante}`
                        userSource = 'SP'
                    } else if (p.entidade_destino) {
                        displayUser = p.entidade_destino
                        userSource = 'Destino'
                    }

                    return { ...p, displayUser, userSource }
                })
            }
        } else {
            // Fallback if no NUIPCs but we have militar info
            uniqueProcessos = uniqueProcessos.map((p: any) => ({
                ...p,
                displayUser: p.militar_participante ? `Militar nº ${p.militar_participante}` : (p.entidade_destino || null),
                userSource: p.militar_participante ? 'SP' : 'Destino'
            }))
        }
    }

    return {
        correspondence,
        inquiries,
        processos: uniqueProcessos,
        vehicles,
        debugLog // Return debug info to UI
    }
}
