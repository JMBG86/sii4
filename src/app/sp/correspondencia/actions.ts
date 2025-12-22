import { createClient } from '@/lib/supabase/client'

export async function createCorrespondence(formData: FormData) {
    const supabase = createClient()

    const srv = formData.get('srv') as string
    const numero_oficio = formData.get('numero_oficio') as string
    const nuipc = formData.get('nuipc') as string
    const origem = formData.get('origem') as string
    const assunto = formData.get('assunto') as string
    const destino = formData.get('destino') as string
    const data_entrada = formData.get('data_entrada') as string || new Date().toISOString()

    const { error } = await supabase
        .from('correspondencias')
        .insert({
            srv,
            numero_oficio,
            nuipc: nuipc || null,
            origem,
            assunto,
            destino,
            data_entrada
        })

    if (error) {
        return { error: error.message }
    }

    // Auto-create Inquiry for Distribution if SII and NUIPC is present
    if (destino === 'SII' && nuipc) {
        // Check if inquiry exists
        const { data: existing } = await supabase
            .from('inqueritos')
            .select('id')
            .eq('nuipc', nuipc)
            .single()

        if (!existing) {
            // Create new "Skeleton" Inquiry for distribution
            const { error: createError } = await supabase
                .from('inqueritos')
                .insert({
                    nuipc,
                    estado: 'por_iniciar',
                    classificacao: 'normal', // Default
                    observacoes: `[CRIADO VIA CORRESPONDÊNCIA SP]\nAssunto: ${assunto}\nOrigem: ${origem}\nOfício: ${numero_oficio}`,
                    user_id: null // Explicitly null for distribution
                })

            if (createError) {
                console.error('Failed to auto-create inquiry:', createError)
                // We don't fail the correspondence creation, just log error
            }
        }
    }

    return { success: true }
}

export async function checkNuipcOwner(nuipc: string) {
    const supabase = createClient()

    // Fuzzy Logic: Generate variations to ignore leading zeros mismatch
    let variations: string[] = [nuipc];

    const match = nuipc.match(/^0*(\d+)(.*)$/);
    if (match) {
        const cleanNum = match[1]; // "500"
        const suffix = match[2];   // "/25.3..."

        // Generate variations with 0 to 5 leading zeros
        const candidateBase = [
            cleanNum,
            `0${cleanNum}`,
            `00${cleanNum}`,
            `000${cleanNum}`,
            `0000${cleanNum}`,
            `00000${cleanNum}`
        ];

        variations = candidateBase.map(prefix => prefix + suffix);
    }

    // Remove duplicates
    variations = [...new Set(variations)];

    // 1. Find the inquiry using ANY of the variations
    const { data: inquiry } = await supabase
        .from('inqueritos')
        .select('user_id')
        .in('nuipc', variations)
        .limit(1)
        .maybeSingle()

    if (!inquiry) return null

    // 2. Find the user profile name
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', inquiry.user_id)
        .single()

    return profile?.full_name || null
}

export async function updateCorrespondence(id: string, formData: FormData) {
    const supabase = createClient()

    const srv = formData.get('srv') as string
    const numero_oficio = formData.get('numero_oficio') as string
    const nuipc = formData.get('nuipc') as string
    const origem = formData.get('origem') as string
    const assunto = formData.get('assunto') as string
    const destino = formData.get('destino') as string
    const data_entrada = formData.get('data_entrada') as string

    const { error } = await supabase
        .from('correspondencias')
        .update({
            srv,
            numero_oficio,
            nuipc: nuipc || null,
            origem,
            assunto,
            destino,
            data_entrada
        })
        .eq('id', id)

    if (error) return { error: error.message }

    return { success: true }
}

export async function deleteCorrespondence(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('correspondencias')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    return { success: true }
}
