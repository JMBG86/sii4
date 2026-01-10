'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchProcessos, fetchProcessStats } from './actions'
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
    const [isReadOnly, setIsReadOnly] = useState(false)
    const [initialized, setInitialized] = useState(false) // Track if we settled on a page

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

    const [targetScrollSeq, setTargetScrollSeq] = useState<number | null>(null)



    // Initial Load / Year Change Logic
    useEffect(() => {
        const init = async () => {
            console.log('[AutoScroll] Init started for year:', year)
            setLoading(true)
            setInitialized(false)
            try {
                // Fetch stats to know where to land
                const { count, lastSeq } = await fetchProcessStats(year)
                console.log('[AutoScroll] Stats fetched:', { count, lastSeq })

                // Calculate page based on LAST REGISTERED SEQUENCE
                // If lastSeq is 66, page is 1. If lastSeq is 150, page is 2.
                // We default to 1 if lastSeq is 0/null (handled in action).
                const targetPage = Math.max(1, Math.ceil(lastSeq / 100))

                // Total pages still depends on COUNT (to show empty slots pagination)
                // If count is 4000 (40 pages), we show 40 pages, but start on page 1 (if lastSeq is 66).
                setTotalPages(Math.max(1, Math.ceil(count / 100)))

                setPage(targetPage)

                // Expose lastSeq to the render/scroll logic via a ref or query
                // We can't pass it easily to the effect below without state.
                // Let's store it in a data attribute on the container or local state?
                // Actually, we can just assume the "last registered" is what we scroll to.
                // BUT we need to know WHICH row to scroll to.
                // Let's store targetSeq in state?
                setTargetScrollSeq(lastSeq)

            } catch (e) {
                console.error('[AutoScroll] Init error:', e)
            }
        }
        init()
    }, [year])

    // Final cleanup of debug logs
    // Standard Data Loader
    useEffect(() => {
        loadData()
    }, [loadData])

    // Scroll Effect - Aggressive "Scroll All Parents" Strategy
    useEffect(() => {
        if (!loading && data.length > 0 && targetScrollSeq && !initialized) {
            // Give time for painting
            const timer = setTimeout(() => {
                const row = document.getElementById(`row-seq-${targetScrollSeq}`)
                if (row) {
                    // 1. Focus (Forces scroll)
                    row.focus({ preventScroll: false })

                    // 2. Standard API (Backup)
                    row.scrollIntoView({ behavior: 'auto', block: 'center' })

                    // 3. Walk up and scroll EVERY scrollable parent
                    let parent = row.parentElement
                    while (parent) {
                        // Check if this parent is vertically scrollable
                        // We check if scrollHeight is significantly larger than clientHeight
                        // AND if styles allow overflow.
                        const style = window.getComputedStyle(parent)
                        const overflowY = style.overflowY
                        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight

                        if (isScrollable) {
                            // Calculate specific position to center the row
                            const rowRect = row.getBoundingClientRect()
                            const parentRect = parent.getBoundingClientRect()

                            // Current ScrollTop + Relative Top of row - Half Parent Height + Half Row Height
                            // We need to be careful with getBoundingClientRect as it changes as we scroll parents.
                            // Safer to rely on offsetTop logic if standard flow, but Rect is okay if we do it once?
                            // Actually, let's just use a simple calculation relative to the view.

                            // Better: Just center the row in this parent's view
                            const relativeTop = rowRect.top - parentRect.top
                            const targetScrollTop = parent.scrollTop + relativeTop - (parent.clientHeight / 2) + (rowRect.height / 2)

                            parent.scrollTop = targetScrollTop
                        }

                        parent = parent.parentElement
                    }

                    setInitialized(true)
                }
            }, 1000) // 1s delay to be safe

            return () => clearTimeout(timer)
        } else if (!loading && !initialized && !targetScrollSeq && data.length > 0) {
            setInitialized(true)
        }
    }, [loading, data, targetScrollSeq, initialized])

    // On Search, reset to Page 1 and strictly disable auto-scroll (setInitialized true)
    useEffect(() => {
        if (searchTerm) {
            setPage(1)
            setInitialized(true) // Don't auto-scroll on search results
        }
    }, [searchTerm])

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
                    {/* Manual Scroll Trigger - Fallback for Auto-Scroll issues */}
                    {targetScrollSeq && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => {
                                const targetPage = Math.ceil(targetScrollSeq / 100)

                                if (page !== targetPage) {
                                    // Navigate to page (this will trigger data load -> and ideally the auto-scroll effect)
                                    // We reset initialized to ensure the effect runs
                                    setInitialized(false)
                                    setPage(targetPage)
                                } else {
                                    // Same page - Instant Scroll
                                    const row = document.getElementById(`row-seq-${targetScrollSeq}`)
                                    if (row) {
                                        row.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                        row.classList.add('bg-blue-200', 'dark:bg-blue-800')
                                        setTimeout(() => row.classList.remove('bg-blue-200', 'dark:bg-blue-800'), 2000)
                                        // Also try force focus
                                        row.focus({ preventScroll: false })
                                    }
                                }
                            }}
                            title={`Ir para processo ${targetScrollSeq} (Pág. ${Math.ceil(targetScrollSeq / 100)})`}
                        >
                            <span className="hidden sm:inline">Último ({targetScrollSeq})</span>
                            <div className="h-4 w-4 flex items-center justify-center border rounded-full border-current">
                                <ChevronRight className="h-3 w-3 rotate-90" />
                            </div>
                        </Button>
                    )}

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
            <div className="rounded-md border bg-white dark:bg-zinc-900 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">#</TableHead>
                            <TableHead className="min-w-[120px]">NUIPC</TableHead>
                            <TableHead className="min-w-[100px]">Data Registo</TableHead>
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
                            if (row.numero_sequencial === targetScrollSeq) console.log(`[ProcessosTable] Rendering ROW ${row.numero_sequencial}`)

                            return (
                                <TableRow
                                    key={row.id}
                                    id={`row-seq-${row.numero_sequencial}`}
                                    data-seq={row.numero_sequencial}
                                    tabIndex={-1}
                                    className={cn(
                                        "cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus:bg-blue-100 dark:focus:bg-blue-900/50",
                                        !row.nuipc_completo && "opacity-50 hover:opacity-80"
                                    )}
                                    onClick={() => {
                                        setSelectedProcess(row)
                                        setIsReadOnly(true)
                                    }}
                                >
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
                                    <TableCell className="max-w-[150px] truncate" title={row.localizacao || ''}>{row.localizacao || '-'}</TableCell>
                                    <TableCell className="max-w-[120px] truncate" title={row.tipo_crime || ''}>{row.tipo_crime || '-'}</TableCell>
                                    <TableCell className="max-w-[100px] truncate" title={row.denunciante || ''}>{row.denunciante || '-'}</TableCell>
                                    <TableCell className="max-w-[100px] truncate" title={row.vitima || ''}>{row.vitima || '-'}</TableCell>
                                    <TableCell className="max-w-[100px] truncate" title={row.arguido || ''}>{row.arguido || '-'}</TableCell>
                                    <TableCell className="max-w-[100px] truncate" title={row.entidade_destino || ''}>
                                        {(row.entidade_destino === 'SII ALBUFEIRA' || row.entidade_destino === 'SII') ? (
                                            <Badge className="bg-blue-600 hover:bg-blue-700 border-0">
                                                SII
                                            </Badge>
                                        ) : row.entidade_destino ? (
                                            <Badge variant="secondary" className="max-w-full truncate">{row.entidade_destino}</Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedProcess(row)
                                                setIsReadOnly(false)
                                            }}
                                        >
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
                    readOnly={isReadOnly}
                    onOpenChange={(open: boolean) => {
                        if (!open) {
                            setSelectedProcess(null)
                            setIsReadOnly(false)
                            // Small delay to ensure DB propagation/revalidation
                            setTimeout(() => loadData(), 100)
                        }
                    }}
                />
            )}

        </div>
    )
}
