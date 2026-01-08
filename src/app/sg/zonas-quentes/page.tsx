import { fetchGeolocatedInquiries, fetchDistinctCrimeTypes } from './actions'
import ZonesMapWrapper from '@/components/maps/zones-map-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin } from 'lucide-react'
import { ZonesFilters } from './zones-filters'

export default async function ZonesPage(props: { searchParams: Promise<{ startDate?: string, endDate?: string, crimeTypes?: string }> }) {
    const searchParams = await props.searchParams

    // Safety check for searchParams being undefined in some edge cases (though unlikely in recent Next.js)
    const safeSearchParams = searchParams || {}

    const crimeTypesArg = safeSearchParams.crimeTypes ? safeSearchParams.crimeTypes.split(',') : undefined

    // Parallel data fetching
    const [points, availableCrimeTypes] = await Promise.all([
        fetchGeolocatedInquiries(safeSearchParams.startDate, safeSearchParams.endDate, crimeTypesArg),
        fetchDistinctCrimeTypes()
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-red-600 flex items-center gap-2">
                    <MapPin className="h-6 w-6" />
                    Zonas Quentes ({points.length})
                </h1>
                <p className="text-muted-foreground">Mapa de incidência criminal georreferenciada.</p>
            </div>

            <ZonesFilters availableCrimeTypes={availableCrimeTypes} />

            {/* MAP SECTION */}
            <Card className="overflow-hidden border-2 mb-8">
                <CardContent className="p-0">
                    <ZonesMapWrapper points={points} />
                </CardContent>
            </Card>

            {/* DATA TABLE SECTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Registos da Seleção</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NUIPC</TableHead>
                                    <TableHead>Crime</TableHead>
                                    <TableHead>Data Ocorrência</TableHead>
                                    <TableHead>Coordenadas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {points.length > 0 ? (
                                    points.map((inq) => (
                                        <TableRow key={inq.id}>
                                            <TableCell className="font-medium">{inq.nuipc}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{inq.tipo_crime}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {inq.data_ocorrencia
                                                    ? new Date(inq.data_ocorrencia).toLocaleDateString()
                                                    : '-'
                                                }
                                            </TableCell>
                                            <TableCell className="text-sm font-mono text-muted-foreground">
                                                {inq.latitude.toFixed(6)}, {inq.longitude.toFixed(6)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Sem dados para os filtros selecionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
