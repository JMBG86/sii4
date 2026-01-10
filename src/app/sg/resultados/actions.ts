'use server'

import { createClient } from '@/lib/supabase/server'

export interface OperationalStat {
    militar_id: string
    total_processos: number
    total_detidos: number
    top_crime: string
    crimes_breakdown: Record<string, number>
}

export async function fetchOperationalStats(year: number = 2026): Promise<OperationalStat[]> {
    const supabase = await createClient()

    // Fetch processes for the given year with militar_participante filled
    // We only select the fields we need. 
    // Types from DB might be inferred as any if not strictly typed, so we can cast or use generic.
    const { data: processes, error } = await supabase
        .from('sp_processos_crime')
        .select('militar_participante, total_detidos, tipo_crime')
        .eq('ano', year)
        .not('militar_participante', 'is', null)
        .neq('militar_participante', '')

    if (error) {
        console.error('Error fetching operational stats:', error)
        return []
    }

    if (!processes) return []

    // Aggregation Logic
    const statsMap = new Map<string, OperationalStat>()

    processes.forEach((p: { militar_participante: string | null, total_detidos: number | null, tipo_crime: string | null }) => {
        // Safe check for militar_participante (although we filtered in query, it might be null in type definition)
        if (!p.militar_participante) return

        const id = p.militar_participante
        if (!statsMap.has(id)) {
            statsMap.set(id, {
                militar_id: id,
                total_processos: 0,
                total_detidos: 0,
                top_crime: 'N/A',
                crimes_breakdown: {}
            })
        }

        const stat = statsMap.get(id)!
        stat.total_processos += 1
        stat.total_detidos += (p.total_detidos || 0)

        // Crime Type Count
        const crime = p.tipo_crime || 'Indeterminado'
        stat.crimes_breakdown[crime] = (stat.crimes_breakdown[crime] || 0) + 1
    })

    // Calculate Top Crime for each
    const results = Array.from(statsMap.values()).map(stat => {
        let maxCount = 0
        let top = 'N/A'

        Object.entries(stat.crimes_breakdown).forEach(([crime, count]) => {
            if (count > maxCount) {
                maxCount = count
                top = crime
            }
        })

        return {
            ...stat,
            top_crime: top
        }
    })

    // Sort by Total Detentions (Descending) by default
    return results.sort((a, b) => b.total_detidos - a.total_detidos)
}
