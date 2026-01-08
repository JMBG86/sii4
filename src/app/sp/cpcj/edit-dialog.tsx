'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createCPCJRecord, updateCPCJRecord } from "./actions"

type CPCJRecord = {
    id: string
    data_entrada: string
    nuipc: string
    nome_menor: string
    idade?: number | null
    data_nascimento: string | null
    motivo: string
    estado: string
    observacoes: string
}

interface CPCJEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record?: CPCJRecord | null
    onSuccess: () => void
}

export function CPCJEditDialog({ open, onOpenChange, record, onSuccess }: CPCJEditDialogProps) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        try {
            let res
            if (record) {
                res = await updateCPCJRecord(record.id, formData)
            } else {
                res = await createCPCJRecord(formData)
            }

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(record ? "Registo atualizado!" : "Registo criado!")
                onSuccess()
                onOpenChange(false)
            }
        } catch (err) {
            toast.error("Erro ao guardar registo")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{record ? 'Editar Registo CPCJ' : 'Novo Registo CPCJ'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data_entrada">Data Entrada</Label>
                            <Input
                                id="data_entrada"
                                name="data_entrada"
                                type="date"
                                defaultValue={record?.data_entrada || new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select name="estado" defaultValue={record?.estado || "Pendente"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    <SelectItem value="Acompanhamento">Acompanhamento</SelectItem>
                                    <SelectItem value="Arquivado">Arquivado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                            <Label htmlFor="nome_menor">Nome do Menor</Label>
                            <Input id="nome_menor" name="nome_menor" defaultValue={record?.nome_menor} required />
                        </div>
                        <div className="col-span-1 space-y-2">
                            <Label htmlFor="idade">Idade</Label>
                            <Input id="idade" name="idade" type="number" defaultValue={record?.idade || ''} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data_nascimento">Data Nascimento</Label>
                            <Input
                                id="data_nascimento"
                                name="data_nascimento"
                                type="date"
                                defaultValue={record?.data_nascimento || ''}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nuipc">NUIPC (Opcional)</Label>
                            <Input id="nuipc" name="nuipc" defaultValue={record?.nuipc} placeholder="####/##.#abcde" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo / Sinalização</Label>
                        <Input id="motivo" name="motivo" defaultValue={record?.motivo} placeholder="Ex: Absentismo, Negligência..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea id="observacoes" name="observacoes" defaultValue={record?.observacoes || ''} rows={3} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'A guardar...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
