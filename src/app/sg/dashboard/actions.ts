'use server'
import { createClient } from '@/lib/supabase/server'
import { getActiveYear } from '@/app/sp/config/actions'

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
    drugsStats: {
        count: number;
        remetido: number;
        porByRemeter: number;
    };
    cashStats: {
        total: number;
        remetido: number;
        porRemeter: number;
    };
    weaponsStats: {
        total: number;
        remetido: number;
        porRemeter: number;
    };
    totalDetidos: number;
    detaineesBreakdown: { crime: string; count: number }[];
    mobilePhones: {
        total: number;
        remetido: number;
        porRemeter: number;
    };
    hotZones: { crime: string, count: number }[];
}

export async function getSGDashboardStats(year?: number): Promise<SGDashboardData> {
    const supabase = await createClient()

    if (!year) {
        const activeConfig = await getActiveYear()
        year = activeConfig?.year || new Date().getFullYear()
    }

    const reportYear = year!

    const [
        { data: imagesInfo },
        { data: detaineesData },
        { data: seizuresData },
        { data: drugsData },
    ] = await Promise.all([
        supabase.from('sp_processos_crime')
            .select('id, imagens_associadas, notificacao_imagens')
            .eq('ano', year)
            .eq('imagens_associadas', true),

        supabase.from('sp_detidos_info')
            .select('quantidade, sp_processos_crime!inner(ano, tipo_crime)')
            .eq('sp_processos_crime.ano', year),

        supabase.from('sp_apreensoes_info')
            .select('tipo, descricao, remetido, sp_processos_crime!inner(ano)')
            .eq('sp_processos_crime.ano', year),

        supabase.from('sp_apreensoes_drogas')
            .select('*, sp_processos_crime!inner(ano)')
            .eq('sp_processos_crime.ano', year),
    ])

    // Images
    const totalImagens = imagesInfo?.length || 0
    const concludedImagens = imagesInfo?.filter((i: any) => i.notificacao_imagens === true).length || 0
    const pendingImagens = totalImagens - concludedImagens

    // Detainees
    const totalDetidos = detaineesData?.reduce((acc: number, curr: any) => acc + (curr.quantidade || 0), 0) || 0
    const detaineesMap: Record<string, number> = {}
    detaineesData?.forEach((d: any) => {
        const crime = d.sp_processos_crime?.tipo_crime || 'Outros'
        const qty = d.quantidade || 0
        detaineesMap[crime] = (detaineesMap[crime] || 0) + qty
    })
    const detaineesBreakdown = Object.entries(detaineesMap)
        .map(([crime, count]) => ({ crime, count }))
        .sort((a, b) => b.count - a.count)

    // Seizures
    const seizuresTree: Record<string, SeizureCategoryStats> = {}

    // Stats accumulators
    let phonesTotal = 0, phonesRemetido = 0, phonesPorRemeter = 0
    let cashTotal = 0, cashRemetido = 0, cashPorRemeter = 0
    let weaponsTotal = 0, weaponsRemetido = 0, weaponsPorRemeter = 0

    const getCat = (name: string, isValue = false) => {
        if (!seizuresTree[name]) seizuresTree[name] = { total: 0, isValue, subs: {} }
        return seizuresTree[name]
    }

    seizuresData?.forEach((item: any) => {
        if (item.tipo) {
            const parts = item.tipo.split(':')
            const mainCat = parts[0].trim()
            const subCat = parts.length > 1 ? parts[1].trim() : 'Geral'
            const lowerType = item.tipo.toLowerCase()

            // --- Mobile Phones logic ---
            if (lowerType.includes('telemóvel') || lowerType.includes('telemoveis')) {
                const val = parseInt(item.descricao)
                const qty = isNaN(val) ? 1 : val
                phonesTotal += qty
                if (item.remetido) phonesRemetido += qty
                else phonesPorRemeter += qty
            }

            // --- Cash Logic ---
            if (mainCat === 'Numerário') {
                const amount = parseFloat(item.descricao) || 0
                cashTotal += amount
                if (item.remetido) cashRemetido += amount
                else cashPorRemeter += amount

                // Tree Logic (Only populate tree if valid mainCat)
                const cat = getCat('Numerário', true)
                cat.total += amount
                const label = subCat !== 'Geral' ? subCat : 'Euros'
                cat.subs[label] = (cat.subs[label] || 0) + amount
            }

            // --- Weapons Logic ---
            else if (mainCat === 'Armas' || lowerType.includes('arma') || mainCat === 'Explosivos' || mainCat === 'Munições') {
                const val = parseInt(item.descricao)
                const qty = isNaN(val) ? 1 : val
                weaponsTotal += qty
                if (item.remetido) weaponsRemetido += qty
                else weaponsPorRemeter += qty

                // For the tree we keep standard categories
                const cat = getCat(mainCat)
                cat.total += qty
                cat.subs[subCat] = (cat.subs[subCat] || 0) + qty
            } else {
                // Other categories for Tree
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

    let drugsCount = 0
    let drugsRemetido = 0

    drugsData?.forEach((d: any) => {
        drugsCount++
        if (d.entregue_lpc) drugsRemetido++

        drugsTotals['Heroína (g)'] += d.heroina_g || 0
        drugsTotals['Cocaína (g)'] += d.cocaina_g || 0
        drugsTotals['Cannabis Folhas (g)'] += d.cannabis_folhas_g || 0
        drugsTotals['Cannabis Resina (g)'] += d.cannabis_resina_g || 0
        drugsTotals['Cannabis Óleo (g)'] += d.cannabis_oleo_g || 0
        drugsTotals['Sintéticas (g)'] += d.sinteticas_g || 0
        drugsTotals['Cannabis Plantas (un)'] += d.cannabis_plantas_un || 0
        drugsTotals['Subst. Psicoativas (un)'] += d.substancias_psicoativas_un || 0
    })

    const drugsPorRemeter = drugsCount - drugsRemetido

    const hotZones = [
        { crime: 'Furto Veículo', count: 12 },
        { crime: 'Tráfico', count: 5 }
    ]

    return {
        year: reportYear,
        imagesStats: {
            total: totalImagens,
            pending: pendingImagens,
            concluded: concludedImagens
        },
        seizuresTree,
        drugsTotals,
        drugsStats: {
            count: drugsCount,
            remetido: drugsRemetido,
            porByRemeter: drugsPorRemeter
        },
        cashStats: {
            total: cashTotal,
            remetido: cashRemetido,
            porRemeter: cashPorRemeter
        },
        weaponsStats: {
            total: weaponsTotal,
            remetido: weaponsRemetido,
            porRemeter: weaponsPorRemeter
        },
        totalDetidos,
        detaineesBreakdown,
        mobilePhones: {
            total: phonesTotal,
            remetido: phonesRemetido,
            porRemeter: phonesPorRemeter
        },
        hotZones
    }
}
