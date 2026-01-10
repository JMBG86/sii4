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
        .select('id, nuipc_completo, tipo_crime, latitude, longitude, data_factos, entidade_destino')
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

    // 3. Side-load User Info & Linked Inquiry ID for SP Processes
    // SP processes usually don't have direct user_id, but if they are synced to SII,
    // we can find the assigned user AND the inquiry ID in 'inqueritos' table via NUIPC.
    const spNuipcs = spData.map(d => d.nuipc_completo).filter(Boolean)
    const nuipcToInfoMap = new Map<string, { user: string, id: string }>()

    if (spNuipcs.length > 0) {
        const { data: linkedInquiries } = await supabase
            .from('inqueritos')
            .select('id, nuipc, profiles:user_id(full_name)')
            .in('nuipc', spNuipcs)

        if (linkedInquiries) {
            linkedInquiries.forEach(inq => {
                if (inq.nuipc) {
                    // @ts-ignore
                    const userName = inq.profiles?.full_name || 'Sem nome'
                    nuipcToInfoMap.set(inq.nuipc, { user: userName, id: inq.id })
                }
            })
        }
    }

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

    const mappedSP = spData.map(d => {
        // Check if we have linked info from SII
        const linkedInfo = nuipcToInfoMap.get(d.nuipc_completo)

        // Determine display user: Linked User > Destination Entity > 'SP'
        let displayUser = 'SP'
        if (linkedInfo?.user) {
            displayUser = linkedInfo.user
        } else if (d.entidade_destino) {
            displayUser = d.entidade_destino
        }

        return {
            id: d.id,
            nuipc: d.nuipc_completo, // Use nuipc_completo for SP
            tipo_crime: d.tipo_crime || 'Indeterminado',
            latitude: d.latitude,
            longitude: d.longitude,
            data_ocorrencia: d.data_factos, // Map data_factos to data_ocorrencia
            profiles: { full_name: displayUser },
            source: 'SP',
            linkedInquiryId: linkedInfo?.id // Pass the real ID if available
        }
    })

    // Deduplication Strategy:
    // If an SP process is linked to an Inquiry (same NUIPC), both might be fetched if both have coordinates.
    // We prefer showing the SP process because it likely has the operational location/context.
    // Therefore, we filter out any Inquiry that is already "represented" by a linked SP process.

    // Collect IDs of inquiries that are linked to the fetched SP processes
    const linkedInquiryIds = new Set<string>()
    mappedSP.forEach(p => {
        if (p.linkedInquiryId) {
            linkedInquiryIds.add(p.linkedInquiryId)
        }
    })

    // Filter mappedInq to exclude those that are already in the linked set
    const filteredInq = mappedInq.filter(inq => !linkedInquiryIds.has(inq.id))

    // Merge and Sort by Date Descending
    const merged = [...filteredInq, ...mappedSP].sort((a, b) => {
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
