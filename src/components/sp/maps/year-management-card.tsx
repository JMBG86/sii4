'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Trash2, Plus, RefreshCw, AlertTriangle, Pencil } from 'lucide-react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { getFiscalYears, openNewYear, deleteYear, updateYearConfig, getYearProgress, FiscalYearConfig } from '@/app/sp/config/actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function YearManagementCard() {
    const [years, setYears] = useState<FiscalYearConfig[]>([])
    const [stats, setStats] = useState<Record<number, { proc: number, prec: number }>>({})
    const [loading, setLoading] = useState(false)
    const [newYearOpen, setNewYearOpen] = useState(false)
    const [editYearOpen, setEditYearOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    // Form State
    const [targetYear, setTargetYear] = useState<string>((new Date().getFullYear() + 1).toString())
    const [stockProc, setStockProc] = useState<string>('')
    const [stockPrec, setStockPrec] = useState<string>('')
    const [seedRows, setSeedRows] = useState<string>('0')

    useEffect(() => {
        loadYears()
    }, [refreshKey])

    async function loadYears() {
        try {
            const data = await getFiscalYears()
            setYears(data || [])

            // Load stats for each year (concluded count)
            const statsMap: Record<number, { proc: number, prec: number }> = {}
            if (data) {
                for (const y of data) {
                    const res = await getYearProgress(y.year)
                    statsMap[y.year] = {
                        proc: res.total_concluded,
                        prec: res.total_precatorias_concluded || 0
                    }
                }
            }
            setStats(statsMap)

        } catch (err) {
            console.error(err)
        }
    }

    async function handleOpenYear() {
        if (!targetYear) return
        setLoading(true)

        const config: FiscalYearConfig = {
            year: parseInt(targetYear),
            stock_processos_start: parseInt(stockProc) || 0,
            stock_precatorias_start: parseInt(stockPrec) || 0,
            is_active: true
        }

        const res = await openNewYear(config, parseInt(seedRows) || 0)

        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(`Ano ${targetYear} aberto com sucesso!`)
            setNewYearOpen(false)
            setRefreshKey(k => k + 1)
        }
    }

    async function handleDelete(year: number) {
        if (!confirm(`Tem a certeza que deseja apagar o ano ${year}? Todos os processos associados serão eliminados!`)) return

        setLoading(true)
        const res = await deleteYear(year)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(`Ano ${year} eliminado.`)
            setRefreshKey(k => k + 1)
        }
    }

    // Edit Functionality
    function openEdit(y: FiscalYearConfig) {
        setTargetYear(y.year.toString())
        setStockProc(y.stock_processos_start.toString())
        setStockPrec(y.stock_precatorias_start.toString())
        setEditYearOpen(true)
    }

    async function handleEditYear() {
        setLoading(true)
        const res = await updateYearConfig(parseInt(targetYear), parseInt(stockProc) || 0, parseInt(stockPrec) || 0)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(`Ano ${targetYear} atualizado.`)
            setEditYearOpen(false)
            setRefreshKey(k => k + 1)
        }
    }

    return (
        <Card className="border-amber-100 dark:border-amber-900 bg-amber-50/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Gestão Anual (v3 - Live Stock)
                </CardTitle>
                <Calendar className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-4">
                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold">Anos Operacionais</div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Configure a abertura de novos anos e valores de transição manual (Stock).
                    </p>

                    {/* Active Years List */}
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        {years.map(y => {
                            const concludedProc = stats[y.year]?.proc || 0
                            const concludedPrec = stats[y.year]?.prec || 0

                            const currentStockProc = Math.max(0, y.stock_processos_start - concludedProc)
                            const currentStockPrec = Math.max(0, y.stock_precatorias_start - concludedPrec)

                            return (
                                <div key={y.year} className="flex flex-col gap-1 p-2 bg-white dark:bg-zinc-900 rounded border">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{y.year}</span>
                                            {y.is_active && <Badge variant="default" className="text-[10px] h-5">Ativo</Badge>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="h-6 text-xs bg-blue-600 hover:bg-blue-700 text-white mr-1"
                                                onClick={() => openEdit(y)}
                                            >
                                                EDITAR STOCK
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(y.year)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-2 border-t pt-2">
                                        {/* Processos Block */}
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground uppercase text-[10px]">Proc. Inicial</span>
                                                <span className="font-mono font-bold text-amber-600">{y.stock_processos_start}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground uppercase text-[10px]">Concl.</span>
                                                <span className="font-mono font-bold text-green-600">-{concludedProc}</span>
                                            </div>
                                            <div className="flex flex-col border-l pl-2">
                                                <span className="text-muted-foreground uppercase text-[10px]">Atual</span>
                                                <span className="font-mono font-bold text-base">{currentStockProc}</span>
                                            </div>
                                        </div>

                                        {/* Precatórias Block */}
                                        <div className="flex items-center gap-4 text-xs border-l pl-4">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground uppercase text-[10px]">Prec. Inicial</span>
                                                <span className="font-mono font-bold text-amber-600">{y.stock_precatorias_start}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground uppercase text-[10px]">Concl.</span>
                                                <span className="font-mono font-bold text-green-600">-{concludedPrec}</span>
                                            </div>
                                            <div className="flex flex-col border-l pl-2">
                                                <span className="text-muted-foreground uppercase text-[10px]">Atual</span>
                                                <span className="font-mono font-bold text-base">{currentStockPrec}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {years.length === 0 && <span className="text-xs italic text-muted-foreground">Nenhum ano configurado. (Assume 2025 default)</span>}
                    </div>

                    <Dialog open={newYearOpen} onOpenChange={setNewYearOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Abrir Novo Ano
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Abrir Novo Ano Fiscal</DialogTitle>
                                <DialogDescription>
                                    Cria um novo registo anual e define os stocks iniciais (transição manual).
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Ano</Label>
                                    <Input
                                        type="number"
                                        value={targetYear}
                                        onChange={e => setTargetYear(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Stock Processos (Dez)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Valor que transita..."
                                        value={stockProc}
                                        onChange={e => setStockProc(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Stock Precat. (Dez)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Valor que transita..."
                                        value={stockPrec}
                                        onChange={e => setStockPrec(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>

                                <div className="border-t my-2"></div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center gap-2 mb-2 text-yellow-800 dark:text-yellow-400 font-bold text-xs">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Geração de Estrutura</span>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right text-xs">Linhas Vazias (Seed)</Label>
                                        <Input
                                            type="number"
                                            placeholder="Ex: 4000"
                                            value={seedRows}
                                            onChange={e => setSeedRows(e.target.value)}
                                            className="col-span-3 h-8 text-sm"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2 ml-1">
                                        Se preenchido (ex: 4000), cria linhas vazias com Sequencial 1-4000 prontas a preencher.
                                        Deixe a 0 se não usar pré-alocação.
                                    </p>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setNewYearOpen(false)}>Cancelar</Button>
                                <Button onClick={handleOpenYear} disabled={loading}>
                                    {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar Abertura
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={editYearOpen} onOpenChange={setEditYearOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Editar Ano {targetYear}</DialogTitle>
                                <DialogDescription>
                                    Ajuste os valores de stock inicial (transição manual).
                                    Esta ação não afeta a estrutura de processos já criada, apenas altera o valor de referência 'Stock Inicial'.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Stock Processos</Label>
                                    <Input
                                        type="number"
                                        value={stockProc}
                                        onChange={e => setStockProc(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Stock Precatórias</Label>
                                    <Input
                                        type="number"
                                        value={stockPrec}
                                        onChange={e => setStockPrec(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditYearOpen(false)}>Cancelar</Button>
                                <Button onClick={handleEditYear} disabled={loading}>
                                    {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Alterações
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    )
}
