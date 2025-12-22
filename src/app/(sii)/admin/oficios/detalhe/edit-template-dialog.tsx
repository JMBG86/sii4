'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { OficioTemplate } from '@/types/database'

export function EditTemplateDialog({ template }: { template: OficioTemplate }) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState(template.title)
    const [subject, setSubject] = useState(template.subject || '')
    const [recipient, setRecipient] = useState(template.recipient || '')
    const [recipientsList, setRecipientsList] = useState<{ label: string; content: string }[]>(
        (template.recipients as any) || []
    )
    const [content, setContent] = useState(template.content)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('oficio_templates')
                .update({
                    title,
                    subject,
                    recipient,
                    content,
                    recipients: recipientsList.length > 0 ? recipientsList : null
                })
                .eq('id', template.id)

            if (error) throw error

            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Error updating template:', error)
            alert('Erro ao atualizar modelo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Editar Modelo de Ofício</DialogTitle>
                        <DialogDescription>
                            Atualize as informações do modelo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 overflow-y-auto px-1">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título do Card</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Pedido de IMEI"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recipient">Destinatário Principal (Padrão)</Label>
                            <Textarea
                                id="recipient"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder={'Ex: \nAo Ministério Público\nDepartamento X\n...'}
                                className="font-mono text-sm"
                                rows={5}
                            />
                        </div>

                        {/* Multiple Recipients Section */}
                        <div className="space-y-3 border p-3 rounded-md bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-muted-foreground">Destinos Alternativos</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRecipientsList([...recipientsList, { label: '', content: '' }])}
                                >
                                    + Adicionar Destino
                                </Button>
                            </div>

                            {recipientsList.map((item, index) => (
                                <div key={index} className="space-y-2 p-2 border rounded bg-white relative group">
                                    <div className="absolute top-2 right-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                const newList = [...recipientsList];
                                                newList.splice(index, 1);
                                                setRecipientsList(newList);
                                            }}
                                        >
                                            <span className="sr-only">Remover</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                                        </Button>
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Nome da Entidade (Label)</Label>
                                        <Input
                                            value={item.label}
                                            onChange={(e) => {
                                                const newList = [...recipientsList];
                                                newList[index].label = e.target.value;
                                                setRecipientsList(newList);
                                            }}
                                            placeholder="Ex: Vodafone"
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Endereço (Texto Completo)</Label>
                                        <Textarea
                                            value={item.content}
                                            onChange={(e) => {
                                                const newList = [...recipientsList];
                                                newList[index].content = e.target.value;
                                                setRecipientsList(newList);
                                            }}
                                            placeholder="Endereço completo..."
                                            className="font-mono text-xs min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subject">Assunto (Linha única)</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Ex: NUIPC 123/24 - Pedido de Informação"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="content">Conteúdo</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Texto do ofício..."
                                className="h-[200px] font-mono text-sm"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-2 text-right">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardar' : 'Guardar Alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
