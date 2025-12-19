'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fetchProcessos(page = 1, pageSize = 50, searchTerm = '') {
    const supabase = await createClient()

    let query = supabase
        .from('sp_processos_crime')
        .select(`
            *,
            sp_apreensoes_info(tipo),
            sp_apreensoes_drogas(id)
        `, { count: 'exact' })

    if (searchTerm) {
        query = query.or(`nuipc_completo.ilike.%${searchTerm}%,arguido.ilike.%${searchTerm}%,denunciante.ilike.%${searchTerm}%`)
    } else {
        // Default sort by sequence
        query = query.order('numero_sequencial', { ascending: true })
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, count, error } = await query.range(start, end)

    if (error) throw new Error(error.message)
    return { data, count }
}

export async function fetchAllProcessosForExport() {
    const supabase = await createClient()

    let query = supabase
        .from('sp_processos_crime')
        .select(`
            *,
            sp_detidos_info(*),
            sp_apreensoes_info(*),
            sp_apreensoes_drogas(*)
        `)
        .not('nuipc_completo', 'is', null) // Only registered
        .order('numero_sequencial', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function fetchInqueritosForExcel() {
    const supabase = await createClient()

    let query = supabase
        .from('inqueritos')
        .select(`
            *,
            profiles:user_id ( full_name )
        `)
        .order('created_at', { ascending: true })

    // Note: 'inqueritos' table has 'user_id' for distribution (investigator), not necessarily creator.
    // However, for this SP Export context, if we want to filter by "My Inquiries/Deprecadas", we should filter by user_id.
    // For Deprecadas (which live in inqueritos + sp_inqueritos_externos), we might need to be careful.
    // If the requirement is "My work", filtering by user_id (distribution) makes sense for Inquiries.
    // For Deprecadas which are "External", if they have a user_id column added (via migration) to sp_inqueritos_externos,
    // we should filter THERE. But this function fetches 'inqueritos'. 
    // If the user meant "SP Mapas" -> "My SP work", then we filter sp_processos_crime by user_id.
    // For 'inqueritos' (External), usually they are distributed. 
    // Let's assume passed userIdParam applies to 'user_id' here too if meaningful.
    /* 
       Actually, `fetchInqueritosForExcel` usually fetches External Inquiries (based on usage in Excel service).
       These are filtered later in Excel service into Externos and Precatorias.
       Since we don't have a clear "creator" on inqueritos for external stuff (except the new user_id column on sp_inqueritos_externos),
       we might need to join or fetch from sp_inqueritos_externos instead if we want strictly "SP Creator".
       However, to stick to the request "Filter reports by Logged-in User", we'll filter by user_id here.
    */
    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function fetchCorrespondenciaForExcel() {
    const supabase = await createClient()

    let query = supabase
        .from('correspondencias')
        .select('*')
        .order('data_entrada', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function fetchProcessosByDateRange(startDate: string, endDate: string) {
    const supabase = await createClient()

    let query = supabase
        .from('sp_processos_crime')
        .select(`
            *,
            sp_detidos_info(*),
            sp_apreensoes_info(*),
            sp_apreensoes_drogas(*)
        `)
        .not('nuipc_completo', 'is', null) // Only registered
        .gte('data_registo', startDate)
        .lte('data_registo', endDate)
        .order('numero_sequencial', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function fetchStatisticsData() {
    const supabase = await createClient()

    // Fetch all processes with related data for Charts
    const { data, error } = await supabase
        .from('sp_processos_crime')
        .select(`
            id,
            data_registo,
            total_detidos,
            sp_detidos_info(nacionalidade),
            sp_apreensoes_drogas(*)
        `)
        .not('nuipc_completo', 'is', null)
        .order('data_registo', { ascending: true })

    if (error) throw new Error(error.message)
    return data
}

export async function getNextFreeProcesso() {
    // Finds the first record where NUIPC is null (meaning it's a "free slot")
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sp_processos_crime')
        .select('*')
        .is('nuipc_completo', null)
        .order('numero_sequencial', { ascending: true })
        .limit(1)
        .single()

    if (error) return null
    return data
}

export async function getProcessoBySequence(seq: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sp_processos_crime')
        .select('*')
        .eq('numero_sequencial', seq)
        .single()

    if (error) return null
    return data
}

// --- Detidos ---

export async function getDetidos(processoId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sp_detidos_info')
        .select('*')
        .eq('processo_id', processoId)

    if (error) return []
    return data
}

export async function getCriancas(processoId: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('sp_criancas_info').select('*').eq('processo_id', processoId)
    return data || []
}

export async function getApreensoes(processoId: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('sp_apreensoes_info').select('*').eq('processo_id', processoId)
    return data || []
}

export async function getDrogas(processoId: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('sp_apreensoes_drogas').select('*').eq('processo_id', processoId).single()
    return data || null
}

export async function updateProcesso(id: string, formData: FormData) {
    const supabase = await createClient()

    // Get current user to stamp ownership if new/updating
    const { data: { user } } = await supabase.auth.getUser()

    const updates: any = {
        updated_at: new Date().toISOString()
    }

    if (user?.id) {
        updates.user_id = user.id
    }

    // Map FormData to DB columns
    const fields = [
        'nuipc_completo', 'data_registo', 'data_factos', 'data_conhecimento', 'localizacao',
        'tipo_crime', 'denunciante', 'vitima', 'arguido',
        'envio_em', 'numero_oficio_envio', 'entidade_destino', 'observacoes'
    ]

    fields.forEach(field => {
        const value = formData.get(field)
        if (value !== null) updates[field] = value
    })

    // Booleans
    updates.detidos = formData.get('detidos') === 'on'
    updates.criancas_sinalizadas = formData.get('criancas_sinalizadas') === 'on'
    updates.apreensoes = formData.get('apreensoes') === 'on'
    updates.imagens_associadas = formData.get('imagens_associadas') === 'on'
    updates.notificacao_imagens = formData.get('notificacao_imagens') === 'on'

    // Update Main Process
    const { error: processError } = await supabase
        .from('sp_processos_crime')
        .update(updates)
        .eq('id', id)

    if (processError) return { error: processError.message }

    // --- Related Tables Handlers (Optimized with Promise.all) ---
    const promises = []

    // 1. Detainees
    const detidosInfoJson = formData.get('detidos_info_json') as string
    let detidosList: any[] = []
    if (detidosInfoJson) {
        try { detidosList = JSON.parse(detidosInfoJson) } catch (e) { }
    }

    const updateDetidos = async () => {
        await supabase.from('sp_detidos_info').delete().eq('processo_id', id)
        if (updates.detidos && detidosList.length > 0) {
            const rows = detidosList.map((d: any) => ({
                processo_id: id,
                nacionalidade: d.nacionalidade,
                quantidade: parseInt(d.quantidade),
                sexo: d.sexo
            }))
            await supabase.from('sp_detidos_info').insert(rows)

            // Update Total Detainees count on parent
            const total = detidosList.reduce((acc: number, curr: any) => acc + (parseInt(curr.quantidade) || 0), 0)
            await supabase.from('sp_processos_crime').update({ total_detidos: total }).eq('id', id)
        } else {
            await supabase.from('sp_processos_crime').update({ total_detidos: 0 }).eq('id', id)
        }
    }
    promises.push(updateDetidos())

    // 2. Children (Criancas)
    const criancasInfoJson = formData.get('criancas_info_json') as string
    let criancasList: any[] = []
    if (criancasInfoJson) {
        try { criancasList = JSON.parse(criancasInfoJson) } catch (e) { }
    }

    const updateCriancas = async () => {
        await supabase.from('sp_criancas_info').delete().eq('processo_id', id)
        if (updates.criancas_sinalizadas && criancasList.length > 0) {
            const rows = criancasList.map((d: any) => ({
                processo_id: id,
                nome: d.nome,
                idade: parseInt(d.idade)
            }))
            await supabase.from('sp_criancas_info').insert(rows)
        }
    }
    promises.push(updateCriancas())

    // 3. Generic Seizures (Apreensoes Info)
    const apreensoesInfoJson = formData.get('apreensoes_info_json') as string
    let seizuresList: any[] = []
    if (apreensoesInfoJson) {
        try { seizuresList = JSON.parse(apreensoesInfoJson) } catch (e) { }
    }

    const updateApreensoes = async () => {
        await supabase.from('sp_apreensoes_info').delete().eq('processo_id', id)
        if (updates.apreensoes && seizuresList.length > 0) {
            const rows = seizuresList.map((d: any) => ({
                processo_id: id,
                tipo: d.tipo,
                descricao: d.descricao
            }))
            await supabase.from('sp_apreensoes_info').insert(rows)
        }
    }
    promises.push(updateApreensoes())

    // 4. Drug Seizures (SPApreensaoDroga - 1:1 relationship)
    const drogasInfoJson = formData.get('drogas_info_json') as string
    let drogasData: any = {}
    if (drogasInfoJson) {
        try { drogasData = JSON.parse(drogasInfoJson) } catch (e) { }
    }

    const updateDrogas = async () => {
        await supabase.from('sp_apreensoes_drogas').delete().eq('processo_id', id)
        if (updates.apreensoes && Object.keys(drogasData).length > 0) {
            const drugRow = {
                processo_id: id,
                heroina_g: parseFloat(drogasData.heroina_g) || 0,
                cocaina_g: parseFloat(drogasData.cocaina_g) || 0,
                cannabis_folhas_g: parseFloat(drogasData.cannabis_folhas_g) || 0,
                cannabis_resina_g: parseFloat(drogasData.cannabis_resina_g) || 0,
                cannabis_oleo_g: parseFloat(drogasData.cannabis_oleo_g) || 0,
                sinteticas_g: parseFloat(drogasData.sinteticas_g) || 0,
                cannabis_plantas_un: parseInt(drogasData.cannabis_plantas_un) || 0,
                substancias_psicoativas_un: parseInt(drogasData.substancias_psicoativas_un) || 0
            }
            await supabase.from('sp_apreensoes_drogas').insert(drugRow)
        }
    }
    promises.push(updateDrogas())

    // --- Integration: Create Inquiry if SII ALBUFEIRA ---
    const updateIntegration = async () => {
        if (updates.entidade_destino === 'SII ALBUFEIRA' && updates.nuipc_completo) {
            try {
                // Check if exists
                const { data: existing } = await supabase
                    .from('inqueritos')
                    .select('id')
                    .eq('nuipc', updates.nuipc_completo)
                    .single()

                if (!existing) {
                    // Prepare arrays for JSONB
                    const denunciadosList = []
                    if (updates.arguido) denunciadosList.push({ nome: updates.arguido })

                    const denunciantesList = []
                    if (updates.denunciante) denunciantesList.push({ nome: updates.denunciante })
                    if (updates.vitima) denunciantesList.push({ nome: updates.vitima })

                    // Create Pending Inquiry
                    const { error: insertError } = await supabase.from('inqueritos').insert({
                        nuipc: updates.nuipc_completo,
                        tipo_crime: updates.tipo_crime,
                        estado: 'por_iniciar',
                        classificacao: 'normal',
                        user_id: user?.id || null, // Assign to current user if available? Or null/distribution? Usually null until Distributed.
                        denunciados: denunciadosList,
                        denunciantes: denunciantesList,
                        data_ocorrencia: updates.data_factos || null,
                        data_participacao: updates.data_conhecimento || null,
                        observacoes: `[Importado da SP] ${updates.observacoes || ''}`,
                        destino: 'SII ALBUFEIRA'
                    })

                    if (insertError) {
                        console.error('Error creating linked inquiry:', insertError)
                    }
                }
            } catch (err) {
                console.error('Integration error:', err)
            }
        }
    }
    promises.push(updateIntegration())

    // AWAIT ALL PARALLEL
    await Promise.all(promises)

    revalidatePath('/sp/processos-crime')
    return { success: true }
}

export async function deleteProcesso(id: string) {
    const supabase = await createClient()

    // 1. Delete Detainees
    await Promise.all([
        supabase.from('sp_detidos_info').delete().eq('processo_id', id),
        supabase.from('sp_criancas_info').delete().eq('processo_id', id),
        supabase.from('sp_apreensoes_info').delete().eq('processo_id', id),
        supabase.from('sp_apreensoes_drogas').delete().eq('processo_id', id)
    ])

    // 2. Reset the process record (don't delete the row, just clear fields)
    const { error } = await supabase
        .from('sp_processos_crime')
        .update({
            nuipc_completo: null,
            data_registo: null,
            detidos: false,
            total_detidos: 0,
            criancas_sinalizadas: false,
            apreensoes: false,
            localizacao: null,
            tipo_crime: null,
            denunciante: null,
            vitima: null,
            arguido: null,
            envio_em: null,
            numero_oficio_envio: null,
            entidade_destino: null,
            observacoes: null,
            updated_at: new Date().toISOString()
            // Should we clear user_id? Probably keep it or clear it. Let's clear it to be safe 'unclaim' slot.
            // user_id: null 
        })
        .eq('id', id)

    revalidatePath('/sp/processos-crime')
    return { success: true, error: null }
}

// --- Stats for PDF Report ---

export async function fetchMonthlyReportStats(startDate: string, endDate: string) {
    const supabase = await createClient()

    // 1. ENTRIES IN MONTH (Entrados) for SP Report
    // Sum of Processos Crime -> 'SII ALBUFEIRA' AND External Inquiries -> 'SII ALBUFEIRA'
    // DEDUPLICATED by NUIPC.

    // a) SP Processos Crime -> 'SII ALBUFEIRA'
    let procQuery = supabase
        .from('sp_processos_crime')
        .select('nuipc_completo')
        .not('nuipc_completo', 'is', null)
        .gte('data_registo', startDate)
        .lte('data_registo', endDate)
        .eq('entidade_destino', 'SII ALBUFEIRA')

    const { data: procSIIData } = await procQuery

    // b) External Inquiries -> 'SII ALBUFEIRA'
    // This is trickier if we want to filter by user. 
    // Usually 'inqueritos' table doesn't have the SP User ID unless we check sp_inqueritos_externos.
    // If strict filtering is required, we should look at sp_inqueritos_externos.

    let extQuery = supabase
        .from('sp_inqueritos_externos')
        .select('nuipc, id')
        .gte('data_entrada', startDate)
        .lte('data_entrada', endDate)
        .eq('destino', 'SII ALBUFEIRA')

    const { data: extSIIData } = await extQuery

    // Combine and Count Unique NUIPCs to avoid double counting
    const nuipcs = new Set<string>()

    // Fetch Deprecated NUIPCs to exclude them (Global Check)
    // We check ANY query with 'DEPRECADA' in observations to act as a blacklist.
    const { data: deprecatedData } = await supabase
        .from('inqueritos')
        .select('nuipc')
        .ilike('observacoes', '%DEPRECADA%')
        .not('nuipc', 'is', null)

    const deprecatedSet = new Set(deprecatedData?.map(d => d.nuipc?.trim().toUpperCase()) || [])

    procSIIData?.forEach(p => {
        if (p.nuipc_completo) {
            const n = p.nuipc_completo.trim().toUpperCase()
            if (!deprecatedSet.has(n)) nuipcs.add(n)
        }
    })

    extSIIData?.forEach(e => {
        if (e.nuipc) {
            const n = e.nuipc.trim().toUpperCase()
            if (!deprecatedSet.has(n)) nuipcs.add(n)
        }
    })

    const entrados = nuipcs.size

    // 2. CONCLUDED IN MONTH (Concluídos)
    // Completed in SII during this period (Distributed + Concluded)
    // If filtering by SP User, this metric is less relevant unless the SP User IS the SII User.
    // Assuming SP User == SII User for personal stats.
    let conclQuery = supabase
        .from('inqueritos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'concluido')
        .gte('data_conclusao', startDate)
        .lte('data_conclusao', endDate)
        .not('user_id', 'is', null) // Distributed
        .not('observacoes', 'ilike', '%DEPRECADA%')

    const { count: countConcluded } = await conclQuery

    const concluidos = countConcluded || 0

    // 3. PENDING PREVIOUS MONTH (Stock Inicial)
    // Active Inquiries created < startDate.
    let stockQuery = supabase
        .from('inqueritos')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', startDate)
        .or(`estado.neq.concluido,data_conclusao.gte.${startDate}`)
        .not('observacoes', 'ilike', '%DEPRECADA%')

    const { count: countStock } = await stockQuery

    const pendentesAnterior = countStock || 0

    // 4. TRANSIT (Stock Final)
    // Previous + Entries - Concluded
    const transitam = pendentesAnterior + entrados - concluidos

    // --- DEPRECADA STATS ---

    // --- DEPRECADA STATS (Deduplicated by NUIPC) ---
    // We use Sets to count unique NUIPCs to prevent double-counting if duplicate records exist.

    // D1. Deprecadas Pendentes Anterior
    // Using 'inqueritos' table for stats. If we filter by user, we need to know if the user is the 'distributor' (user_id).
    let depPendQuery = supabase
        .from('inqueritos')
        .select('nuipc')
        .lt('created_at', startDate)
        .or(`estado.neq.concluido,data_conclusao.gte.${startDate}`)
        .ilike('observacoes', '%DEPRECADA%')

    const { data: depPendData } = await depPendQuery

    // Filter valid NUIPCs and deduplicate
    const depPendentes = new Set(
        depPendData
            ?.map(d => d.nuipc?.trim().toUpperCase())
            .filter(n => n) || []
    ).size

    // D2. Deprecadas Entradas (Registadas no mês)
    let depEntQuery = supabase
        .from('inqueritos')
        .select('nuipc')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .ilike('observacoes', '%DEPRECADA%')

    const { data: depEntradasData } = await depEntQuery

    const depEntradas = new Set(
        depEntradasData
            ?.map(d => d.nuipc?.trim().toUpperCase())
            .filter(n => n) || []
    ).size

    // D3. Deprecadas Concluidas (Saídas)
    let depConclQuery = supabase
        .from('inqueritos')
        .select('nuipc')
        .eq('estado', 'concluido')
        .gte('data_conclusao', startDate)
        .lte('data_conclusao', endDate)
        .ilike('observacoes', '%DEPRECADA%')

    const { data: depConcluidasData } = await depConclQuery

    const depConcluidas = new Set(
        depConcluidasData
            ?.map(d => d.nuipc?.trim().toUpperCase())
            .filter(n => n) || []
    ).size

    // D4. Deprecadas Transitadas
    const depTransitam = depPendentes + depEntradas - depConcluidas

    return {
        pendentesAnterior,
        entrados,
        concluidos,
        transitam,
        deprecadas: {
            pendentes: depPendentes,
            entradas: depEntradas,
            concluidas: depConcluidas,
            transitam: depTransitam
        }
    }
}

// --- Entidades (Destinations) ---
export async function getEntidades() {
    const supabase = await createClient()
    const { data } = await supabase.from('sp_entidades').select('*').order('nome', { ascending: true })
    return data || []
}

export async function createEntidade(nome: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('sp_entidades').insert({ nome }).select().single()
    if (error) return { error: error.message }
    revalidatePath('/sp/processos-crime')
    return { data }
}
