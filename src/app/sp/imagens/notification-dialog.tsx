'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fillDocxTemplate, downloadDocx } from '@/lib/docx-service'
import { Loader2, FileDown } from 'lucide-react'
import { toast } from 'sonner'

interface ImagensNotificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    processo?: {
        id: string
        nuipc_completo: string
        localizacao?: string
    }
}

export function ImagensNotificationDialog({ open, onOpenChange, processo }: ImagensNotificationDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nuipc: processo?.nuipc_completo || '',
        denominacao: '',
        morada: processo?.localizacao || '',
        data_inicio: '',
        hora_inicio: '',
        data_fim: '',
        hora_fim: '',
        local_factos: processo?.localizacao || ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const templateData = {
                nuipc: formData.nuipc,
                denominacao: formData.denominacao,
                morada: formData.morada,
                data_inicio: formData.data_inicio,
                hora_inicio: formData.hora_inicio,
                data_fim: formData.data_fim,
                hora_fim: formData.hora_fim,
                local_factos: formData.local_factos
            }

            const docBlob = await fillDocxTemplate('/templates/imagens.docx', templateData)
            const safeNuipc = formData.nuipc ? formData.nuipc.replace(/\//g, '-') : 'sem-ref'
            const fileName = `Notificacao_Imagens_${safeNuipc}.docx`
            downloadDocx(docBlob, fileName)

            toast.success("Notificação gerada com sucesso!")
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao gerar documento. Verifique se '/templates/imagens.docx' existe.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Criar Notificação de Imagens</DialogTitle>
                    <DialogDescription>
                        Preencha os dados para gerar o documento Word.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="nuipc">NUIPC</Label>
                        <Input id="nuipc" value={formData.nuipc} onChange={handleChange} placeholder="00/00.0PALGS" />
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="denominacao">Denominação Comercial</Label>
                        <Input id="denominacao" value={formData.denominacao} onChange={handleChange} placeholder="Ex: Café Central" />
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="morada">Morada</Label>
                        <Input id="morada" value={formData.morada} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data_inicio">Data Início</Label>
                            <Input id="data_inicio" type="date" value={formData.data_inicio} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hora_inicio">Hora Início</Label>
                            <Input id="hora_inicio" type="time" value={formData.hora_inicio} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data_fim">Data Fim</Label>
                            <Input id="data_fim" type="date" value={formData.data_fim} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hora_fim">Hora Fim</Label>
                            <Input id="hora_fim" type="time" value={formData.hora_fim} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="local_factos">Local dos Factos</Label>
                        <Input id="local_factos" value={formData.local_factos} onChange={handleChange} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleGenerate} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        Gerar Documento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
