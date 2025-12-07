'use client'

import { useState } from 'react'
import { Inquiry } from '@/types/database'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Pencil, Loader2 } from 'lucide-react'
import { updateInquiry } from '@/app/inqueritos/actions'

interface EditInquiryDialogProps {
    inquiry: Inquiry
}

export function EditInquiryDialog({ inquiry }: EditInquiryDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        await updateInquiry(inquiry.id, formData)
        setLoading(false)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Inquérito
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Inquérito</DialogTitle>
                    <DialogDescription>
                        Altere os dados principais do inquérito.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nuipc">NUIPC *</Label>
                        <Input id="nuipc" name="nuipc" defaultValue={inquiry.nuipc} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data_ocorrencia">Data da Ocorrência</Label>
                            <Input type="date" id="data_ocorrencia" name="data_ocorrencia" defaultValue={inquiry.data_ocorrencia || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="data_participacao">Data da Participação</Label>
                            <Input type="date" id="data_participacao" name="data_participacao" defaultValue={inquiry.data_participacao || ''} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipo_crime">Tipo de Crime</Label>
                        <Input id="tipo_crime" name="tipo_crime" defaultValue={inquiry.tipo_crime || ''} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="classificacao">Classificação</Label>
                        <Select name="classificacao" defaultValue={inquiry.classificacao}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="relevo">Relevo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="localizacao">Localização</Label>
                        <Input id="localizacao" name="localizacao" defaultValue={inquiry.localizacao || ''} placeholder="Ex: Posto X, Arquivo..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                            id="observacoes"
                            name="observacoes"
                            defaultValue={inquiry.observacoes || ''}
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
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
