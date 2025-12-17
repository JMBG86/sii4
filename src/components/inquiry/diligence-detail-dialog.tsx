'use client'

import { useState } from 'react'
import { Diligence } from '@/types/database'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, X } from 'lucide-react'
import { updateDiligence, deleteDiligence } from '@/app/(sii)/inqueritos/actions'

interface DiligenceDetailDialogProps {
    diligence: Diligence | null
    open: boolean
    onOpenChange: (open: boolean) => void
    inquiryId: string
}

export function DiligenceDetailDialog({ diligence, open, onOpenChange, inquiryId }: DiligenceDetailDialogProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    if (!diligence) return null

    const handleEdit = async (formData: FormData) => {
        setLoading(true)
        try {
            await updateDiligence(diligence.id, formData)
            setIsEditing(false)
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating diligence:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja apagar esta diligência?')) return

        setLoading(true)
        try {
            await deleteDiligence(diligence.id, inquiryId)
            onOpenChange(false)
        } catch (error) {
            console.error('Error deleting diligence:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Detalhes da Diligência</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Edite os campos abaixo' : 'Visualize ou edite a diligência'}
                    </DialogDescription>
                </DialogHeader>

                {!isEditing ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Descrição</Label>
                            <p className="text-sm font-medium">{diligence.descricao}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Entidade</Label>
                                <p className="text-sm">{diligence.entidade || '-'}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Data Enviado</Label>
                                <p className="text-sm">
                                    {diligence.data_enviado ? new Date(diligence.data_enviado).toLocaleDateString('pt-PT') : '-'}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Status</Label>
                            <div>
                                <Badge variant={diligence.status === 'realizado' ? 'default' : diligence.status === 'enviado_aguardar' ? 'secondary' : 'outline'}>
                                    {diligence.status === 'realizado' ? 'Realizado' : diligence.status === 'enviado_aguardar' ? 'Enviado e a Aguardar' : 'A Realizar'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form action={handleEdit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Descrição *</Label>
                            <Input name="descricao" defaultValue={diligence.descricao} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Entidade</Label>
                                <Input name="entidade" defaultValue={diligence.entidade || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Enviado</Label>
                                <Input
                                    type="date"
                                    name="data_enviado"
                                    defaultValue={diligence.data_enviado || ''}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status *</Label>
                            <select
                                name="status"
                                defaultValue={diligence.status}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="a_realizar">A Realizar</option>
                                <option value="enviado_aguardar">Enviado e a Aguardar</option>
                                <option value="realizado">Realizado</option>
                            </select>
                        </div>
                    </form>
                )}

                <DialogFooter className="gap-2">
                    {!isEditing ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Fechar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Apagar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setIsEditing(true)}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault()
                                    const form = e.currentTarget.closest('form')
                                    if (form) {
                                        const formData = new FormData(form)
                                        handleEdit(formData)
                                    }
                                }}
                                disabled={loading}
                            >
                                Guardar
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
