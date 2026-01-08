import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
// WARNING: This file is mixed. 
// fetchProcessos and others are CLIENT SERVICE functions now.
// HOWEVER, "fetchAllProcessosForExport" might be used by a Server Route???
// Wait, if output: 'export', there are no Server Routes. 
// So everything must be Client.
// Removing revalidatePath and server imports.

export async function fetchProcessos(page = 1, pageSize = 50, searchTerm = '', year: number = 2026) {
    const supabase = createClient()

    let query = supabase
        .from('sp_processos_crime')
        .select(`
            *,
            sp_apreensoes_info(tipo),
            sp_apreensoes_drogas(id)
        `, { count: 'exact' })
        .eq('ano', year)

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
    const supabase = createClient()

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
    const supabase = createClient()

    let query = supabase
        .from('inqueritos')
        .select(`
            *,
            profiles:user_id ( full_name )
        `)
        .order('created_at', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function fetchCorrespondenciaForExcel() {
    const supabase = createClient()

    let query = supabase
        .from('correspondencias')
        .select('*')
        .order('data_entrada', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function fetchProcessosByDateRange(startDate: string, endDate: string) {
    const supabase = createClient()

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
    const supabase = createClient()

    // Fetch all processes with related data for Charts
    const { data, error } = await supabase
        .from('sp_processos_crime')
        .select(`
            id,
            data_registo,
            total_detidos,
            entidade_destino,
            sp_detidos_info(nacionalidade),
            sp_apreensoes_drogas(*),
            sp_apreensoes_info(tipo)
        `)
        .not('nuipc_completo', 'is', null)
        .order('data_registo', { ascending: true })

    if (error) throw new Error(error.message)
    return data
}

export async function getNextFreeProcesso() {
    const supabase = createClient()
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

export async function getProcessoBySequence(seq: number, year: number = 2025) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('sp_processos_crime')
        .select('*')
        .eq('numero_sequencial', seq)
        .eq('ano', year)
        .single()

    if (error) return null
    return data
}

// --- Detidos ---

export async function getDetidos(processoId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('sp_detidos_info')
        .select('*')
        .eq('processo_id', processoId)

    if (error) return []
    return data
}

export async function getCriancas(processoId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('sp_criancas_info').select('*').eq('processo_id', processoId)
    return data || []
}

export async function getApreensoes(processoId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('sp_apreensoes_info').select('*').eq('processo_id', processoId)
    return data || []
}

export async function getDrogas(processoId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('sp_apreensoes_drogas').select('*').eq('processo_id', processoId).single()
    return data || null
}

export async function updateProcesso(id: string, formData: FormData) {
    const supabase = createClient()

    // Get current user
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

            // --- CPCJ Integration: Auto-create records in sp_cpcj ---
            if (updates.nuipc_completo) {
                for (const child of criancasList) {
                    // Check if already exists to avoid duplicates on re-save
                    const { data: existing } = await supabase
                        .from('sp_cpcj')
                        .select('id')
                        .eq('nuipc', updates.nuipc_completo)
                        .eq('nome_menor', child.nome)
                        .single()

                    if (!existing) {
                        await supabase.from('sp_cpcj').insert({
                            data_entrada: updates.data_registo || new Date().toISOString().split('T')[0],
                            nuipc: updates.nuipc_completo,
                            nome_menor: child.nome,
                            idade: parseInt(child.idade) || null,
                            motivo: 'Sinalizado via Processo Crime',
                            estado: 'Pendente',
                            observacoes: `Importado do Processo ${updates.nuipc_completo}`
                        })
                    }
                }
            }
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

    // --- Integration: Create Inquiry if SII or SII ALBUFEIRA ---
    const updateIntegration = async () => {
        if ((updates.entidade_destino === 'SII ALBUFEIRA' || updates.entidade_destino === 'SII') && updates.nuipc_completo) {
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
                        user_id: null, // Don't assign to user, let it go to "To Distribute"
                        denunciados: denunciadosList,
                        denunciantes: denunciantesList,
                        data_ocorrencia: updates.data_factos || null,
                        data_participacao: updates.data_conhecimento || null,
                        observacoes: `[Importado da SP] ${updates.observacoes || ''}`,
                        destino: 'SII'
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

    return { success: true }
}

export async function deleteProcesso(id: string) {
    const supabase = createClient()

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
        })
        .eq('id', id)

    return { success: true, error: null }
}

// --- Stats for PDF Report ---

// function fetchMonthlyReportStats removed and moved to src/app/sp/mapas/actions.ts

// --- Entidades (Destinations) ---
export async function getEntidades() {
    const supabase = createClient()
    const { data } = await supabase.from('sp_entidades').select('*').order('nome', { ascending: true })
    return data || []
}

export async function createEntidade(nome: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('sp_entidades').insert({ nome }).select().single()
    if (error) return { error: error.message }
    return { data }
}

// --- Crime Types ---
export async function getCrimeTypes() {
    const supabase = createClient()
    const { data } = await supabase.from('sp_tipo_crime').select('*').order('nome', { ascending: true })
    return data || []
}

export async function createCrimeType(nome: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('sp_tipo_crime').insert({ nome }).select().single()
    if (error) return { error: error.message }
    return { data }
}
