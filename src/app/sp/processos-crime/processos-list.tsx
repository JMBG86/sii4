'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchProcessos } from './actions'
import { SPProcessoCrime } from '@/types/database'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { ProcessoDetailDialog } from './detail-dialog'
import { cn } from '@/lib/utils'

export function ProcessosTable({ year }: { year: number }) {
    const [data, setData] = useState<SPProcessoCrime[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProcess, setSelectedProcess] = useState<SPProcessoCrime | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: rows, count } = await fetchProcessos(page, 100, searchTerm, year)
            setData(rows as SPProcessoCrime[] || [])
            if (count) setTotalPages(Math.ceil(count / 100))
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [page, searchTerm, year])

    // Reset pagination when year changes
    useEffect(() => {
        setPage(1)
    }, [year])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            loadData()
        }, 500)
        return () => clearTimeout(timer)
    }, [loadData])

    // --- Helper to extract Seizure Categories ---
    function getSeizureCategories(p: SPProcessoCrime) {
        const categories = new Set<string>()

        // 1. Drugs
        const drugData = p.sp_apreensoes_drogas
        let hasDrugs = false
        if (Array.isArray(drugData) && drugData.length > 0) hasDrugs = true
        else if (drugData && typeof drugData === 'object' && !Array.isArray(drugData)) hasDrugs = true

        if (hasDrugs) categories.add('Estupefaciente')

        // 2. Generic Seizures
        if (p.sp_apreensoes_info && p.sp_apreensoes_info.length > 0) {
            p.sp_apreensoes_info.forEach(a => {
                if (a.tipo) {
                    // Extract main category (e.g. "Armas: Pistola" -> "Armas")
                    const mainCat = a.tipo.split(':')[0].trim()
                    categories.add(mainCat)
                }
            })
        }

        return Array.from(categories)
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-md border">
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground ml-2" />
                    <Input
                        placeholder="Pesquisar NUIPC, Arguido..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setPage(1) // Reset to page 1 on search
                        }}
                        className="border-0 focus-visible:ring-0 w-64"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                    Página {page} de {totalPages}
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white dark:bg-zinc-900 overflow-x-auto">
                <Table className="whitespace-nowrap">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">#</TableHead>
                            <TableHead>NUIPC</TableHead>
                            <TableHead>Data Registo</TableHead>
                            <TableHead>Detidos</TableHead>
                            <TableHead>Apreensões</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Tipo Crime</TableHead>
                            <TableHead>Denunciante</TableHead>
                            <TableHead>Vítima</TableHead>
                            <TableHead>Arguido</TableHead>
                            <TableHead>Destino</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : data.map((row) => {
                            const cats = getSeizureCategories(row)

                            return (
                                <TableRow key={row.id} className={cn(!row.nuipc_completo && "opacity-50 hover:opacity-80")}>
                                    <TableCell className="font-mono font-bold text-muted-foreground">
                                        {row.numero_sequencial}
                                    </TableCell>
                                    <TableCell>
                                        {row.nuipc_completo ? (
                                            <Badge variant="outline">{row.nuipc_completo}</Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Vazio</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{row.data_registo ? new Date(row.data_registo).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>
                                        {row.detidos ? (
                                            <Badge variant="destructive" className="font-mono">
                                                {row.total_detidos || 0} DETIDO(S)
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">Não</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {cats.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {cats.map(c => (
                                                    <Badge key={c} variant="secondary" className="text-[10px] h-5 px-1 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                                        {c.toUpperCase()}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{row.localizacao || '-'}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={row.tipo_crime}>{row.tipo_crime || '-'}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={row.denunciante}>{row.denunciante || '-'}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={row.vitima}>{row.vitima || '-'}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={row.arguido}>{row.arguido || '-'}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={row.entidade_destino}>
                                        {(row.entidade_destino === 'SII ALBUFEIRA' || row.entidade_destino === 'SII') ? (
                                            <Badge className="bg-blue-600 hover:bg-blue-700 border-0">
                                                SII
                                            </Badge>
                                        ) : row.entidade_destino ? (
                                            <Badge variant="secondary">{row.entidade_destino}</Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedProcess(row)}>
                                            <Edit2 className="h-3 w-3 mr-1" />
                                            {row.nuipc_completo ? 'Editar' : 'Registar'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {selectedProcess && (
                <ProcessoDetailDialog
                    processo={selectedProcess}
                    open={!!selectedProcess}
                    onOpenChange={(open: boolean) => {
                        if (!open) {
                            setSelectedProcess(null)
                            // Small delay to ensure DB propagation/revalidation
                            setTimeout(() => loadData(), 100)
                        }
                    }}
                />
            )}
        </div>
    )
}
