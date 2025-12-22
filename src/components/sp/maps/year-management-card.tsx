'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Trash2, Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { getFiscalYears, openNewYear, deleteYear, FiscalYearConfig } from '@/app/sp/config/actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function YearManagementCard() {
    const [years, setYears] = useState<FiscalYearConfig[]>([])
    const [loading, setLoading] = useState(false)
    const [newYearOpen, setNewYearOpen] = useState(false)
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

    return (
        <Card className="border-amber-100 dark:border-amber-900 bg-amber-50/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Gestão Anual
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
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                        {years.map(y => (
                            <div key={y.year} className="flex items-center justify-between text-sm p-2 bg-white dark:bg-zinc-900 rounded border">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{y.year}</span>
                                    {y.is_active && <Badge variant="default" className="text-[10px] h-5">Ativo</Badge>}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span title="Stock Processos">Proc: {y.stock_processos_start}</span>
                                    <span title="Stock Precatórias">Prec: {y.stock_precatorias_start}</span>
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
                        ))}
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
                </div>
            </CardContent>
        </Card>
    )
}
