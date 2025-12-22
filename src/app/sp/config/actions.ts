import { createClient } from '@/lib/supabase/client'

export type FiscalYearConfig = {
    year: number
    stock_processos_start: number
    stock_precatorias_start: number
    is_active: boolean
    created_at?: string
}

export async function getFiscalYears() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('sp_config_years')
        .select('*')
        .order('year', { ascending: false })

    if (error) throw new Error(error.message)
    return data as FiscalYearConfig[]
}

export async function getActiveYear() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('sp_config_years')
        .select('*')
        .eq('is_active', true)
        .order('year', { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') {
        throw new Error(error.message)
    }
    // If no active year, return a default for 2025
    return data || { year: 2025, stock_processos_start: 0, stock_precatorias_start: 0, is_active: true }
}

export async function openNewYear(config: FiscalYearConfig, seedCount: number = 0) {
    const supabase = createClient()

    // 1. Register Year
    const { error: configError } = await supabase
        .from('sp_config_years')
        .upsert({
            year: config.year,
            stock_processos_start: config.stock_processos_start || 0,
            stock_precatorias_start: config.stock_precatorias_start || 0,
            is_active: true // Auto-activate
        })

    if (configError) return { error: configError.message }

    // 2. Deactivate other years?
    // Optional: we might want multiple active? Usually only one "Write" year.
    // For now, let's keep all active but UI decides which to show.
    // Or set others to is_active=false.
    await supabase.from('sp_config_years').update({ is_active: false }).neq('year', config.year)


    // 3. Seed Process Structure (sp_processos_crime)
    // Create 'seedCount' empty rows with seq 1..N and ano = config.year
    if (seedCount > 0) {
        // Generate array of objects
        const rows = []
        for (let i = 1; i <= seedCount; i++) {
            rows.push({
                numero_sequencial: i,
                ano: config.year,
                detidos: false,
                criancas_sinalizadas: false,
                apreensoes: false,
                imagens_associadas: false,
                notificacao_imagens: false
                // Other fields null
            })
        }

        // Batch insert (Split into chunks if large)
        const chunkSize = 100
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize)
            const { error: seedError } = await supabase
                .from('sp_processos_crime')
                .insert(chunk)

            if (seedError) {
                console.error(`Error seeding chunk ${i}:`, JSON.stringify(seedError, null, 2))
                return { error: `Erro ao criar linhas: ${seedError.message}. Details: ${seedError.details || ''}` }
            }
        }
    }

    return { success: true }
}

export async function deleteYear(year: number) {
    const supabase = createClient()

    // Safety check: Cannot delete 2025 (Root) or prevent accidental data loss?
    // User requested "apagar para efeitos de testes".

    // 1. Delete rows in sp_processos_crime
    const { error: rowsError } = await supabase
        .from('sp_processos_crime')
        .delete()
        .eq('ano', year)

    if (rowsError) return { error: rowsError.message }

    // 2. Delete config
    const { error: configError } = await supabase
        .from('sp_config_years')
        .delete()
        .eq('year', year)

    if (configError) return { error: configError.message }

    return { success: true }
}
