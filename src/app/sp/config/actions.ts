'use server'
import { createClient } from '@/lib/supabase/server'

export type FiscalYearConfig = {
    year: number
    stock_processos_start: number
    stock_precatorias_start: number
    is_active: boolean
    created_at?: string
}

export async function getFiscalYears() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sp_config_years')
        .select('*')
        .order('year', { ascending: false })

    if (error) throw new Error(error.message)
    return data as FiscalYearConfig[]
}

export async function getActiveYear() {
    const supabase = await createClient()
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
    // If no active year, return a default for 2026
    return data || { year: 2026, stock_processos_start: 0, stock_precatorias_start: 0, is_active: true }
}

export async function openNewYear(config: FiscalYearConfig, seedCount: number = 0) {
    const supabase = await createClient()

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
    const supabase = await createClient()

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

export async function updateYearConfig(year: number, stockProcessos: number, stockPrecatorias: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('sp_config_years')
        .update({
            stock_processos_start: stockProcessos,
            stock_precatorias_start: stockPrecatorias,
            updated_at: new Date().toISOString()
        })
        .eq('year', year)

    if (error) return { error: error.message }

    return { success: true }
}

export async function getYearProgress(year: number) {
    const supabase = await createClient()

    // 1. Get all NUIPCs for this year's processes
    const { data: processes } = await supabase
        .from('sp_processos_crime')
        .select('nuipc_completo')
        .eq('ano', year)
        .not('nuipc_completo', 'is', null)


    let concludedCount = 0

    if (processes && processes.length > 0) {
        const nuipcs = processes.map(p => p.nuipc_completo)

        // 2. Count how many of these are Concluded in Inqueritos
        const chunkSize = 500
        for (let i = 0; i < nuipcs.length; i += chunkSize) {
            const chunk = nuipcs.slice(i, i + chunkSize)
            const { count } = await supabase
                .from('inqueritos')
                .select('*', { count: 'exact', head: true })
                .in('nuipc', chunk)
                .eq('estado', 'concluido')

            concludedCount += (count || 0)
        }
    }




    // 3. Count Deprecadas Progress (Precatórias) - Filtered for Stock Reduction
    // Logic: Stock Reduction = Total Concluded - Concluded New Official Entries
    // This ensures new official entries (which increase flow) don't incorrectly reduce the Initial Stock count.
    const startIso = `${year}-01-01T00:00:00.000Z`
    const endIso = `${year}-12-31T23:59:59.999Z`
    const startObj = `${year}-01-01`
    const endObj = `${year}-12-31`


    // A. Get details of New Official Entries to identify "Official" vs "Manual"
    // We need to check if the concluded NUIPCs are Official (exist in sp_inqueritos_externos)
    // And if so, what year they entered.

    // First, let's identify the "Active Year" to know strictly which rule to apply
    const { data: activeYearData } = await supabase
        .from('sp_config_years')
        .select('year')
        .eq('is_active', true)
        .single()
    const activeYear = activeYearData?.year || new Date().getFullYear()

    let concludedBacklogCount = 0

    // Fetch all concluded deprecadas for the year
    const { data: allConcluded } = await supabase
        .from('inqueritos')
        .select('nuipc')
        .eq('estado', 'concluido')
        .ilike('observacoes', '%DEPRECADA%')
        .gte('data_conclusao', startIso)
    // .lte('data_conclusao', endIso) // Unbounded to count cumulative reductions since start of year


    let officialConcludedCount = 0
    let manualConcludedCount = 0

    if (allConcluded && allConcluded.length > 0) {
        // Collect NUIPCs to batch query
        const concludedNuipcs = allConcluded.map(d => d.nuipc?.trim().toUpperCase()).filter(n => n)

        // Fetch Official info for these NUIPCs
        // We use a lenient query; matches usually by nuipc
        let officialMap = new Map<string, string>() // NUIPC -> data_entrada
        if (concludedNuipcs.length > 0) {
            const chunkSize = 200
            for (let i = 0; i < concludedNuipcs.length; i += chunkSize) {
                const chunk = concludedNuipcs.slice(i, i + chunkSize)
                const { data: officials } = await supabase
                    .from('sp_inqueritos_externos')
                    .select('nuipc, data_entrada')
                    .in('nuipc', chunk)
                    .ilike('observacoes', '%DEPRECADA%') // Ensure we only match deprecadas? Not strictly necessary if NUIPC match

                officials?.forEach(o => {
                    if (o.nuipc) officialMap.set(o.nuipc.trim().toUpperCase(), o.data_entrada)
                })
            }
        }

        allConcluded.forEach(d => {
            const nuipc = d.nuipc?.trim().toUpperCase()
            const isOfficial = nuipc && officialMap.has(nuipc)
            const entryDate = isOfficial ? officialMap.get(nuipc) : null
            const entryYear = entryDate ? new Date(entryDate).getFullYear() : null

            if (isOfficial) officialConcludedCount++
            else manualConcludedCount++

            if (year === activeYear) {
                // Rule: Active Year (2026) counts "Official Backlog"
                // Manual -> Ignored (belongs to 2025)
                // New Official (Entry == 2026) -> Neutral (Ignored)
                // Old Official (Entry < 2026) -> Backlog Reduction
                if (isOfficial && entryYear && entryYear < year) {
                    concludedBacklogCount++
                }
            } else {

                // Rule: Past Year (2025) counts "Manual"
                // Official -> Ignored (belongs to 2026)
                // Manual -> Backlog Reduction
                if (!isOfficial) {
                    concludedBacklogCount++
                }
            }
        })
    }

    return {
        total_concluded: concludedCount,
        total_precatorias_concluded: concludedBacklogCount,
        total_precatorias_official: officialConcludedCount,
        total_precatorias_manual: manualConcludedCount
    }
}


