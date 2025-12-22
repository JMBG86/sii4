'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Search, Trash2, Edit } from 'lucide-react'
import { fetchDeprecadas, createDeprecada, updateDeprecada, deleteDeprecada } from './actions'
import { getEntidades } from '../processos-crime/actions'
import { SPInqueritoExterno, SPEntidade } from '@/types/database'
import { getFiscalYears } from '@/app/sp/config/actions'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function DeprecadasPage() {
    const [data, setData] = useState<SPInqueritoExterno[]>([])
    const [entidades, setEntidades] = useState<SPEntidade[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [open, setOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<SPInqueritoExterno | null>(null)

    // Year Tabs
    const [years, setYears] = useState<number[]>([2025])
    const [activeYear, setActiveYear] = useState<number>(2025)

    // Form State
    const [formData, setFormData] = useState({
        srv: '',
        numero_oficio: '',
        nuipc: '',
        origem: '',
        assunto: '',
        destino: '',
        data_entrada: new Date().toISOString().split('T')[0],
        observacoes: 'DEPRECADA '
    })

    // Load Years
    useEffect(() => {
        getFiscalYears().then(data => {
            const fetchedYears = data?.map(d => d.year) || []
            const uniqueYears = Array.from(new Set([...fetchedYears, 2025]))
            const sortedYears = uniqueYears.sort((a, b) => b - a)

            setYears(sortedYears)
            setActiveYear(sortedYears[0])
        })
    }, [])

    useEffect(() => {
        loadData()
        loadEntidades()
    }, [searchTerm, activeYear])

    async function loadData() {
        setLoading(true)
        try {
            const res = await fetchDeprecadas(searchTerm, activeYear)
            setData(res || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function loadEntidades() {
        try {
            const res = await getEntidades()
            setEntidades(res || [])
        } catch (error) {
            console.error(error)
        }
    }

    function handleOpen(item?: SPInqueritoExterno) {
        if (item) {
            setEditingItem(item)
            setFormData({
                srv: item.srv || '',
                numero_oficio: item.numero_oficio || '',
                nuipc: item.nuipc || '',
                origem: item.origem || '',
                assunto: item.assunto || '',
                destino: item.destino || '',
                data_entrada: item.data_entrada || new Date().toISOString().split('T')[0],
                observacoes: item.observacoes || 'DEPRECADA '
            })
        } else {
            setEditingItem(null)
            setFormData({
                srv: '',
                numero_oficio: '',
                nuipc: '',
                origem: '',
                assunto: '',
                destino: '',
                data_entrada: new Date().toISOString().split('T')[0],
                observacoes: 'DEPRECADA '
            })
        }
        setOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.nuipc) {
            alert("O NUIPC é obrigatório.")
            return
        }

        const payload = new FormData()
        Object.entries(formData).forEach(([key, value]) => payload.append(key, value))

        try {
            if (editingItem) {
                const res = await updateDeprecada(editingItem.id, payload)
                if (res.error) throw new Error(res.error)
                alert("Atualizado com sucesso")
            } else {
                const res = await createDeprecada(payload)
                if (res.error) throw new Error(res.error)
                alert("Criado com sucesso")
            }
            setOpen(false)
            loadData()
        } catch (error: any) {
            alert("Erro: " + error.message)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem a certeza que deseja apagar?")) return
        try {
            const res = await deleteDeprecada(id)
            if (res.error) throw new Error(res.error)
            alert("Apagado com sucesso")
            loadData()
        } catch (error: any) {
            alert(error.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Deprecadas</h1>
                    <p className="text-muted-foreground">Gestão de deprecadas (Inquéritos Externos marcados) ({activeYear}).</p>
                </div>
                <Button onClick={() => handleOpen()} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Deprecada
                </Button>
            </div>

            <Tabs value={activeYear.toString()} onValueChange={v => setActiveYear(parseInt(v))}>
                <TabsList>
                    {years.map(y => (
                        <TabsTrigger key={y} value={y.toString()}>
                            {y}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeYear.toString()}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 max-w-sm">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="rounded-md border bg-white dark:bg-zinc-900">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data Entrada</TableHead>
                                        <TableHead>NUIPC</TableHead>
                                        <TableHead>Nº Ofício</TableHead>
                                        <TableHead>Origem</TableHead>
                                        <TableHead>Assunto</TableHead>
                                        <TableHead>Destino</TableHead>
                                        <TableHead>Observações</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                Sem registos de Deprecadas em {activeYear}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.data_entrada}</TableCell>
                                                <TableCell className="font-mono font-medium">{item.nuipc}</TableCell>
                                                <TableCell>{item.numero_oficio}</TableCell>
                                                <TableCell>{item.origem}</TableCell>
                                                <TableCell>{item.assunto}</TableCell>
                                                <TableCell>{item.destino}</TableCell>
                                                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={item.observacoes || ''}>
                                                    {item.observacoes}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(item)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Editar Deprecada' : 'Nova Deprecada'}</DialogTitle>
                        <DialogDescription>
                            Preencha os dados. A referência "DEPRECADA" será mantida nas observações.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data Entrada</Label>
                                <Input type="date" value={formData.data_entrada} onChange={e => setFormData({ ...formData, data_entrada: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>NUIPC (Obrigatório)</Label>
                                <Input value={formData.nuipc} onChange={e => setFormData({ ...formData, nuipc: e.target.value })} required placeholder="####/##.#..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nº Ofício</Label>
                                <Input value={formData.numero_oficio} onChange={e => setFormData({ ...formData, numero_oficio: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>SRV (Referência)</Label>
                                <Input value={formData.srv} onChange={e => setFormData({ ...formData, srv: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Origem</Label>
                                <Input value={formData.origem} onChange={e => setFormData({ ...formData, origem: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Destino</Label>
                                <Select value={formData.destino} onValueChange={v => setFormData({ ...formData, destino: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SII ALBUFEIRA" className="font-bold text-blue-600">SII ALBUFEIRA</SelectItem>
                                        {entidades.filter(e => e.nome !== 'SII ALBUFEIRA').map(e => (
                                            <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Assunto</Label>
                            <Input value={formData.assunto} onChange={e => setFormData({ ...formData, assunto: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Observações (Tag DEPRECADA será incluída)</Label>
                            <Textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}


