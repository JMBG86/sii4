'use server'

import { createClient } from '@/lib/supabase/server'

export async function fetchMonthlyReportStats(startDate: string, endDate: string) {
    const supabase = await createClient()
    const startObj = new Date(startDate)
    const year = startObj.getFullYear()
    const jan1 = `${year}-01-01`

    // 0. Get Fiscal Year Config for Stock
    const { data: fiscalYear, error: fiscalError } = await supabase
        .from('sp_config_years')
        .select('*')
        .eq('year', year)
        .single()


    // Default stocks if not configured

    let stockProcStart = fiscalYear?.stock_processos_start || 0
    let stockPrecStart = fiscalYear?.stock_precatorias_start || 0

    // FALLBACK: If Stock 2026 is 0, calculate carryover from Previous Year (e.g. 2025)
    if (stockProcStart === 0 || stockPrecStart === 0) {
        const prevYear = year - 1

        const { data: prevConfig } = await supabase
            .from('sp_config_years')
            .select('*')
            .eq('year', prevYear)
            .single()

        if (prevConfig) {
            const pStart = `${prevYear}-01-01`
            const pEnd = `${prevYear}-12-31`

            // PROCESSOS CRIME FALLBACK
            if (stockProcStart === 0) {
                const prevStart = prevConfig.stock_processos_start || 0

                // Prev Entries
                const { data: pProc } = await supabase.from('sp_processos_crime').select('nuipc_completo').not('nuipc_completo', 'is', null).gte('data_registo', pStart).lte('data_registo', pEnd)
                const { data: pExt } = await supabase.from('sp_inqueritos_externos').select('nuipc').gte('data_entrada', pStart).lte('data_entrada', pEnd).not('observacoes', 'ilike', '%DEPRECADA%')
                const pEntrados = new Set([...(pProc?.map(x => x.nuipc_completo) || []), ...(pExt?.map(x => x.nuipc) || [])]).size

                // Prev Exits
                const { count: pConcl } = await supabase.from('inqueritos').select('*', { count: 'exact', head: true }).eq('estado', 'concluido').gte('data_conclusao', pStart).lte('data_conclusao', pEnd).not('observacoes', 'ilike', '%DEPRECADA%')

                stockProcStart = prevStart + pEntrados - (pConcl || 0)
            }

            // DEPRECADAS FALLBACK
            if (stockPrecStart === 0) {
                const prevPrecStart = prevConfig.stock_precatorias_start || 0

                // Prev Deprecada Entries (Official)
                const { data: dExt } = await supabase.from('sp_inqueritos_externos').select('nuipc').gte('data_entrada', pStart).lte('data_entrada', pEnd).ilike('observacoes', '%DEPRECADA%')
                const dEntrados = new Set(dExt?.map(x => x.nuipc?.trim().toUpperCase()).filter(n => n) || []).size

                // Prev Deprecada Exits (All)
                const { count: dConcl } = await supabase.from('inqueritos').select('*', { count: 'exact', head: true }).eq('estado', 'concluido').gte('data_conclusao', pStart).lte('data_conclusao', pEnd).ilike('observacoes', '%DEPRECADA%')

                stockPrecStart = prevPrecStart + dEntrados - (dConcl || 0)
            }
        }
    }

    // --- 1. ENTRIES IN MONTH (Entrados) ---
    // Rule: "Registados via SP" -> Official Entrances (sp_processos_crime + sp_inqueritos_externos)
    // Exclude Deprecadas (handled in Table 2)
    const getEntradosSet = async (from: string, to: string) => {
        const { data: p } = await supabase
            .from('sp_processos_crime')
            .select('nuipc_completo')
            .not('nuipc_completo', 'is', null)
            .gte('data_registo', from)
            .lte('data_registo', to)

        const { data: e } = await supabase
            .from('sp_inqueritos_externos')
            .select('nuipc')
            .gte('data_entrada', from)
            .lte('data_entrada', to)
            .not('observacoes', 'ilike', '%DEPRECADA%') // Exclude Deprecadas

        const result = new Set<string>()

        // Add Processos Crime
        p?.forEach(x => {
            if (x.nuipc_completo) result.add(x.nuipc_completo.trim().toUpperCase())
        })

        // Add External Inquiries (Non-Deprecada)
        e?.forEach(x => {
            if (x.nuipc) result.add(x.nuipc.trim().toUpperCase())
        })

        return result
    }

    const entradosSet = await getEntradosSet(startDate, endDate)
    const entrados = entradosSet.size

    // --- 2. CONCLUDED IN MONTH ---
    // Rule: "Todos os concluidos independentemente da origem", exceto Deprecadas
    const getConcluidos = async (from: string, to: string) => {
        const { data, count } = await supabase
            .from('inqueritos')
            .select('nuipc, data_conclusao', { count: 'exact' })
            .eq('estado', 'concluido')
            .gte('data_conclusao', from)
            .lte('data_conclusao', to)
            .not('observacoes', 'ilike', '%DEPRECADA%') // Exclude Deprecadas

        return count || 0
    }
    const concluidos = await getConcluidos(startDate, endDate)


    // --- 3. PENDING PREVIOUS MONTH (Stock Inicial do Mês) ---
    // Rule: StockStart (2025/2026) + Entries YTD - Exits YTD
    let pendentesAnterior = stockProcStart

    if (startDate > jan1) {
        const ytdEnd = new Date(startObj.getTime() - 86400000).toISOString().split('T')[0]

        // Entries YTD
        const entriesYTDSet = await getEntradosSet(jan1, ytdEnd)
        const entriesYTD = entriesYTDSet.size

        // Exits YTD
        const exitsYTD = await getConcluidos(jan1, ytdEnd)

        pendentesAnterior = stockProcStart + entriesYTD - exitsYTD
    }

    // 4. TRANSIT (Stock Final)
    const transitam = pendentesAnterior + entrados - concluidos



    // --- DEPRECADA STATS ---
    // Logic Mirrors Table 1 but filtered for DEPRECADA

    // D1. Entradas Deprecadas (Month) - Use sp_inqueritos_externos (Official Entries only)
    const getDepEntradas = async (from: string, to: string) => {
        const { data } = await supabase
            .from('sp_inqueritos_externos')
            .select('nuipc')
            .gte('data_entrada', from)
            .lte('data_entrada', to)
            .ilike('observacoes', '%DEPRECADA%')
        return new Set(data?.map(d => d.nuipc?.trim().toUpperCase()).filter(n => n) || []).size
    }
    const depEntradas = await getDepEntradas(startDate, endDate)

    // D2. Concluidas Deprecadas (Month) - Use inqueritos (All completions, including manual)
    const getDepConcluidas = async (from: string, to: string) => {
        const { count } = await supabase
            .from('inqueritos')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'concluido')
            .gte('data_conclusao', from)
            .lte('data_conclusao', to)
            .ilike('observacoes', '%DEPRECADA%')

        return count || 0
    }
    const depConcluidas = await getDepConcluidas(startDate, endDate)

    // D3. Pendentes Anterior (Stock Logic)
    let depPendentes = stockPrecStart

    if (startDate > jan1) {
        const ytdEnd = new Date(startObj.getTime() - 86400000).toISOString().split('T')[0]

        // Entries YTD - Use sp_inqueritos_externos
        const { data: entYTD } = await supabase
            .from('sp_inqueritos_externos')
            .select('nuipc')
            .gte('data_entrada', jan1)
            .lte('data_entrada', ytdEnd) // Fix: use lte ytdEnd
            .ilike('observacoes', '%DEPRECADA%')
        const entYTDCount = new Set(entYTD?.map(d => d.nuipc?.trim().toUpperCase()).filter(n => n) || []).size

        // Exits YTD - Use inqueritos
        const { count: exitYTDCount } = await supabase
            .from('inqueritos')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'concluido')
            .gte('data_conclusao', jan1)
            .lte('data_conclusao', ytdEnd) // Fix: use lte ytdEnd
            .ilike('observacoes', '%DEPRECADA%')

        depPendentes = stockPrecStart + entYTDCount - (exitYTDCount || 0)
    }

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
