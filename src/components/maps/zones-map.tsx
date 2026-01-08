'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import InquiryDetailView from '@/components/inquiry/inquiry-detail-view'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapPin } from 'lucide-react'

// Default Center (Albufeira)
const DEFAULT_CENTER: [number, number] = [37.0891, -8.2415]

interface CrimePoint {
    id: string
    nuipc: string
    tipo_crime: string
    latitude: number
    longitude: number
    data_ocorrencia?: string
    profiles?: {
        full_name: string
    } | { full_name: string }[]
}

interface ZonesMapProps {
    points: CrimePoint[]
}

const getCrimeColor = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('furto')) return '#f97316' // Orange
    if (t.includes('roubo')) return '#ef4444' // Red
    if (t.includes('tráfico') || t.includes('trafico')) return '#a855f7' // Purple
    if (t.includes('burla')) return '#eab308' // Yellow
    if (t.includes('violência') || t.includes('violencia')) return '#ec4899' // Pink
    if (t.includes('dano')) return '#64748b' // Slate
    if (t.includes('ofensa')) return '#f43f5e' // Rose
    return '#3b82f6' // Blue (Default)
}

const createCustomIcon = (type: string) => {
    const color = getCrimeColor(type)
    const iconHtml = renderToStaticMarkup(
        <div style={{
            color: color,
            filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <MapPin size={40} fill={color} stroke="#ffffff" strokeWidth={1.5} />
        </div>
    )

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon', // Use a class for potential extra styling
        iconSize: [40, 40],
        iconAnchor: [20, 40], // Tip of the pin
        popupAnchor: [0, -40],
        tooltipAnchor: [0, -30]
    })
}

export default function ZonesMap({ points }: ZonesMapProps) {
    const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)

    // Always center on Albufeira
    const center = DEFAULT_CENTER

    return (
        <div>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '600px', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {points.map((point) => {
                    const profile = Array.isArray(point.profiles) ? point.profiles[0] : point.profiles

                    const SummaryContent = () => (
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <span className="font-bold text-sm">{point.nuipc}</span>
                            <Badge
                                variant="outline"
                                className="w-fit text-xs px-2 py-0.5 border-0 text-white"
                                style={{ backgroundColor: getCrimeColor(point.tipo_crime) }}
                            >
                                {point.tipo_crime}
                            </Badge>

                            <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">Data:</span>
                                    <span>{point.data_ocorrencia ? new Date(point.data_ocorrencia).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">Militar:</span>
                                    <span>{profile?.full_name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )

                    return (
                        <Marker
                            key={point.id}
                            position={[point.latitude, point.longitude]}
                            icon={createCustomIcon(point.tipo_crime)}
                        >
                            <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                                <div className="text-center font-bold text-xs p-1">
                                    {point.tipo_crime}
                                </div>
                            </Tooltip>

                            <Popup>
                                <div className="space-y-3 pb-1">
                                    <SummaryContent />
                                    <div className="pt-3 border-t flex justify-center">
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs w-full"
                                            onClick={() => setSelectedInquiryId(point.id)}
                                        >
                                            Ver Processo Completo
                                        </Button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>

            <Dialog open={!!selectedInquiryId} onOpenChange={(open) => !open && setSelectedInquiryId(null)}>
                <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[95vh] !max-h-[95vh] overflow-y-auto p-4 md:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Ficha do Inquérito</DialogTitle>
                    </DialogHeader>
                    {selectedInquiryId && (
                        <div className="mt-4">
                            <InquiryDetailView
                                inquiryId={selectedInquiryId}
                                onClose={() => setSelectedInquiryId(null)}
                                hideBack={true}
                                readOnly={true}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
