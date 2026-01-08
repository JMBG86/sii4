'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Baby, MoreHorizontal, Plus, Search, Loader2, Pencil, Trash2 } from "lucide-react"
import { fetchCPCJRecords, deleteCPCJRecord } from './actions'
import { CPCJEditDialog } from './edit-dialog'
import { toast } from "sonner"
import { getActiveYear } from '@/app/sp/config/actions'

export default function CPCJPage() {
    const [loading, setLoading] = useState(true)
    const [records, setRecords] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear())

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null)

    useEffect(() => {
        loadData()
    }, [search]) // Reload on search change (debounce handled via manual input or simple effect)

    async function loadData() {
        setLoading(true)
        try {
            // Get Config Year first if not set (or just default)
            // For now lets assume global listing or filter by current year later
            const data = await fetchCPCJRecords(search)
            setRecords(data || [])
        } catch (err) {
            console.error(err)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setSelectedRecord(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (rec: any) => {
        setSelectedRecord(rec)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja eliminar este registo?")) return
        const res = await deleteCPCJRecord(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Registo eliminado")
            loadData()
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pendente': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
            case 'Acompanhamento': return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
            case 'Arquivado': return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CPCJ</h1>
                    <p className="text-muted-foreground">
                        Gestão de sinalizações e processos de menores.
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Registo
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Listagem de Menores</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar nome ou NUIPC..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Data</TableHead>
                                    <TableHead>Nome do Menor</TableHead>
                                    <TableHead className="w-[50px]">Idade</TableHead>
                                    <TableHead>NUIPC</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.length > 0 ? (
                                    records.map((rec) => (
                                        <TableRow key={rec.id}>
                                            <TableCell className="font-medium text-xs">
                                                {new Date(rec.data_entrada).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{rec.nome_menor}</span>
                                                    {rec.data_nascimento && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Nasc: {new Date(rec.data_nascimento).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{rec.idade ? rec.idade + ' anos' : '-'}</TableCell>
                                            <TableCell className="text-xs font-mono">{rec.nuipc || '-'}</TableCell>
                                            <TableCell className="text-sm">{rec.motivo}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={getStatusColor(rec.estado)}>
                                                    {rec.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEdit(rec)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(rec.id)} className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Sem registos encontrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CPCJEditDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                record={selectedRecord}
                onSuccess={loadData}
            />
        </div>
    )
}
