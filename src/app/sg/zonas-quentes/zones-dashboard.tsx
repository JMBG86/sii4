'use client'

import { useState, useMemo, useEffect } from 'react'
import ZonesMapWrapper from '@/components/maps/zones-map-wrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, AlertTriangle, Eye, RotateCcw } from 'lucide-react'
import { ZonesFilters } from './zones-filters'

interface CrimePoint {
    id: string
    nuipc: string
    tipo_crime: string
    latitude: number
    longitude: number
    data_ocorrencia?: string
    profiles?: { full_name: string } | { full_name: string }[]
    source?: string
}

interface ZonesDashboardProps {
    initialPoints: CrimePoint[]
    availableCrimeTypes: string[]
}

interface Pattern {
    id: string
    type: 'cluster'
    description: string
    points: CrimePoint[]
}

// Haversine Distance Helper (Meters)
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
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

export function ZonesDashboard({ initialPoints, availableCrimeTypes }: ZonesDashboardProps) {
    const [focusedPoints, setFocusedPoints] = useState<CrimePoint[] | null>(null)
    const [patterns, setPatterns] = useState<Pattern[]>([])

    // Pattern Detection Logic
    useEffect(() => {
        const detectedPatterns: Pattern[] = []

        // Group by Crime Type
        const byType: Record<string, CrimePoint[]> = {}
        initialPoints.forEach(p => {
            const t = p.tipo_crime || 'Indeterminado'
            if (!byType[t]) byType[t] = []
            byType[t].push(p)
        })

        // Analyze each group
        Object.entries(byType).forEach(([type, points]) => {
            if (points.length < 3) return

            const processed = new Set<string>()

            for (let i = 0; i < points.length; i++) {
                if (processed.has(points[i].id)) continue

                const cluster = [points[i]]

                for (let j = 0; j < points.length; j++) {
                    if (i === j) continue
                    if (processed.has(points[j].id)) continue // debatable: can a point belong to multiple clusters? simplifying to no for strict "pattern"

                    const dist = getDistanceFromLatLonInMeters(
                        points[i].latitude, points[i].longitude,
                        points[j].latitude, points[j].longitude
                    )

                    if (dist <= 500) {
                        cluster.push(points[j])
                    }
                }

                if (cluster.length >= 3) {
                    // Mark as processed
                    cluster.forEach(p => processed.add(p.id))

                    detectedPatterns.push({
                        id: `pattern-${type}-${i}`,
                        type: 'cluster',
                        description: `Detetado aglomerado de ${cluster.length} crimes de ${type} num raio de 500m.`,
                        points: cluster
                    })
                }
            }
        })

        setPatterns(detectedPatterns)
        // Reset focus when data changes (filter apply)
        setFocusedPoints(null)

    }, [initialPoints])

    const pointsToDisplay = focusedPoints || initialPoints

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-red-600 flex items-center gap-2">
                    <MapPin className="h-6 w-6" />
                    Zonas Quentes ({initialPoints.length})
                </h1>
                <p className="text-muted-foreground">Mapa de incidência criminal georreferenciada.</p>
            </div>

            <ZonesFilters availableCrimeTypes={availableCrimeTypes} />

            {/* MAP */}
            <Card className="overflow-hidden border-2 shadow-md">
                <CardContent className="p-0 relative">
                    {focusedPoints && (
                        <div className="absolute top-4 right-4 z-[1000]">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setFocusedPoints(null)}
                                className="shadow-lg"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Limpar Foco
                            </Button>
                        </div>
                    )}
                    <ZonesMapWrapper points={pointsToDisplay} />
                </CardContent>
            </Card>

            {/* PATTERNS SECTION */}
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        Padrões Detetados
                    </CardTitle>
                    <CardDescription>
                        Padrões de Análise: Se houverem 3 crimes do mesmo tipo, dentro de um raio de 500 metros, aparece um alerta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {patterns.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descrição do Padrão</TableHead>
                                    <TableHead className="w-[150px]">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patterns.map((pat) => (
                                    <TableRow key={pat.id}>
                                        <TableCell className="font-medium text-yellow-800 dark:text-yellow-200">
                                            {pat.description}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFocusedPoints(pat.points)}
                                                className="border-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                Ver no Mapa
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Nenhum padrão detetado com os filtros atuais.</p>
                    )}
                </CardContent>
            </Card>

            {/* LIMITED DATA TABLE (Updated: Only last 10) */}
            <Card>
                <CardHeader>
                    <CardTitle>Últimos 10 Registos</CardTitle>
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
                                {pointsToDisplay.length > 0 ? (
                                    // Slice to take only first 10
                                    pointsToDisplay.slice(0, 10).map((inq) => (
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
                                            Sem dados para mostrar.
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
