'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Loader2, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Fix Leaflet Icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Default Center (Albufeira)
const DEFAULT_CENTER: [number, number] = [37.0891, -8.2415]

interface CrimeLocationMapProps {
    initialLat?: number
    initialLng?: number
    onLocationChange: (lat: number, lng: number) => void
    readonly?: boolean
}

function LocationMarker({ position, setPosition, onLocationChange, readonly }: any) {
    const map = useMap()

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom())
        }
    }, [position, map])

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = this as any
                if (marker != null) {
                    const newPos = marker.getLatLng()
                    setPosition([newPos.lat, newPos.lng])
                    onLocationChange(newPos.lat, newPos.lng)
                }
            },
        }),
        [onLocationChange, setPosition],
    )

    if (!position) return null

    return (
        <Marker
            draggable={!readonly}
            eventHandlers={!readonly ? eventHandlers : undefined}
            position={position}
        >
            <Popup>Local do Crime</Popup>
        </Marker>
    )
}

function SearchControl({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    const [query, setQuery] = useState('')
    const [searching, setSearching] = useState(false)

    async function handleSearch() {
        if (!query) return
        setSearching(true)
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            const data = await res.json()
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat)
                const lon = parseFloat(data[0].lon)
                onSelect(lat, lon)
            } else {
                alert('Morada não encontrada.')
            }
        } catch (error) {
            console.error('Search error:', error)
            alert('Erro na pesquisa.')
        } finally {
            setSearching(false)
        }
    }

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-slate-900 p-2 rounded shadow-md flex gap-2 w-80">
            <Input
                placeholder="Pesquisar morada..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="h-9"
            />
            <Button size="sm" onClick={handleSearch} disabled={searching} className="h-9 w-9 p-0">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
        </div>
    )
}

export default function CrimeLocationMap({ initialLat, initialLng, onLocationChange, readonly = false }: CrimeLocationMapProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    )

    // Sync initial props
    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition([initialLat, initialLng])
        }
    }, [initialLat, initialLng])

    const handleSelectLocation = useCallback((lat: number, lng: number) => {
        setPosition([lat, lng])
        onLocationChange(lat, lng)
    }, [onLocationChange])

    return (
        <div className="relative w-full h-[400px] border rounded-md overflow-hidden">
            {/* Custom Styles for Leaflet Controls */}
            <style jsx global>{`
                .leaflet-control-zoom-in,
                .leaflet-control-zoom-out {
                    width: 40px !important;
                    height: 40px !important;
                    line-height: 40px !important;
                    font-size: 22px !important;
                }
            `}</style>

            {!readonly && <SearchControl onSelect={handleSelectLocation} />}

            <MapContainer
                center={position || DEFAULT_CENTER}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={position}
                    setPosition={setPosition}
                    onLocationChange={onLocationChange}
                    readonly={readonly}
                />
            </MapContainer>

            {!position && !readonly && (
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 p-2 rounded text-xs text-muted-foreground shadow">
                    Pesquise uma morada ou arraste o marcador.
                </div>
            )}
        </div>
    )
}
