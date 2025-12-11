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
import { Pencil, Loader2, Plus, X } from 'lucide-react'
import { updateInquiry } from '@/app/inqueritos/actions'

interface EditInquiryDialogProps {
    inquiry: Inquiry
}

export function EditInquiryDialog({ inquiry }: EditInquiryDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Initial state setup helper
    const getInitialList = (data: any) => {
        if (Array.isArray(data) && data.length > 0) {
            return data.map((d, i) => ({ id: Date.now() + i, nome: d.nome }))
        }
        return [{ id: Date.now(), nome: '' }]
    }

    const [denunciantes, setDenunciantes] = useState<{ id: number; nome: string }[]>(getInitialList(inquiry.denunciantes))
    const [denunciados, setDenunciados] = useState<{ id: number; nome: string }[]>(getInitialList(inquiry.denunciados))


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        // Append JSON strings for dynamic lists
        const validDenunciantes = denunciantes.filter(d => d.nome.trim() !== '').map(d => ({ nome: d.nome }))
        const validDenunciados = denunciados.filter(d => d.nome.trim() !== '').map(d => ({ nome: d.nome }))

        formData.append('denunciantes', JSON.stringify(validDenunciantes))
        formData.append('denunciados', JSON.stringify(validDenunciados))

        await updateInquiry(inquiry.id, formData)

        setLoading(false)
        setOpen(false)
    }

    const addField = (setter: React.Dispatch<React.SetStateAction<{ id: number; nome: string }[]>>) => {
        setter(prev => [...prev, { id: Date.now(), nome: '' }])
    }

    const removeField = (setter: React.Dispatch<React.SetStateAction<{ id: number; nome: string }[]>>, id: number) => {
        setter(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev)
    }

    const updateField = (setter: React.Dispatch<React.SetStateAction<{ id: number; nome: string }[]>>, id: number, value: string) => {
        setter(prev => prev.map(item => item.id === id ? { ...item, nome: value } : item))
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Inquérito
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Inquérito</DialogTitle>
                    <DialogDescription>
                        Altere os dados principais do inquérito.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nuipc">NUIPC *</Label>
                        <Input id="nuipc" name="nuipc" defaultValue={inquiry.nuipc} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data_ocorrencia">Data dos Factos</Label>
                            <Input type="date" id="data_ocorrencia" name="data_ocorrencia" defaultValue={inquiry.data_ocorrencia || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="data_participacao">Data de Conhecimento dos Factos</Label>
                            <Input type="date" id="data_participacao" name="data_participacao" defaultValue={inquiry.data_participacao || ''} />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label htmlFor="data_atribuicao">Data de Atribuição</Label>
                            <Input type="date" id="data_atribuicao" name="data_atribuicao" defaultValue={inquiry.data_atribuicao || ''} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipo_crime">Tipo de Crime</Label>
                        <Input id="tipo_crime" name="tipo_crime" defaultValue={inquiry.tipo_crime || ''} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="numero_oficio">Nº Ofício de Saída</Label>
                            <Input id="numero_oficio" name="numero_oficio" defaultValue={inquiry.numero_oficio || ''} placeholder="Opcional" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="destino">Destino / Entidade</Label>
                            <Input id="destino" name="destino" defaultValue={inquiry.destino || ''} placeholder="Opcional" />
                        </div>
                    </div>

                    {/* Dynamic Fields Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
                        {/* Denunciantes */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Denunciante(s)</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addField(setDenunciantes)}
                                    className="h-8 text-xs"
                                >
                                    <Plus className="mr-1 h-3 w-3" /> Adicionar
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {denunciantes.map((item, index) => (
                                    <div key={item.id} className="flex gap-2">
                                        <Input
                                            placeholder={`Nome ${index + 1}`}
                                            value={item.nome}
                                            onChange={(e) => updateField(setDenunciantes, item.id, e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        {denunciantes.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeField(setDenunciantes, item.id)}
                                                className="shrink-0 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Denunciados */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Denunciado(s)</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addField(setDenunciados)}
                                    className="h-8 text-xs"
                                >
                                    <Plus className="mr-1 h-3 w-3" /> Adicionar
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {denunciados.map((item, index) => (
                                    <div key={item.id} className="flex gap-2">
                                        <Input
                                            placeholder={`Nome ${index + 1}`}
                                            value={item.nome}
                                            onChange={(e) => updateField(setDenunciados, item.id, e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        {denunciados.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeField(setDenunciados, item.id)}
                                                className="shrink-0 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
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
