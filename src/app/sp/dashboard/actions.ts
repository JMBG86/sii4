'use server'

import { createClient } from '@/lib/supabase/server'

export type SeizureCategoryStats = {
    total: number;
    isValue?: boolean; // If true, total is a monetary value
    subs: Record<string, number>;
}

export async function getDashboardCounts() {
    const supabase = await createClient()

    // 1. Basic Counts
    const { count: countProcessos } = await supabase
        .from('sp_processos_crime')
        .select('*', { count: 'exact', head: true })
        .not('nuipc_completo', 'is', null)

    const { count: countInqueritosExternos } = await supabase
        .from('sp_inqueritos_externos')
        .select('*', { count: 'exact', head: true })

    const { count: countCorrespondencia } = await supabase
        .from('sp_correspondencia')
        .select('*', { count: 'exact', head: true })

    // 2. Total Detainees
    const { data: detaineesData } = await supabase
        .from('sp_processos_crime')
        .select('total_detidos')
        .not('nuipc_completo', 'is', null)

    const totalDetidos = detaineesData?.reduce((acc, curr) => acc + (curr.total_detidos || 0), 0) || 0

    // 3. Seizures Aggregation (Hierarchical)
    const { data: seizuresData } = await supabase
        .from('sp_apreensoes_info')
        .select('tipo, descricao')

    // Structure: Category -> { total: number, isValue: bool, subs: { SubCat: number } }
    const seizuresTree: Record<string, SeizureCategoryStats> = {}

    // Init function
    const getCat = (name: string, isValue = false) => {
        if (!seizuresTree[name]) seizuresTree[name] = { total: 0, isValue, subs: {} }
        return seizuresTree[name]
    }

    seizuresData?.forEach(item => {
        if (item.tipo) {
            const mainCat = item.tipo.split(':')[0].trim()

            // Handler: Numerário
            if (mainCat === 'Numerário') {
                const amount = parseFloat(item.descricao) || 0
                const cat = getCat('Numerário', true) // Mark as Value
                cat.total += amount
                // User wants "Euros" subcategory
                // We assume all numerário is Euros for now based on context
                cat.subs['Euros'] = (cat.subs['Euros'] || 0) + amount
            }
            // Handler: Material Informático
            else if (mainCat === 'Material Informático') {
                const qtd = parseInt(item.descricao) || 1 // Default to 1 if missing
                const cat = getCat('Material Informático')

                // Add to total count of items
                cat.total += qtd

                // Check for "Telemóveis" / "Smartphones" (Case Insensitive + Accent variants)
                const lowerType = item.tipo.toLowerCase()
                if (lowerType.includes('telemovel') || lowerType.includes('telemóvel') || lowerType.includes('telemoveis') || lowerType.includes('telemóveis') || lowerType.includes('smartphone')) {
                    // Normalize to "Telemóveis"
                    cat.subs['Telemóveis'] = (cat.subs['Telemóveis'] || 0) + qtd
                }
                // We can add "Computadores" etc if needed later
            }
            // Default Case
            else {
                const cat = getCat(mainCat)
                // Try parse qty, else 1
                const val = parseInt(item.descricao)
                const qty = isNaN(val) ? 1 : val

                cat.total += qty
            }
        }
    })

    // 4. Drug Seizures Aggregation
    const { data: drugsData } = await supabase
        .from('sp_apreensoes_drogas')
        .select('*')

    const drugsTotals = {
        'Heroína (g)': 0,
        'Cocaína (g)': 0,
        'Cannabis Folhas (g)': 0,
        'Cannabis Resina (g)': 0,
        'Cannabis Óleo (g)': 0,
        'Sintéticas (g)': 0,
        'Cannabis Plantas (un)': 0,
        'Subst. Psicoativas (un)': 0
    }

    drugsData?.forEach(d => {
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
