'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchStatisticsData } from '../processos-crime/actions'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { Loader2 } from 'lucide-react'

// --- Types ---
type ProcessData = {
    id: string
    data_registo: string | null
    total_detidos: number
    sp_detidos_info: { nacionalidade: string }[]
    sp_apreensoes_drogas: any[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

export default function StatisticsPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ProcessData[]>([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const res = await fetchStatisticsData()
            setData(res || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // --- Aggregation Logic ---

    // 1. Detainees Evolution (Group by Month)
    const detaineesByMonth: Record<string, number> = {}
    // 2. Nationalities (Group by Nationality)
    const natCounts: Record<string, number> = {}
    // 3. Drugs (Group by Month & Type)
    const drugsByMonth: Record<string, any> = {}

    data.forEach(p => {
        if (!p.data_registo) return
        const date = new Date(p.data_registo)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM

        // Detainees
        detaineesByMonth[monthKey] = (detaineesByMonth[monthKey] || 0) + (p.total_detidos || 0)

        // Nationalities
        if (p.sp_detidos_info) {
            p.sp_detidos_info.forEach(d => {
                const nac = d.nacionalidade || 'Desconhecida'
                natCounts[nac] = (natCounts[nac] || 0) + 1
            })
        }

        // Drugs
        const rawDrugs = p.sp_apreensoes_drogas
        let drugs: any = null
        if (Array.isArray(rawDrugs) && rawDrugs.length > 0) drugs = rawDrugs[0]
        else if (rawDrugs && typeof rawDrugs === 'object' && !Array.isArray(rawDrugs)) drugs = rawDrugs

        if (drugs) {
            if (!drugsByMonth[monthKey]) drugsByMonth[monthKey] = { name: monthKey }

            drugsByMonth[monthKey]['Heroína'] = (drugsByMonth[monthKey]['Heroína'] || 0) + (drugs.heroina_g || 0)
            drugsByMonth[monthKey]['Cocaína'] = (drugsByMonth[monthKey]['Cocaína'] || 0) + (drugs.cocaina_g || 0)
            drugsByMonth[monthKey]['Hashish'] = (drugsByMonth[monthKey]['Hashish'] || 0) + (drugs.cannabis_resina_g || 0)
            drugsByMonth[monthKey]['Liamba'] = (drugsByMonth[monthKey]['Liamba'] || 0) + (drugs.cannabis_folhas_g || 0)
        }
    })

    // Transform to Recharts Array
    const detaineesChartData = Object.entries(detaineesByMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, value]) => ({ name, Detidos: value }))

    const natChartData = Object.entries(natCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    const drugsChartData = Object.values(drugsByMonth)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Estatísticas e Gráficos</h1>
                <p className="text-muted-foreground">Análise visual da atividade registada.</p>
            </div>

            {/* ROW 1: Evolution Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Evolução de Detidos</CardTitle>
                        <CardDescription>Número total de detenções por mês</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={detaineesChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Detidos" stroke="#ef4444" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Nacionalidades</CardTitle>
                        <CardDescription>Distribuição de detidos por nacionalidade</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={natChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name: string; percent?: number }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {natChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ROW 2: Drugs Chart (Full Width) */}
            <Card>
                <CardHeader>
                    <CardTitle>Apreensões de Estupefacientes (Gramas)</CardTitle>
                    <CardDescription>Quantidade apreendida por tipo ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={drugsChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Heroína" stroke="#8884d8" />
                            <Line type="monotone" dataKey="Cocaína" stroke="#82ca9d" />
                            <Line type="monotone" dataKey="Hashish" stroke="#ffc658" />
                            <Line type="monotone" dataKey="Liamba" stroke="#ff7300" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
