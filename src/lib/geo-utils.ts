export interface CrimePoint {
    id: string
    nuipc: string
    tipo_crime: string
    latitude: number
    longitude: number
    data_ocorrencia?: string
    profiles?: { full_name: string } | { full_name: string }[]
    source?: string
}

export interface Pattern {
    id: string
    type: 'cluster'
    description: string
    points: CrimePoint[]
}

// Haversine Distance Helper (Meters)
export function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3 // Radius of earth in meters
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c
    return d
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

export function detectPatterns(points: CrimePoint[], radius: number = 500): Pattern[] {
    const detectedPatterns: Pattern[] = []

    // Group by Crime Type
    const byType: Record<string, CrimePoint[]> = {}
    points.forEach(p => {
        const t = p.tipo_crime || 'Indeterminado'
        if (!byType[t]) byType[t] = []
        byType[t].push(p)
    })

    // Analyze each group
    Object.entries(byType).forEach(([type, typePoints]) => {
        if (typePoints.length < 3) return

        const processed = new Set<string>()

        for (let i = 0; i < typePoints.length; i++) {
            if (processed.has(typePoints[i].id)) continue

            const cluster = [typePoints[i]]

            for (let j = 0; j < typePoints.length; j++) {
                if (i === j) continue
                // Allow multiple cluster checks (visual patterns) but usually strict
                if (processed.has(typePoints[j].id)) continue

                const dist = getDistanceFromLatLonInMeters(
                    typePoints[i].latitude, typePoints[i].longitude,
                    typePoints[j].latitude, typePoints[j].longitude
                )

                if (dist <= radius) {
                    cluster.push(typePoints[j])
                }
            }

            if (cluster.length >= 3) {
                // Mark as processed
                cluster.forEach(p => processed.add(p.id))

                detectedPatterns.push({
                    id: `pattern-${type}-${i}`,
                    type: 'cluster',
                    description: `Detetado aglomerado de ${cluster.length} crimes de ${type} num raio de ${radius}m.`,
                    points: cluster
                })
            }
        }
    })

    return detectedPatterns
}
