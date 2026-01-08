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

    let query = supabase
        .from('inqueritos')
        .select('id, nuipc, tipo_crime, latitude, longitude, data_ocorrencia, profiles:user_id(full_name)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('data_ocorrencia', { ascending: false })

    if (startDate) {
        query = query.gte('data_ocorrencia', startDate)
    }

    if (endDate) {
        query = query.lte('data_ocorrencia', endDate)
    }

    if (crimeTypes && crimeTypes.length > 0) {
        query = query.in('tipo_crime', crimeTypes)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching geolocated inquiries:', error)
        throw new Error('Falha ao obter dados de geolocalização')
    }

    return data || []
}

export async function fetchDistinctCrimeTypes() {
    const supabase = await createClient()

    // We only want types that have geolocation
    const { data, error } = await supabase
        .from('inqueritos')
        .select('tipo_crime')
        .not('latitude', 'is', null)
        .order('tipo_crime', { ascending: true })

    if (error) {
        console.error('Error fetching crime types:', error)
        return []
    }

    // Uniq
    const types = Array.from(new Set(data.map(d => d.tipo_crime))).filter(Boolean)
    return types
}
