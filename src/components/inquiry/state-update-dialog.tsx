'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { updateInquiryState } from '@/app/(sii)/inqueritos/actions'
import { Loader2 } from 'lucide-react'

export function StateUpdateDialog({
    inquiryId,
    currentState,
    onUpdate,
}: {
    inquiryId: string
    currentState: string
    onUpdate?: () => void
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newState, setNewState] = useState(currentState)
    const [comment, setComment] = useState('')
    const [numeroOficio, setNumeroOficio] = useState('')
    const [destino, setDestino] = useState('')

    // Auto-fill DIAP Albufeira when completing
    useEffect(() => {
        if (newState === 'concluido' && !destino) {
            setDestino('DIAP Albufeira')
        }
    }, [newState, destino])

    const handleUpdate = async () => {
        if (newState === currentState) {
            setOpen(false)
            return
        }

        // Validate office number and destination if concluding
        if (newState === 'concluido') {
            if (!numeroOficio.trim()) {
                alert('Por favor, insira o Número do Ofício')
                return
            }
            if (!destino.trim()) {
                alert('Por favor, insira o Destino')
                return
            }
        }

        setLoading(true)
        try {
            await updateInquiryState(inquiryId, newState, comment, numeroOficio, destino)
            setOpen(false)
            if (onUpdate) onUpdate()
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    Mudar Estado
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Atualizar Estado do Inquérito</DialogTitle>
                    <DialogDescription>
                        Selecione o novo estado. Esta ação será registada no histórico.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="state">Novo Estado</Label>
                        <Select value={newState} onValueChange={setNewState}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="por_iniciar">Por Iniciar</SelectItem>
                                <SelectItem value="em_diligencias">Em Diligências</SelectItem>
                                <SelectItem value="aguardando_resposta">Aguardando Resposta</SelectItem>
                                <SelectItem value="tribunal">Tribunal</SelectItem>
                                <SelectItem value="concluido">Concluído</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {newState === 'concluido' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="numeroOficio">Número do Ofício *</Label>
                                <Input
                                    id="numeroOficio"
                                    value={numeroOficio}
                                    onChange={(e) => setNumeroOficio(e.target.value)}
                                    placeholder="Ex: 123/2024"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destino">Destino *</Label>
                                <Input
                                    id="destino"
                                    value={destino}
                                    onChange={(e) => setDestino(e.target.value)}
                                    placeholder="Ex: DIAP Albufeira, PJ Faro..."
                                    required
                                    list="destinations"
                                />
                                <datalist id="destinations">
                                    <option value="DIAP Albufeira" />
                                    <option value="PJ Faro" />
                                    <option value="Tribunal Judicial" />
                                    <option value="SII" />
                                    <option value="Arquivo" />
                                </datalist>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Selecione ou escreva um novo destino.
                                </p>
                            </div>
                        </>
                    )}
                    {newState !== 'concluido' && (
                        <div className="space-y-2">
                            <Label htmlFor="comment">Observações (opcional)</Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Razão da mudança..."
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
