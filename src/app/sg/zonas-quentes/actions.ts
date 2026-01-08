'use server'

import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

export async function fetchGeolocatedInquiries(
    startDate?: string,
    endDate?: string,
    crimeTypes?: string[]
) {
    noStore()
    const supabase = await createClient()

    // 1. Fetch Inqueritos (SII)
    let queryInq = supabase
        .from('inqueritos')
        .select('id, nuipc, tipo_crime, latitude, longitude, data_ocorrencia, profiles:user_id(full_name)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

    if (startDate) queryInq = queryInq.gte('data_ocorrencia', startDate)
    if (endDate) queryInq = queryInq.lte('data_ocorrencia', endDate)
    if (crimeTypes && crimeTypes.length > 0) queryInq = queryInq.in('tipo_crime', crimeTypes)

    // 2. Fetch Processos SP
    let querySP = supabase
        .from('sp_processos_crime')
        .select('id, nuipc_completo, tipo_crime, latitude, longitude, data_factos')
        .not('nuipc_completo', 'is', null) // Ensure valid
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

    if (startDate) querySP = querySP.gte('data_factos', startDate)
    if (endDate) querySP = querySP.lte('data_factos', endDate)
    if (crimeTypes && crimeTypes.length > 0) querySP = querySP.in('tipo_crime', crimeTypes)

    // Execute Parallel
    const [resInq, resSP] = await Promise.all([queryInq, querySP])

    if (resInq.error) console.error('Error fetching inqueritos locations:', resInq.error)
    if (resSP.error) console.error('Error fetching SP locations:', resSP.error)

    const inqData = resInq.data || []
    const spData = resSP.data || []

    // Normalize Data
    // We want a unified structure: { id, nuipc, tipo_crime, latitude, longitude, data_ocorrencia, source: 'SII' | 'SP' }

    const mappedInq = inqData.map(d => ({
        id: d.id,
        nuipc: d.nuipc,
        tipo_crime: d.tipo_crime || 'Indeterminado',
        latitude: d.latitude,
        longitude: d.longitude,
        data_ocorrencia: d.data_ocorrencia,
        profiles: d.profiles,
        source: 'SII'
    }))

    const mappedSP = spData.map(d => ({
        id: d.id,
        nuipc: d.nuipc_completo, // Use nuipc_completo for SP
        tipo_crime: d.tipo_crime || 'Indeterminado',
        latitude: d.latitude,
        longitude: d.longitude,
        data_ocorrencia: d.data_factos, // Map data_factos to data_ocorrencia
        profiles: { full_name: 'SP' }, // Placeholder for profile
        source: 'SP'
    }))

    // Merge and Sort by Date Descending
    const merged = [...mappedInq, ...mappedSP].sort((a, b) => {
        const dateA = a.data_ocorrencia ? new Date(a.data_ocorrencia).getTime() : 0
        const dateB = b.data_ocorrencia ? new Date(b.data_ocorrencia).getTime() : 0
        return dateB - dateA
    })

    return merged
}

export async function fetchDistinctCrimeTypes() {
    const supabase = await createClient()

    const [resInq, resSP] = await Promise.all([
        supabase
            .from('inqueritos')
            .select('tipo_crime')
            .not('latitude', 'is', null),
        supabase
            .from('sp_processos_crime')
            .select('tipo_crime')
            .not('latitude', 'is', null)
    ])

    const types = new Set<string>()

    if (resInq.data) resInq.data.forEach(d => { if (d.tipo_crime) types.add(d.tipo_crime) })
    if (resSP.data) resSP.data.forEach(d => { if (d.tipo_crime) types.add(d.tipo_crime) })

    return Array.from(types).sort()
}
