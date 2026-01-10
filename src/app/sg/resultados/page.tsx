'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { fetchOperationalStats, OperationalStat } from './actions'
import { Loader2, Users, FileText, AlertCircle } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

export default function OperationalResultsPage() {
    const [stats, setStats] = useState<OperationalStat[]>([])
    const [loading, setLoading] = useState(true)
    const [year, setYear] = useState(2026)

    useEffect(() => {
        setLoading(true)
        fetchOperationalStats(year).then(data => {
            setStats(data)
            setLoading(false)
        })
    }, [year])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Top 3 Chart Data
    const chartData = stats.slice(0, 10).map(s => ({
        name: s.militar_id,
        Detidos: s.total_detidos,
        Processos: s.total_processos
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resultados Operacionais</h1>
                    <p className="text-muted-foreground">Análise de desempenho operacional por militar.</p>
                </div>

                <Tabs value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                    <TabsList>
                        <TabsTrigger value="2026">2026</TabsTrigger>
                        <TabsTrigger value="2025">2025</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-sky-950 dark:to-zinc-900 border-blue-100 dark:border-sky-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Militares Ativos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.length}</div>
                        <p className="text-xs text-muted-foreground">Com processos registados este ano</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-emerald-950 dark:to-zinc-900 border-green-100 dark:border-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Detenções</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.reduce((acc, curr) => acc + curr.total_detidos, 0)}</div>
                        <p className="text-xs text-muted-foreground">Acumulado do ano selecionado</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-zinc-900 border-purple-100 dark:border-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Processos</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.reduce((acc, curr) => acc + curr.total_processos, 0)}</div>
                        <p className="text-xs text-muted-foreground">Processos participados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performance (Detenções)</CardTitle>
                    <CardDescription>Militares com maior número de detenções registadas.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                itemStyle={{ color: 'var(--foreground)' }}
                            />
                            <Legend />
                            <Bar dataKey="Detidos" fill="#ef4444" name="Nº Detidos" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Processos" fill="#3b82f6" name="Nº Processos" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalhe Operacional</CardTitle>
                    <CardDescription>Lista completa de militares e produtividade.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Militar Ptc (ID)</TableHead>
                                <TableHead className="text-center">Nº Processos</TableHead>
                                <TableHead className="text-center">Nº Detidos</TableHead>
                                <TableHead>Tipologia + Frequente</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        Sem dados registados para este ano.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stats.map((stat) => (
                                    <TableRow key={stat.militar_id}>
                                        <TableCell className="font-medium">{stat.militar_id}</TableCell>
                                        <TableCell className="text-center">{stat.total_processos}</TableCell>
                                        <TableCell className="text-center font-bold text-red-600">{stat.total_detidos}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {stat.top_crime}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
