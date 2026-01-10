'use server'

import { createClient } from '@/lib/supabase/server'

export interface MilitaryStats {
    militar_id: string
    total_processos: number
    total_detidos: number
    top_crime: string
    crime_counts: Record<string, number>
}

export async function fetchOperationalStats(year: number = 2026): Promise<MilitaryStats[]> {
    const supabase = await createClient()

    // Fetch all processes for the year with relevant fields
    // We fetch ALL rows to aggregate in memory (efficient enough for N < 10000)
    // SQL aggregation would be better but requires RPC or complex joins not easily typed here without views.
    const { data, error } = await supabase
        .from('sp_processos_crime')
        .select(`
            id,
            militar_participante,
            total_detidos,
            tipo_crime
        `)
        .eq('ano', year)
        .not('militar_participante', 'is', null)

    if (error) throw new Error(error.message)
    if (!data) return []

    // Aggregate
    const statsMap = new Map<string, MilitaryStats>()

    data.forEach(p => {
        const mid = p.militar_participante?.trim()
        if (!mid) return

        if (!statsMap.has(mid)) {
            statsMap.set(mid, {
                militar_id: mid,
                total_processos: 0,
                total_detidos: 0,
                top_crime: '',
                crime_counts: {}
            })
        }

        const stats = statsMap.get(mid)!
        stats.total_processos++
        stats.total_detidos += (p.total_detidos || 0)

        if (p.tipo_crime) {
            stats.crime_counts[p.tipo_crime] = (stats.crime_counts[p.tipo_crime] || 0) + 1
        }
    })

    // Finalize: Determine Top Crime for each
    const result = Array.from(statsMap.values()).map(stats => {
        let maxCrime = '-'
        let maxCount = 0
        Object.entries(stats.crime_counts).forEach(([crime, count]) => {
            if (count > maxCount) {
                maxCount = count
                maxCrime = crime
            }
        })
        return {
            ...stats,
            top_crime: maxCrime
        }
    })

    // Default Sort: Most Detainees DESC
    return result.sort((a, b) => b.total_detidos - a.total_detidos)
}
