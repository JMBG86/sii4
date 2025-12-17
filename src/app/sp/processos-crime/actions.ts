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

    // Handle Booleans
    updates.detidos = formData.get('detidos') === 'on'



    // Handle Detainees Logic & Total
    const detidosInfoJson = formData.get('detidos_info_json') as string
    let detidosList: any[] = []

    if (detidosInfoJson) {
        try {
            detidosList = JSON.parse(detidosInfoJson)
        } catch (e) {
            console.error(e)
        }
    }

    if (updates.detidos) {
        // Calculate Total
        const total = detidosList.reduce((acc, curr) => acc + (parseInt(curr.quantidade) || 0), 0)
        updates.total_detidos = total
    } else {
        updates.total_detidos = 0
    }

    // Update main process first
    const { error } = await supabase
        .from('sp_processos_crime')
        .update(updates)
        .eq('id', id)

    if (error) return { error: error.message }

    // Update Detail Table
    if (detidosInfoJson) {
        try {
            // 1. Delete existing
            await supabase.from('sp_detidos_info').delete().eq('processo_id', id)

            // 2. Insert new
            if (updates.detidos && Array.isArray(detidosList) && detidosList.length > 0) {
                const rows = detidosList.map((d: any) => ({
                    processo_id: id,
                    nacionalidade: d.nacionalidade,
                    quantidade: parseInt(d.quantidade)
                }))
                await supabase.from('sp_detidos_info').insert(rows)
            }
        } catch (e) {
            console.error('Error processing detainees:', e)
        }
    }

    // Link with SII if destination is SII ALBUFEIRA
    if (updates.entidade_destino === 'SII ALBUFEIRA' && updates.nuipc_completo) {
        try {
            // Check if already exists in inqueritos
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
                    destino: updates.entidade_destino || 'SII ALBUFEIRA'
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

    // 2. Reset the process record (don't delete the row, just clear fields)
    const { error } = await supabase
        .from('sp_processos_crime')
        .update({
            nuipc_completo: null,
            data_registo: null,
            detidos: false,
            total_detidos: 0,
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
    revalidatePath('/sp/processos-crime')
    return { success: true, error: null }
}
