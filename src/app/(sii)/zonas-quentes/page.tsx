import { fetchGeolocatedInquiries, fetchDistinctCrimeTypes } from '@/app/sg/zonas-quentes/actions'
import { ZonesDashboard } from '@/app/sg/zonas-quentes/zones-dashboard'

export const dynamic = 'force-dynamic'

export default async function SIIZonesPage(props: { searchParams: Promise<{ startDate?: string, endDate?: string, crimeTypes?: string }> }) {
    const searchParams = await props.searchParams
    const safeSearchParams = searchParams || {}

    const crimeTypesArg = safeSearchParams.crimeTypes ? safeSearchParams.crimeTypes.split(',') : undefined

    // Parallel data fetching
    const [points, availableCrimeTypes] = await Promise.all([
        fetchGeolocatedInquiries(safeSearchParams.startDate, safeSearchParams.endDate, crimeTypesArg),
        fetchDistinctCrimeTypes()
    ])

    return (
        <ZonesDashboard
            initialPoints={points}
            availableCrimeTypes={availableCrimeTypes}
        />
    )
}
