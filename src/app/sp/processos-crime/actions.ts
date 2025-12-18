'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Entidades ---

export async function getEntidades() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sp_entidades')
        .select('*')
        .order('nome')

    if (error) throw new Error(error.message)
    return data
}

export async function createEntidade(nome: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sp_entidades')
        .insert({ nome: nome.toUpperCase() })
        .select()
        .single()

    if (error) return { error: error.message }
    return { data }
}

// --- Processos Crime ---

export async function fetchProcessos(page: number = 1, pageSize: number = 100, searchTerm: string = '') {
    const supabase = await createClient()

    let query = supabase
        .from('sp_processos_crime')
        .select('*', { count: 'exact' })

    if (searchTerm) {
        query = query.or(`nuipc_completo.ilike.%${searchTerm}%,arguido.ilike.%${searchTerm}%,denunciante.ilike.%${searchTerm}%`)
    } else {
        // Default sort by sequence
        query = query.order('numero_sequencial', { ascending: true })
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await query.range(start, end)

    if (error) throw new Error(error.message)
    return { data, count }
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

    const updates: any = {
        updated_at: new Date().toISOString()
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

    // Update Main Process
    const { error: processError } = await supabase
        .from('sp_processos_crime')
        .update(updates)
        .eq('id', id)

    if (processError) return { error: processError.message }

    // --- Related Tables Handlers ---

    // 1. Detainees
    const detidosInfoJson = formData.get('detidos_info_json') as string
    let detidosList: any[] = []
    if (detidosInfoJson) {
        try { detidosList = JSON.parse(detidosInfoJson) } catch (e) { }
    }

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

    // 2. Children (Criancas)
    const criancasInfoJson = formData.get('criancas_info_json') as string
    let criancasList: any[] = []
    if (criancasInfoJson) {
        try { criancasList = JSON.parse(criancasInfoJson) } catch (e) { }
    }

    await supabase.from('sp_criancas_info').delete().eq('processo_id', id)
    if (updates.criancas_sinalizadas && criancasList.length > 0) {
        const rows = criancasList.map((d: any) => ({
            processo_id: id,
            nome: d.nome,
            idade: parseInt(d.idade)
        }))
        await supabase.from('sp_criancas_info').insert(rows)
    }

    // 3. Generic Seizures (Apreensoes Info)
    const apreensoesInfoJson = formData.get('apreensoes_info_json') as string
    let seizuresList: any[] = []
    if (apreensoesInfoJson) {
        try { seizuresList = JSON.parse(apreensoesInfoJson) } catch (e) { }
    }

    await supabase.from('sp_apreensoes_info').delete().eq('processo_id', id)
    if (updates.apreensoes && seizuresList.length > 0) {
        const rows = seizuresList.map((d: any) => ({
            processo_id: id,
            tipo: d.tipo,
            descricao: d.descricao
        }))
        await supabase.from('sp_apreensoes_info').insert(rows)
    }

    // 4. Drug Seizures (SPApreensaoDroga - 1:1 relationship)
    const drogasInfoJson = formData.get('drogas_info_json') as string
    let drogasData: any = {}
    if (drogasInfoJson) {
        try { drogasData = JSON.parse(drogasInfoJson) } catch (e) { }
    }

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

    // --- Integration: Create Inquiry if SII ALBUFEIRA ---
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
                    user_id: null,
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

    revalidatePath('/sp/processos-crime')
    return { success: true }
}

export async function deleteProcesso(id: string) {
    const supabase = await createClient()

    // 1. Delete Detainees
    await supabase.from('sp_detidos_info').delete().eq('processo_id', id)
    await supabase.from('sp_criancas_info').delete().eq('processo_id', id)
    await supabase.from('sp_apreensoes_info').delete().eq('processo_id', id)
    await supabase.from('sp_apreensoes_drogas').delete().eq('processo_id', id)

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

    revalidatePath('/sp/processos-crime')
    return { success: true, error: null }
}
