'use server'
import { createClient } from '@/lib/supabase/server'
import { getActiveYear } from '@/app/sp/config/actions'

// Reuse types from SP if possible or redefine slightly adapted versions
export type SeizureCategoryStats = {
    total: number;
    isValue?: boolean;
    subs: Record<string, number>;
}

export type SGDashboardData = {
    year: number;
    imagesStats: {
        total: number;
        pending: number;
        concluded: number;
    };
    seizuresTree: Record<string, SeizureCategoryStats>;
    drugsTotals: Record<string, number>;
    totalDetidos: number;
    mobilePhones: {
        total: number;
        despacho: number; // Placeholder
        pericia: number;  // Placeholder
        tribunal: number; // Placeholder
    };
    hotZones: { crime: string, count: number }[]; // Placeholder
}

export async function getSGDashboardStats(year?: number): Promise<SGDashboardData> {
    const supabase = await createClient()

    if (!year) {
        const activeConfig = await getActiveYear()
        year = activeConfig?.year || new Date().getFullYear()
    }

    // Parallel Queries
    // 1. Image Stats
    // 2. Detainees
    // 3. Seizures (General)
    // 4. Drugs
    // 5. Mobile Phones Specific

    const [
        { data: imagesInfo }, // Use data to filter locally or use count queries
        { data: detaineesData },
        { data: seizuresData },
        { data: drugsData },
    ] = await Promise.all([
        // 1. Images Info (Fetch basic flags)
        supabase.from('sp_processos_crime')
            .select('id, imagens_associadas, notificacao_imagens')
            .eq('ano', year)
            .eq('imagens_associadas', true),

        // 2. Detainees
        supabase.from('sp_detidos_info')
            .select('quantidade, sp_processos_crime!inner(ano)')
            .eq('sp_processos_crime.ano', year),

        // 3. Seizures (including Phones)
        supabase.from('sp_apreensoes_info')
            .select('tipo, descricao, sp_processos_crime!inner(ano)')
            .eq('sp_processos_crime.ano', year),

        // 4. Drugs
        supabase.from('sp_apreensoes_drogas')
            .select('*, sp_processos_crime!inner(ano)')
            .eq('sp_processos_crime.ano', year),
    ])

    // --- Process Images Stats ---
    // Total = query returned only true
    const totalImagens = imagesInfo?.length || 0
    const concludedImagens = imagesInfo?.filter((i: any) => i.notificacao_imagens === true).length || 0
    const pendingImagens = totalImagens - concludedImagens

    // --- Process Detainees ---
    const totalDetidos = detaineesData?.reduce((acc: number, curr: any) => acc + (curr.quantidade || 0), 0) || 0

    // --- Process Seizures & Phones ---
    const seizuresTree: Record<string, SeizureCategoryStats> = {}
    let mobilePhonesCount = 0

    const getCat = (name: string, isValue = false) => {
        if (!seizuresTree[name]) seizuresTree[name] = { total: 0, isValue, subs: {} }
        return seizuresTree[name]
    }

    seizuresData?.forEach((item: any) => {
        if (item.tipo) {
            const parts = item.tipo.split(':')
            const mainCat = parts[0].trim()
            const subCat = parts.length > 1 ? parts[1].trim() : 'Geral'

            // Mobile Phone Check
            if (mainCat.toLowerCase().includes('telemóvel') || mainCat.toLowerCase().includes('telemoveis')) {
                const val = parseInt(item.descricao)
                const qty = isNaN(val) ? 1 : val
                mobilePhonesCount += qty
            }

            // General Tree Logic (Copied from SP)
            if (mainCat === 'Numerário') {
                const amount = parseFloat(item.descricao) || 0
                const cat = getCat('Numerário', true)
                cat.total += amount
                const label = subCat !== 'Geral' ? subCat : 'Euros'
                cat.subs[label] = (cat.subs[label] || 0) + amount
            } else {
                const cat = getCat(mainCat)
                const val = parseInt(item.descricao)
                const qty = isNaN(val) ? 1 : val
                cat.total += qty
                cat.subs[subCat] = (cat.subs[subCat] || 0) + qty
            }
        }
    })

    // --- Process Drugs ---
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

    // --- Hot Zones Placeholder ---
    const hotZones = [
        { crime: 'Furto Veículo', count: 12 },
        { crime: 'Tráfico', count: 5 }
    ]

    return {
        year,
        imagesStats: {
            total: totalImagens,
            pending: pendingImagens,
            concluded: concludedImagens
        },
        seizuresTree,
        drugsTotals,
        totalDetidos,
        mobilePhones: {
            total: mobilePhonesCount,
            despacho: 0,
            pericia: 0,
            tribunal: 0
        },
        hotZones
    }
}
