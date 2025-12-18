'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fetchInqueritosExternos(searchTerm: string = '') {
    const supabase = await createClient()

    let query = supabase
        .from('sp_inqueritos_externos')
        .select('*')
        .order('created_at', { ascending: false })

    if (searchTerm) {
        query = query.or(`nuipc.ilike.%${searchTerm}%,assunto.ilike.%${searchTerm}%,numero_oficio.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export async function createInqueritoExterno(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        srv: formData.get('srv') as string,
        numero_oficio: formData.get('numero_oficio') as string,
        nuipc: formData.get('nuipc') as string,
        origem: formData.get('origem') as string,
        assunto: formData.get('assunto') as string,
        destino: formData.get('destino') as string,
        data_entrada: formData.get('data_entrada') as string,
        observacoes: formData.get('observacoes') as string
    }

    if (!rawData.nuipc) return { error: "NUIPC é obrigatório." }

    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .insert(rawData)

    if (error) return { error: error.message }

    // --- Integration: Create Inquiry if SII ALBUFEIRA ---
    // If destination is SII, create a pending inquiry in the main system
    if (rawData.destino === 'SII ALBUFEIRA') {
        try {
            // Check if exists
            const { data: existing } = await supabase
                .from('inqueritos')
                .select('id')
                .eq('nuipc', rawData.nuipc)
                .single()

            if (!existing) {
                // Prepare Denunciados array (if possible to infer? No fields in this form currently map directly to Denunciado/Denunciante names)
                // We only have generic info. We will create the inquiry with minimal info.

                const { error: insertError } = await supabase.from('inqueritos').insert({
                    nuipc: rawData.nuipc,
                    // classification/status defaults
                    estado: 'por_iniciar',
                    classificacao: 'normal',
                    user_id: null,
                    // Map other fields
                    numero_oficio: rawData.numero_oficio,
                    observacoes: `[Importado de Inq. Externos] ${rawData.observacoes || ''} | Assunto: ${rawData.assunto || ''} | Origem: ${rawData.origem || ''}`,
                    destino: 'SII ALBUFEIRA',
                    // Use generic defaults for required JSONB fields if needed, or null
                    denunciados: [],
                    denunciantes: []
                })

                if (insertError) {
                    console.error('Error creating linked inquiry from External:', insertError)
                }
            }
        } catch (err) {
            console.error('Integration error:', err)
        }
    }

    revalidatePath('/sp/inqueritos-externos')
    return { success: true }
}

export async function updateInqueritoExterno(id: string, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        srv: formData.get('srv') as string,
        numero_oficio: formData.get('numero_oficio') as string,
        nuipc: formData.get('nuipc') as string,
        origem: formData.get('origem') as string,
        assunto: formData.get('assunto') as string,
        destino: formData.get('destino') as string,
        data_entrada: formData.get('data_entrada') as string,
        observacoes: formData.get('observacoes') as string
    }

    if (!rawData.nuipc) return { error: "NUIPC é obrigatório." }

    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .update(rawData)
        .eq('id', id)

    if (error) return { error: error.message }

    // --- Integration: Create Inquiry if changed to SII ALBUFEIRA ---
    if (rawData.destino === 'SII ALBUFEIRA') {
        try {
            const { data: existing } = await supabase
                .from('inqueritos')
                .select('id')
                .eq('nuipc', rawData.nuipc)
                .single()

            if (!existing) {
                const { error: insertError } = await supabase.from('inqueritos').insert({
                    nuipc: rawData.nuipc,
                    estado: 'por_iniciar',
                    classificacao: 'normal',
                    user_id: null,
                    numero_oficio: rawData.numero_oficio,
                    observacoes: `[Importado de Inq. Externos] ${rawData.observacoes || ''} | Assunto: ${rawData.assunto || ''} | Origem: ${rawData.origem || ''}`,
                    destino: 'SII ALBUFEIRA',
                    denunciados: [],
                    denunciantes: []
                })

                if (insertError) {
                    console.error('Error creating linked inquiry from External Update:', insertError)
                }
            }
        } catch (err) {
            console.error('Integration error:', err)
        }
    }

    revalidatePath('/sp/inqueritos-externos')
    return { success: true }
}

export async function deleteInqueritoExterno(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('sp_inqueritos_externos')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/sp/inqueritos-externos')
    return { success: true }
}
