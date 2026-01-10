'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Users, FileText, Medal } from 'lucide-react'
import { fetchOperationalStats, MilitaryStats } from './actions'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { getFiscalYears } from '@/app/sp/config/actions'

export default function OperationalResultsPage() {
    const [stats, setStats] = useState<MilitaryStats[]>([])
    const [loading, setLoading] = useState(true)
    const [years, setYears] = useState<number[]>([2026])
    const [activeYear, setActiveYear] = useState<number>(2026)

    // Load available years
    useEffect(() => {
        getFiscalYears().then(data => {
            const fetchedYears = data?.map(d => d.year) || []
            const uniqueYears = Array.from(new Set([...fetchedYears, 2026]))
            const sortedYears = uniqueYears.sort((a, b) => b - a)
            setYears(sortedYears)
            setActiveYear(sortedYears[0])
        })
    }, [])

    // Load Stats
    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await fetchOperationalStats(activeYear)
                setStats(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [activeYear])

    // Derived Totals
    const totalProcesses = stats.reduce((acc, curr) => acc + curr.total_processos, 0)
    const totalDetainees = stats.reduce((acc, curr) => acc + curr.total_detidos, 0)
    const topPerformer = stats.length > 0 ? stats[0] : null

    // Chart Data - Top 10
    const chartData = stats.slice(0, 10).map(s => ({
        name: s.militar_id,
        detidos: s.total_detidos,
        processos: s.total_processos
    }))

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">Resultados Operacionais</h1>
                    <p className="text-muted-foreground">Análise de desempenho por militar participante.</p>
                </div>

                <Tabs value={activeYear.toString()} onValueChange={v => setActiveYear(parseInt(v))}>
                    <TabsList className="bg-amber-100 dark:bg-amber-900/40">
                        {years.map(y => (
                            <TabsTrigger
                                key={y}
                                value={y.toString()}
                                className="data-[state=active]:bg-white data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-950 dark:data-[state=active]:text-amber-100"
                            >
                                {y}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Total Processos
                        </CardTitle>
                        <FileText className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{totalProcesses}</div>
                        <p className="text-xs text-muted-foreground">
                            Processos com militar atribuído
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Total Detidos
                        </CardTitle>
                        <Users className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{totalDetainees}</div>
                        <p className="text-xs text-muted-foreground">
                            Detidos associados a estes processos
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Top Performance
                        </CardTitle>
                        <Medal className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                            {topPerformer ? topPerformer.militar_id : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {topPerformer ? `${topPerformer.total_detidos} Detidos` : 'Sem dados'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Chart */}
                <Card className="col-span-2 md:col-span-1 border-amber-200 dark:border-amber-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-amber-600" />
                            Top 10 - Detenções
                        </CardTitle>
                        <CardDescription>
                            Militares com maior número de detidos registados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d97706" opacity={0.2} />
                                    <XAxis type="number" />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={80}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 251, 235, 0.9)',
                                            borderColor: '#fbbf24',
                                            borderRadius: '8px',
                                            color: '#451a03'
                                        }}
                                        itemStyle={{ color: '#451a03' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#b45309' }}
                                    />
                                    <Bar dataKey="detidos" name="Detidos" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#d97706' : '#f59e0b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                Sem dados para apresentar
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="col-span-2 md:col-span-1 border-amber-200 dark:border-amber-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-amber-600" />
                            Detalhe por Militar
                        </CardTitle>
                        <CardDescription>
                            Lista completa ordenada por produtividade.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] overflow-auto p-0">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white dark:bg-stone-950 z-10">
                                <TableRow>
                                    <TableHead>Nº Mec</TableHead>
                                    <TableHead className="text-right">Processos</TableHead>
                                    <TableHead className="text-right">Detidos</TableHead>
                                    <TableHead>Top Crime</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-600" />
                                        </TableCell>
                                    </TableRow>
                                ) : stats.map((s, idx) => (
                                    <TableRow key={s.militar_id}>
                                        <TableCell className="font-mono font-medium flex items-center gap-2">
                                            {idx === 0 && <Medal className="h-3 w-3 text-yellow-500" />}
                                            {idx === 1 && <Medal className="h-3 w-3 text-gray-400" />}
                                            {idx === 2 && <Medal className="h-3 w-3 text-amber-700" />}
                                            {s.militar_id}
                                        </TableCell>
                                        <TableCell className="text-right">{s.total_processos}</TableCell>
                                        <TableCell className="text-right font-bold text-amber-700 dark:text-amber-400">
                                            {s.total_detidos}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] truncate max-w-[120px]">
                                                {s.top_crime}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
