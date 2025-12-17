'use client'

import { useState, useEffect } from 'react'
import { Correspondence } from '@/types/database'
import { updateCorrespondence, checkNuipcOwner } from './actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export function EditCorrespondenceDialog({
    correspondence,
    open,
    onOpenChange,
    onSuccess
}: {
    correspondence: Correspondence
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}) {
    const [loading, setLoading] = useState(false)

    // NUIPC Search State
    const [nuipc, setNuipc] = useState(correspondence.nuipc || '')
    const [destino, setDestino] = useState(correspondence.destino)
    const [searchingNuipc, setSearchingNuipc] = useState(false)
    const [nuipcMessage, setNuipcMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null)

    // Reset state when dialog opens with new correspondence
    useEffect(() => {
        setNuipc(correspondence.nuipc || '')
        setDestino(correspondence.destino)
        setNuipcMessage(null)
    }, [correspondence, open])

    useEffect(() => {
        const timer = setTimeout(async () => {
            // Avoid searching if it matches the initial value (prevents overwriting on open)
            // or if user hasn't typed enough
            if (nuipc === (correspondence.nuipc || '') && !nuipcMessage) return

            if (nuipc.length > 5) {
                setSearchingNuipc(true)
                try {
                    const ownerName = await checkNuipcOwner(nuipc)
                    if (ownerName) {
                        setDestino(ownerName)
                        setNuipcMessage({ text: `Inquérito encontrado. Responsável: ${ownerName}`, type: 'success' })
                    } else {
                        setNuipcMessage({ text: 'Inquérito não encontrado ou sem responsável atribuído.', type: 'info' })
                    }
                } catch (error) {
                    console.error(error)
                } finally {
                    setSearchingNuipc(false)
                }
            } else {
                setNuipcMessage(null)
            }
        }, 800)

        return () => clearTimeout(timer)
    }, [nuipc, correspondence.nuipc, nuipcMessage])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = await updateCorrespondence(correspondence.id, formData)
        setLoading(false)

        if (result?.error) {
            alert(result.error)
        } else {
            onSuccess?.()
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Correspondência</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="srv">SRV</Label>
                                <Input id="srv" name="srv" defaultValue={correspondence.srv} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numero_oficio">Nº Ofício</Label>
                                <Input id="numero_oficio" name="numero_oficio" defaultValue={correspondence.numero_oficio} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nuipc">NUIPC</Label>
                            <div className="relative">
                                <Input
                                    id="nuipc"
                                    name="nuipc"
                                    value={nuipc}
                                    onChange={(e) => setNuipc(e.target.value)}
                                    placeholder="Opcional"
                                />
                                {searchingNuipc && (
                                    <div className="absolute right-3 top-2.5">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            {nuipcMessage && (
                                <p className={`text-xs ${nuipcMessage.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {nuipcMessage.text}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="origem">Origem</Label>
                                <Input id="origem" name="origem" defaultValue={correspondence.origem} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destino">Destino</Label>
                                <Input
                                    id="destino"
                                    name="destino"
                                    value={destino}
                                    onChange={(e) => setDestino(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assunto">Assunto</Label>
                            <Textarea id="assunto" name="assunto" defaultValue={correspondence.assunto} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="data_entrada">Data Entrada</Label>
                            <Input type="date" name="data_entrada" defaultValue={correspondence.data_entrada.split('T')[0]} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Alterações
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
