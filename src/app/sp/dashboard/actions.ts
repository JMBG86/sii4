import { createClient } from '@/lib/supabase/client'

export type SeizureCategoryStats = {
    total: number;
    isValue?: boolean;
    subs: Record<string, number>;
}

export type YearStats = {
    processos: number;
    inqueritosExternos: number;
    correspondencia: number;
    totalDetidos: number;
    seizuresTree: Record<string, SeizureCategoryStats>;
    drugsTotals: Record<string, number>;
}

export type DashboardData = {
    active: YearStats;
    previous: YearStats;
}

async function getStatsForYear(supabase: any, year: number): Promise<YearStats> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    // Parallel Queries for this year
    const [
        { count: countProcessos },
        { count: countInqueritosExternos },
        { count: countCorrespondencia },
        { data: detaineesData },
        { data: seizuresData },
        { data: drugsData }
    ] = await Promise.all([
        // 1. Processos Logic: Count non-null NUIPCs for the year
        supabase.from('sp_processos_crime')
            .select('*', { count: 'exact', head: true })
            .not('nuipc_completo', 'is', null)
            .eq('ano', year),

        // 2. Inqueritos Externos
        supabase.from('sp_inqueritos_externos')
            .select('*', { count: 'exact', head: true })
            .not('observacoes', 'ilike', '%DEPRECADA%')
            .gte('data_entrada', startDate)
            .lte('data_entrada', endDate),

        // 3. Correspondencia
        supabase.from('correspondencias')
            .select('*', { count: 'exact', head: true })
            .gte('data_entrada', startDate)
            .lte('data_entrada', endDate),

        // 4. Detainees (Real Count via Join)
        supabase.from('sp_detidos_info')
            .select('quantidade, sp_processos_crime!inner(ano)')
            .eq('sp_processos_crime.ano', year),

        // 5. Seizures Info (Real Count via Join)
        supabase.from('sp_apreensoes_info')
            .select('tipo, descricao, sp_processos_crime!inner(ano)')
            .eq('sp_processos_crime.ano', year),

        // 6. Drugs (Real Count via Join)
        supabase.from('sp_apreensoes_drogas')
            .select('*, sp_processos_crime!inner(ano)')
            .eq('sp_processos_crime.ano', year)
    ])

    // Calculate Total Detainees from real rows
    const totalDetidos = detaineesData?.reduce((acc: number, curr: any) => acc + (curr.quantidade || 0), 0) || 0

    // --- Seizures Aggregation ---
    const seizuresTree: Record<string, SeizureCategoryStats> = {}
    const getCat = (name: string, isValue = false) => {
        if (!seizuresTree[name]) seizuresTree[name] = { total: 0, isValue, subs: {} }
        return seizuresTree[name]
    }

    seizuresData?.forEach((item: any) => {
        if (item.tipo) {
            const mainCat = item.tipo.split(':')[0].trim()
            if (mainCat === 'Numerário') {
                const amount = parseFloat(item.descricao) || 0
                const cat = getCat('Numerário', true)
                cat.total += amount
                cat.subs['Euros'] = (cat.subs['Euros'] || 0) + amount
            } else if (mainCat === 'Material Informático') {
                const qtd = parseInt(item.descricao) || 1
                const cat = getCat('Material Informático')
                cat.total += qtd
                const lowerType = item.tipo.toLowerCase()
                if (lowerType.includes('telemovel') || lowerType.includes('telemóvel') || lowerType.includes('telemoveis') || lowerType.includes('telemóveis') || lowerType.includes('smartphone')) {
                    cat.subs['Telemóveis'] = (cat.subs['Telemóveis'] || 0) + qtd
                }
            } else {
                const cat = getCat(mainCat)
                const val = parseInt(item.descricao)
                const qty = isNaN(val) ? 1 : val
                cat.total += qty
            }
        }
    })

    // --- Drug Seizures Aggregation ---
    const drugsTotals = {
        'Heroína (g)': 0,
        'Cocaína (g)': 0,
        'Cannabis Folhas (g)': 0,
        'Cannabis Resina (g)': 0,
        'Cannabis Óleo (g)': 0,
        'Sintéticas (g)': 0,
        'Cannabis Plantas (un)': 0,
        'Subst. Psicoativas (un)': 0
    } // cast as Record<string, number> later if needed

    drugsData?.forEach((d: any) => {
        drugsTotals['Heroína (g)'] += d.heroina_g || 0
        drugsTotals['Cocaína (g)'] += d.cocaina_g || 0
        drugsTotals['Cannabis Folhas (g)'] += d.cannabis_folhas_g || 0
        drugsTotals['Cannabis Resina (g)'] += d.cannabis_resina_g || 0
        drugsTotals['Cannabis Óleo (g)'] += d.cannabis_oleo_g || 0
        drugsTotals['Sintéticas (g)'] += d.sinteticas_g || 0
        drugsTotals['Cannabis Plantas (un)'] += d.cannabis_plantas_un || 0
        drugsTotals['Subst. Psicoativas (un)'] += d.substancias_psicoativas_un || 0
    })

    return {
        processos: countProcessos || 0,
        inqueritosExternos: countInqueritosExternos || 0,
        correspondencia: countCorrespondencia || 0,
        totalDetidos,
        seizuresTree,
        drugsTotals
    }
}

export async function getDashboardCounts(activeYear: number = 2025, previousYear: number = 2024): Promise<DashboardData> {
    const supabase = createClient()

    const [active, previous] = await Promise.all([
        getStatsForYear(supabase, activeYear),
        getStatsForYear(supabase, previousYear)
    ])

    return { active, previous }
}
