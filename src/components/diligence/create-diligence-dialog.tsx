'use client'

import { useState } from 'react'
import { addDiligence } from '@/app/inqueritos/actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'
import { Inquiry } from '@/types/database'

export function CreateDiligenceDialog({ inquiries, preSelectedInquiryId }: { inquiries: Inquiry[], preSelectedInquiryId?: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // States
    const [selectedInquiry, setSelectedInquiry] = useState(preSelectedInquiryId || '')
    const [selectedType, setSelectedType] = useState('oficio')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        await addDiligence(formData)
        setLoading(false)
        setOpen(false)
        // Optionally reset form state if needed, but Dialog unmounts logic usually fine
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Diligência
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Criar Nova Diligência</DialogTitle>
                    <DialogDescription>
                        Associe uma tarefa a um inquérito existente.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">

                    {/* Inquiry Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="inquerito_id">Inquérito</Label>
                        <div className="relative">
                            <Select name="inquerito_id" value={selectedInquiry} onValueChange={setSelectedInquiry} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o inquérito..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {inquiries.map(inq => (
                                        <SelectItem key={inq.id} value={inq.id}>
                                            {inq.nuipc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo</Label>
                            <Select name="tipo" value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="oficio">Ofício Enviado</SelectItem>
                                    <SelectItem value="inquiricao">Pedido de Inquirição</SelectItem>
                                    <SelectItem value="aguardar">Aguardar Confirmação</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="data_prevista">Prazo / Data Prevista</Label>
                            <Input type="date" name="data_prevista" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição Detalhada</Label>
                        <Input name="descricao" placeholder="Ex: Ofício para ISP a pedir dados..." required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="entidade">Entidade (Opcional)</Label>
                        <Input name="entidade" placeholder="Ex: Vodafone, Banco X..." />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading || !selectedInquiry}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Diligência
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
