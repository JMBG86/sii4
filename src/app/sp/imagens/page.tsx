'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { fetchImagensRows } from './actions' // We'll create this logic
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Search, Loader2, Image as ImageIcon, ExternalLink, Calendar as CalendarIcon } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

import { ImagensEditDialog } from './edit-dialog'
import { ImagensNotificationDialog } from './notification-dialog'
import { DeleteImageButton } from './delete-button'

import { Suspense } from 'react'
import { getFiscalYears } from '@/app/sp/config/actions'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

function ImagensContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    // Year Tabs
    const [years, setYears] = useState<number[]>([2026])
    const [activeYear, setActiveYear] = useState<number>(2026)

    // Dialog State
    const [selectedProcess, setSelectedProcess] = useState<any>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [notificationOpen, setNotificationOpen] = useState(false)

    const debouncedSearch = useDebounce(searchTerm, 300)

    // Load Years
    useEffect(() => {
        getFiscalYears().then(data => {
            const fetchedYears = data?.map(d => d.year) || []
            const uniqueYears = Array.from(new Set([...fetchedYears, 2026]))
            const sortedYears = uniqueYears.sort((a, b) => b - a)

            setYears(sortedYears)
            setActiveYear(sortedYears[0])
        })
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                const data = await fetchImagensRows(page, 50, debouncedSearch, activeYear)
                setRows(data.rows)
                setTotalPages(data.totalPages)
                setTotalCount(data.totalCount)
            } catch (error) {
                console.error("Failed to load data", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [page, debouncedSearch, refreshTrigger, activeYear])

    // Reset page on year change
    useEffect(() => {
        setPage(1)
    }, [activeYear])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ImageIcon className="h-6 w-6 text-pink-600" />
                        Repositório de Imagens
                    </h1>
                    <p className="text-muted-foreground">
                        Processos sinalizados com imagens de videovigilancia ({activeYear}).
                    </p>
                </div>
                <Button onClick={() => setNotificationOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    CRIAR NOTIFICAÇÃO DE IMAGENS
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
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar NUIPC ou Crime..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">NUIPC</TableHead>
                                        <TableHead className="w-[180px]">Prazo (30 Dias)</TableHead>
                                        <TableHead>Crime</TableHead>
                                        <TableHead className="w-[120px]">Data Registo</TableHead>
                                        <TableHead>Localização</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                {loading ? 'A carregar...' : `Nenhum processo com imagens encontrado em ${activeYear}.`}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((row) => {
                                            const isNotified = row.notificacao_imagens
                                            const rowClass = isNotified
                                                ? 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-l-4 border-l-emerald-600 bg-emerald-100/50 font-medium'
                                                : 'cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 border-l-4 border-l-red-600 bg-red-100/50 font-medium'

                                            // Countdown Logic
                                            let countdownContent: React.ReactNode = '-'
                                            if (row.data_factos && !isNotified) {
                                                const today = new Date()
                                                const factDate = new Date(row.data_factos)
                                                // Real logic: We want (FactDate + 30) - Today
                                                const deadline = new Date(factDate)
                                                deadline.setDate(deadline.getDate() + 30)

                                                // Difference in milliseconds
                                                const msPerDay = 1000 * 60 * 60 * 24
                                                const remainingTime = deadline.getTime() - today.getTime()
                                                const remainingDays = Math.ceil(remainingTime / msPerDay)

                                                if (remainingDays < 0) {
                                                    countdownContent = <span className="text-red-600 font-bold text-xs bg-red-200 dark:bg-red-900 px-2 py-1 rounded">PERÍODO ULTRAPASSADO</span>
                                                } else {
                                                    countdownContent = <span className={remainingDays <= 5 ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>{remainingDays} dias restantes</span>
                                                }
                                            } else if (isNotified) {
                                                countdownContent = <Badge variant="outline" className="text-emerald-700 border-emerald-600 bg-emerald-50">Notificado</Badge>
                                            } else {
                                                countdownContent = <span className="text-muted-foreground text-xs italic">S/ Data Factos</span>
                                            }

                                            return (
                                                <TableRow key={row.id} className={rowClass} onClick={() => setSelectedProcess(row)}>
                                                    <TableCell className="font-medium font-mono">
                                                        {row.nuipc_completo || 'S/ Ref'}
                                                        {!isNotified && (
                                                            <Badge variant="destructive" className="ml-2 text-[10px] h-5 px-1">
                                                                FALTA NOTIFICAR
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {countdownContent}
                                                    </TableCell>
                                                    <TableCell>{row.tipo_crime || '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <CalendarIcon className="h-3 w-3" />
                                                            {row.data_registo ? format(new Date(row.data_registo), 'dd/MM/yyyy') : '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.localizacao ? (
                                                            <Badge variant="outline">{row.localizacao}</Badge>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedProcess(row)
                                                        }}>
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Ver Detalhes
                                                        </Button>
                                                        <DeleteImageButton id={row.id} onSuccess={() => setRefreshTrigger(p => p + 1)} />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <div className="text-sm text-muted-foreground">
                                Total: {totalCount} registos
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                >
                                    Anterior
                                </Button>
                                <div className="text-sm font-medium">
                                    Página {page} de {Math.max(1, totalPages)}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages || loading}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {selectedProcess && (
                <ImagensEditDialog
                    open={!!selectedProcess}
                    onOpenChange={(open) => !open && setSelectedProcess(null)}
                    processo={selectedProcess}
                    onSaved={() => {
                        setRefreshTrigger(p => p + 1)
                    }}
                />
            )}

            <ImagensNotificationDialog
                open={notificationOpen}
                onOpenChange={setNotificationOpen}
            />
        </div>
    )
}

export default function ImagensPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ImagensContent />
        </Suspense>
    )
}
