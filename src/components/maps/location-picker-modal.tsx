'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import CrimeLocationMap from '@/components/maps/map-wrapper'
import { Loader2, Save } from 'lucide-react'

interface LocationPickerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (lat: number, lng: number, address?: string) => void
    initialLat?: number
    initialLng?: number
}

export function LocationPickerModal({ open, onOpenChange, onSave, initialLat, initialLng }: LocationPickerModalProps) {
    const [selectedLoc, setSelectedLoc] = useState<{ lat: number, lng: number } | null>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    )
    const [loading, setLoading] = useState(false)

    // Helper to reverse geocode if needed, but for now we trust the map's pinpoint?
    // The visual map allows dragging.
    // We can just save the coordinates.

    const handleSave = () => {
        if (selectedLoc) {
            setLoading(true)
            // Ideally we could fetch address string here if needed, but the map usually handles visually.
            // For now, pass back coordinates.
            onSave(selectedLoc.lat, selectedLoc.lng)
            setLoading(false)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[95vh] !max-h-[95vh] flex flex-col p-0 gap-0">
                <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-zinc-950 z-10 rounded-t-lg">
                    <DialogTitle>Selecionar Localização</DialogTitle>
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
                </div>

                <div className="flex-1 relative bg-slate-100 dark:bg-zinc-900 w-full overflow-hidden">
                    <div className="absolute inset-0">
                        <CrimeLocationMap
                            initialLat={initialLat}
                            initialLng={initialLng}
                            onLocationChange={(lat, lng) => setSelectedLoc({ lat, lng })}
                        />
                    </div>
                </div>

                <div className="p-4 border-t bg-white dark:bg-zinc-950 z-10 rounded-b-lg">
                    <Button
                        size="lg"
                        className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleSave}
                        disabled={!selectedLoc || loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        GUARDAR LOCALIZAÇÃO
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
