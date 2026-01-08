'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { updateImagensFlags } from './actions'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImagensEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    processo: {
        id: string
        nuipc_completo: string
        imagens_associadas: boolean
        notificacao_imagens: boolean
    }
    onSaved: () => void
}

export function ImagensEditDialog({ open, onOpenChange, processo, onSaved }: ImagensEditDialogProps) {
    const [imagens, setImagens] = useState(processo.imagens_associadas)
    const [notificacao, setNotificacao] = useState(processo.notificacao_imagens)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateImagensFlags(processo.id, imagens, notificacao)
            toast.success('Estado atualizado com sucesso')
            onSaved()
            onOpenChange(false)
        } catch (error) {
            toast.error('Erro ao atualizar estado')
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Gerir Imagens: {processo.nuipc_completo}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <Switch id="imagens-edit" checked={imagens} onCheckedChange={setImagens} />
                            <Label htmlFor="imagens-edit" className="font-semibold text-amber-600 text-base">Tem Imagens?</Label>
                        </div>

                        {imagens && (
                            <div className="space-y-3 mt-3 animate-in fade-in pl-4 border-l-2 border-amber-200">
                                <div className="flex items-center space-x-2">
                                    <Switch id="notificacao-edit" checked={notificacao} onCheckedChange={setNotificacao} />
                                    <Label htmlFor="notificacao-edit" className="font-medium">Foi feita a Notificação?</Label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Sim + Sim = <span className="text-emerald-600 font-bold">Verde</span> | Sim + Não = <span className="text-red-600 font-bold">Vermelho</span> no separador Imagens.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gravar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
