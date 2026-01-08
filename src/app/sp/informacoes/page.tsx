'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Plus, Search, Loader2, Trash2, Calendar, User, Pin } from "lucide-react"
import { fetchInformacoes, createInformacao, deleteInformacao } from './actions'
import { toast } from "sonner"

export default function InformacoesPage() {
    const [loading, setLoading] = useState(true)
    const [infos, setInfos] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [search])

    async function loadData() {
        setLoading(true)
        try {
            const data = await fetchInformacoes(search)
            setInfos(data || [])
        } catch (err) {
            console.error(err)
            toast.error("Erro ao carregar informações")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await createInformacao(formData)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Informação publicada!")
            setIsDialogOpen(false)
            loadData()
        }
        setSubmitting(false)
    }

    async function handleDelete(id: string) {
        if (!confirm("Eliminar esta informação?")) return
        const res = await deleteInformacao(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Eliminado com sucesso")
            loadData()
        }
    }

    return (
        <div className="space-y-6 container max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Informações de Serviço</h1>
                    <p className="text-muted-foreground">
                        Quadro de avisos e notas internas.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nova Informação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Publicar Informação</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="assunto">Assunto</Label>
                                <Input id="assunto" name="assunto" required placeholder="Título da informação..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="data">Data</Label>
                                <Input id="data" name="data" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="conteudo">Conteúdo</Label>
                                <Textarea id="conteudo" name="conteudo" required placeholder="Escreva aqui os detalhes..." rows={5} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="importante" name="importante" />
                                <Label htmlFor="importante">Marcar como Importante / Fixado</Label>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'A publicar...' : 'Publicar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar informações..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-6">
                    {infos.length > 0 ? (
                        infos.map((info) => (
                            <Card key={info.id} className={`transition-all hover:shadow-md ${info.importante ? 'border-l-4 border-l-red-500 bg-red-50/10' : ''}`}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                {info.importante && (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <Pin className="h-3 w-3" /> Importante
                                                    </Badge>
                                                )}
                                                <CardTitle className="text-xl">{info.assunto}</CardTitle>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(info.data).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {info.profiles?.full_name || info.profiles?.email || 'Desconhecido'}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(info.id)} className="text-gray-400 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
                                        {info.conteudo}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhuma informação encontrada.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
