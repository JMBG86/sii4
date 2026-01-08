'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchSGStatisticsData } from './actions'
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
import { getISOWeek, getYear } from 'date-fns'

// --- Types ---
type ProcessData = {
    id: string
    data_registo: string | null
    entidade_destino: string | null
    total_detidos: number
    sp_detidos_info: { nacionalidade: string }[]
    sp_apreensoes_drogas: any[]
    sp_apreensoes_info: { tipo: string, descricao?: string }[]
}

// SG Amber Theme Colors
const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#b45309', '#78350f', '#92400e', '#fcd34d']
// Original: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

export default function SGEstatisticaPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ProcessData[]>([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const res = await fetchSGStatisticsData()
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
            drugsByMonth[monthKey]['Haxixe'] = (drugsByMonth[monthKey]['Haxixe'] || 0) + (drugs.cannabis_resina_g || 0)
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

    // 4. Seizure Types
    const seizureCounts: Record<string, number> = {}

    data.forEach(p => {
        // Drugs Check
        let hasDrugs = false
        const rawDrugs = p.sp_apreensoes_drogas
        if (Array.isArray(rawDrugs) && rawDrugs.length > 0) hasDrugs = true
        else if (rawDrugs && typeof rawDrugs === 'object' && Object.keys(rawDrugs).length > 0) hasDrugs = true

        if (hasDrugs) {
            seizureCounts['Estupefacientes'] = (seizureCounts['Estupefacientes'] || 0) + 1
        }

        // Other Seizures
        if (p.sp_apreensoes_info) {
            p.sp_apreensoes_info.forEach(s => {
                const type = s.tipo || 'Outros'
                seizureCounts[type] = (seizureCounts[type] || 0) + 1
            })
        }
    })

    const seizuresChartData = Object.entries(seizureCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    // 5. Destinations (Group by Entity)
    const destCounts: Record<string, number> = {}

    data.forEach(p => {
        const rawDest = (p.entidade_destino || 'Outros Órgãos').trim()

        let category = 'Outros Órgãos'

        if (rawDest === 'SII' || rawDest === 'SII ALBUFEIRA') category = 'SII'
        else if (rawDest === 'DIAP Albufeira' || rawDest === 'DIAP ALBUFEIRA') category = 'DIAP Albufeira'
        else if (rawDest === 'PJ Faro' || rawDest === 'PJ FARO') category = 'PJ Faro'
        else if (rawDest.toUpperCase().startsWith('DIAP')) category = 'Outros DIAPS'
        else if (rawDest.toUpperCase().includes('TRIBUNAL')) category = 'Tribunal'
        else if (rawDest.toUpperCase().includes('GNR')) category = 'GNR'
        else if (rawDest.toUpperCase().includes('PSP')) category = 'PSP'

        destCounts[category] = (destCounts[category] || 0) + 1
    })

    const destChartData = Object.entries(destCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    // 5. Drugs by Week
    const drugsByWeek: Record<string, any> = {}

    data.forEach(p => {
        if (!p.data_registo) return
        const date = new Date(p.data_registo)
        // Week Key: YYYY-Www
        const week = getISOWeek(date)
        const year = getYear(date)
        const weekKey = `${year}-W${String(week).padStart(2, '0')}`

        // Drugs
        const rawDrugs = p.sp_apreensoes_drogas
        let drugs: any = null
        if (Array.isArray(rawDrugs) && rawDrugs.length > 0) drugs = rawDrugs[0]
        else if (rawDrugs && typeof rawDrugs === 'object' && !Array.isArray(rawDrugs)) drugs = rawDrugs

        if (drugs) {
            if (!drugsByWeek[weekKey]) drugsByWeek[weekKey] = { name: weekKey }

            drugsByWeek[weekKey]['Heroína'] = (drugsByWeek[weekKey]['Heroína'] || 0) + (drugs.heroina_g || 0)
            drugsByWeek[weekKey]['Cocaína'] = (drugsByWeek[weekKey]['Cocaína'] || 0) + (drugs.cocaina_g || 0)
            drugsByWeek[weekKey]['Haxixe'] = (drugsByWeek[weekKey]['Haxixe'] || 0) + (drugs.cannabis_resina_g || 0)
            drugsByWeek[weekKey]['Liamba'] = (drugsByWeek[weekKey]['Liamba'] || 0) + (drugs.cannabis_folhas_g || 0)
        }
    })

    const drugsWeeklyChartData = Object.values(drugsByWeek)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">Estatísticas e Gráficos (SG)</h1>
                <p className="text-muted-foreground">Análise visual da atividade registada.</p>
            </div>

            {/* ROW 1: General Stats Charts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-amber-200 dark:border-amber-800">
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
                                <Line type="monotone" dataKey="Detidos" stroke="#d97706" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 dark:border-amber-800">
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
                                    label={({ name, percent }: { name?: string | number; percent?: number }) => `${name ?? ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#f59e0b"
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

                <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader>
                        <CardTitle>Tipos de Apreensão</CardTitle>
                        <CardDescription>Distribuição por categoria</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={seizuresChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string | number; percent?: number }) => `${name ?? ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#78350f"
                                    dataKey="value"
                                >
                                    {seizuresChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ROW 2: Destinations Chart */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader>
                        <CardTitle>Destino dos Inquéritos</CardTitle>
                        <CardDescription>Distribuição por entidade de destino</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={destChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string | number; percent?: number }) => `${name ?? ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#b45309"
                                    dataKey="value"
                                >
                                    {destChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ROW 3: Drugs Chart (Full Width) */}
            <Card className="border-amber-200 dark:border-amber-800">
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
                            <Line type="monotone" dataKey="Heroína" stroke="#fbbf24" strokeWidth={2} />
                            <Line type="monotone" dataKey="Cocaína" stroke="#b45309" strokeWidth={2} />
                            <Line type="monotone" dataKey="Haxixe" stroke="#92400e" strokeWidth={2} />
                            <Line type="monotone" dataKey="Liamba" stroke="#78350f" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ROW 3: Weekly Drugs Chart */}
            <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader>
                    <CardTitle>Evolução Semanal de Estupefacientes</CardTitle>
                    <CardDescription>Quantidade apreendida por semana (ISO)</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={drugsWeeklyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Heroína" stroke="#fbbf24" strokeWidth={2} />
                            <Line type="monotone" dataKey="Cocaína" stroke="#b45309" strokeWidth={2} />
                            <Line type="monotone" dataKey="Haxixe" stroke="#92400e" strokeWidth={2} />
                            <Line type="monotone" dataKey="Liamba" stroke="#78350f" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div >
    )
}
