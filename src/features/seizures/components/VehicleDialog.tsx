'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2, Trash } from 'lucide-react'
import { createVehicle, updateVehicle, deleteVehicle } from '../actions'
import { toast } from 'sonner'

interface VehicleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vehicle?: any // If null, creating. If present, editing.
    onSuccess: () => void
}

export function VehicleDialog({ open, onOpenChange, vehicle, onSuccess }: VehicleDialogProps) {
    const [loading, setLoading] = useState(false)

    // Form Stats
    const [matricula, setMatricula] = useState(vehicle?.matricula || '')
    const [marcaModelo, setMarcaModelo] = useState(vehicle?.marca_modelo || '')
    const [nuipc, setNuipc] = useState(vehicle?.nuipc || '')
    const [dataNuipc, setDataNuipc] = useState(vehicle?.data_nuipc || '')
    const [chave, setChave] = useState(vehicle?.chave_existente || false)
    const [entregue, setEntregue] = useState(vehicle?.entregue || false)
    const [deposito, setDeposito] = useState(vehicle?.deposito_sdter || false)
    const [observacoes, setObservacoes] = useState(vehicle?.observacoes || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                matricula,
                marca_modelo: marcaModelo,
                nuipc,
                data_nuipc: dataNuipc || null,
                chave_existente: chave,
                entregue,
                deposito_sdter: deposito,
                observacoes
            }

            if (vehicle) {
                await updateVehicle(vehicle.id, payload)
                toast.success('Viatura atualizada com sucesso!')
            } else {
                await createVehicle(payload)
                toast.success('Viatura criada com sucesso!')
            }
            onSuccess()
            onOpenChange(false)
        } catch (err) {
            toast.error('Erro ao guardar viatura')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!vehicle || !confirm('Tem a certeza que deseja eliminar esta viatura? Esta ação é irreversível.')) return
        setLoading(true)
        try {
            await deleteVehicle(vehicle.id)
            toast.success('Viatura eliminada com sucesso')
            onSuccess()
            onOpenChange(false)
        } catch (err) {
            toast.error('Erro ao eliminar viatura')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{vehicle ? 'Editar Viatura' : 'Adicionar Viatura'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Matrícula</Label>
                            <Input value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="AA-00-AA" />
                        </div>
                        <div className="space-y-2">
                            <Label>Marca / Modelo</Label>
                            <Input value={marcaModelo} onChange={e => setMarcaModelo(e.target.value)} placeholder="Ex: Renault Clio" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>NUIPC</Label>
                            <Input value={nuipc} onChange={e => setNuipc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Data NUIPC</Label>
                            <Input type="date" value={dataNuipc} onChange={e => setDataNuipc(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            value={observacoes}
                            onChange={e => setObservacoes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                            <Label>Chave Existente?</Label>
                            <Switch checked={chave} onCheckedChange={setChave} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Entregue?</Label>
                            <Switch checked={entregue} onCheckedChange={setEntregue} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Depósito no SDTER?</Label>
                            <Switch checked={deposito} onCheckedChange={setDeposito} />
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between w-full">
                        {vehicle ? (
                            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                            </Button>
                        ) : (
                            <div></div> // Spacer to keep buttons to the right if adding
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
