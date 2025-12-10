'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Users, FileText } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { InquiryFlowChart } from './charts/inquiry-flow-chart'
import { TeamPerformanceTable } from './charts/team-performance-table'
import { WeeklyReportDialog } from './weekly-report-dialog'
import { generateWeeklyProductivityReport, generateDashboardReport } from '@/lib/pdf-generator'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, parseISO, subMonths, subWeeks } from 'date-fns'
import { pt } from 'date-fns/locale'

type UserStat = {
    userId: string
    userName: string
    userEmail: string
    activeInquiries: number
    closedInquiries: number
    totalInquiries: number
}

export default function EstadoDaNacaoPage() {
    const [stats, setStats] = useState<UserStat[]>([])
    // Analytics Data
    const [weeklyData, setWeeklyData] = useState<any[]>([])
    const [monthlyData, setMonthlyData] = useState<any[]>([])
    const [quarterlyData, setQuarterlyData] = useState<any[]>([])

    // State for Raw Data (needed for reports)
    const [rawInquiries, setRawInquiries] = useState<any[]>([])

    // Report State
    const [reportLoading, setReportLoading] = useState(false)
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [availableWeeks, setAvailableWeeks] = useState<{ label: string, startDate: Date, endDate: Date, count: number }[]>([])

    // Table Data
    const [monthlyTeamStats, setMonthlyTeamStats] = useState<any[]>([])
    const [monthlyOverallStats, setMonthlyOverallStats] = useState<any[]>([])
    const [monthlyKeys, setMonthlyKeys] = useState<string[]>([])
    const [monthlyLabels, setMonthlyLabels] = useState<string[]>([])

    const [weeklyTeamStats, setWeeklyTeamStats] = useState<any[]>([])
    const [weeklyOverallStats, setWeeklyOverallStats] = useState<any[]>([])
    const [weeklyKeys, setWeeklyKeys] = useState<string[]>([])
    const [weeklyLabels, setWeeklyLabels] = useState<string[]>([])

    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const generateAvailableWeeks = (inquiries: any[]) => {
        const weeks = []
        const today = new Date()

        let anchor = new Date(today)
        // If today is Friday and >= 09:00, anchor to today 09:00, else find previous Friday 09:00
        if (anchor.getDay() === 5 && anchor.getHours() >= 9) {
            anchor.setHours(9, 0, 0, 0)
        } else {
            while (anchor.getDay() !== 5) {
                anchor.setDate(anchor.getDate() - 1)
            }
            if (anchor.getDay() === 5 && today.getHours() < 9 && anchor.getDate() === today.getDate()) {
                anchor.setDate(anchor.getDate() - 7)
            }
            anchor.setHours(9, 0, 0, 0)
        }

        // Add Current Week (In Progress)
        const currentStart = new Date(anchor)
        const currentEnd = new Date(anchor)
        currentEnd.setDate(currentEnd.getDate() + 7)

        const currentCount = inquiries.filter(inq => {
            if (inq.estado !== 'concluido' || !inq.data_conclusao || !inq.numero_oficio) return false
            const dt = parseISO(inq.data_conclusao)
            return dt >= currentStart && dt <= currentEnd
        }).length

        weeks.push({
            label: "Semana Atual (Em curso)",
            startDate: currentStart,
            endDate: currentEnd,
            count: currentCount
        })

        // Generate Past Weeks
        for (let i = 0; i < 12; i++) {
            const endDate = new Date(anchor)
            endDate.setDate(anchor.getDate() - (i * 7))

            const startDate = new Date(endDate)
            startDate.setDate(endDate.getDate() - 7)

            const count = inquiries.filter(inq => {
                if (inq.estado !== 'concluido' || !inq.data_conclusao || !inq.numero_oficio) return false
                const dt = parseISO(inq.data_conclusao)
                return dt >= startDate && dt <= endDate
            }).length

            weeks.push({
                label: i === 0 ? "Última Semana Completa" : "",
                startDate,
                endDate,
                count
            })
        }
        setAvailableWeeks(weeks)
    }

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            // 1. Fetch Profiles
            const { data: rawProfiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true })

            if (profilesError) {
                console.error('Error fetching profiles', profilesError)
                setLoading(false)
                return
            }

            const profiles = rawProfiles?.filter(p => p.email !== 'user@sapo.pt')

            // 2. Fetch Inquiries
            const { data: inquiries, error: inqError } = await supabase
                .from('inqueritos')
                .select('id, user_id, estado, created_at, data_conclusao, numero_oficio')

            if (inqError) {
                console.error('Error fetching inquiries', inqError)
                setLoading(false)
                return
            }

            // --- KPI PROCESSING ---
            const statsMap: Record<string, UserStat> = {}
            profiles?.forEach(p => {
                statsMap[p.id] = {
                    userId: p.id,
                    userName: p.full_name || 'Sem Nome',
                    userEmail: p.email,
                    activeInquiries: 0,
                    closedInquiries: 0,
                    totalInquiries: 0
                }
            })

            inquiries?.forEach(inq => {
                if (inq.user_id && statsMap[inq.user_id]) {
                    if (inq.estado === 'concluido') {
                        statsMap[inq.user_id].closedInquiries++
                    } else {
                        statsMap[inq.user_id].activeInquiries++
                    }
                    statsMap[inq.user_id].totalInquiries++
                }
            })
            setStats(Object.values(statsMap).sort((a, b) => b.activeInquiries - a.activeInquiries))

            setRawInquiries(inquiries || [])
            generateAvailableWeeks(inquiries || [])

            // --- TEMPORAL ANALYTICS PROCESSING ---
            const processPeriods = (data: any[], type: 'week' | 'month' | 'quarter') => {
                const map: Record<string, { created: number, concluded: number }> = {}
                data.forEach(inq => {
                    const createdDate = parseISO(inq.created_at)
                    let createdKey = ''
                    if (type === 'week') createdKey = format(startOfWeek(createdDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                    if (type === 'month') createdKey = format(startOfMonth(createdDate), 'yyyy-MM')
                    if (type === 'quarter') createdKey = format(startOfQuarter(createdDate), 'yyyy-QQQ')

                    if (!map[createdKey]) map[createdKey] = { created: 0, concluded: 0 }
                    map[createdKey].created++

                    if (inq.estado === 'concluido' && inq.data_conclusao) {
                        const concludedDate = parseISO(inq.data_conclusao)
                        let concludedKey = ''
                        if (type === 'week') concludedKey = format(startOfWeek(concludedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                        if (type === 'month') concludedKey = format(startOfMonth(concludedDate), 'yyyy-MM')
                        if (type === 'quarter') concludedKey = format(startOfQuarter(concludedDate), 'yyyy-QQQ')

                        if (!map[concludedKey]) map[concludedKey] = { created: 0, concluded: 0 }
                        map[concludedKey].concluded++
                    }
                })
                return Object.entries(map).map(([period, vals]) => ({ period, ...vals })).sort((a, b) => a.period.localeCompare(b.period))
            }

            setWeeklyData(processPeriods(inquiries || [], 'week'))
            setMonthlyData(processPeriods(inquiries || [], 'month'))
            setQuarterlyData(processPeriods(inquiries || [], 'quarter'))


            // --- TEAM TABLE PROCESSING (Helper) ---
            const processTeamStats = (periods: Date[], formatStr: string, labelFormat: string) => {
                const keys = periods.map(d => format(d, formatStr))
                const labels = periods.map(d => format(d, labelFormat, { locale: pt }))

                const overall = keys.map(k => ({ period: k, created: 0, concluded: 0, balance: 0 }))

                const team = profiles?.map(user => {
                    const userStats: Record<string, { created: number, concluded: number; balance: number }> = {}
                    let totalCreated = 0
                    let totalConcluded = 0

                    // Pre-calculate user's relevant inquiries to avoid full scan inside loop
                    const userInquiries = inquiries?.filter(i => i.user_id === user.id) || []

                    keys.forEach((key, idx) => {
                        const periodStart = periods[idx]
                        let periodEnd: Date

                        if (formatStr === 'yyyy-MM-dd') {
                            periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 })
                        } else {
                            periodEnd = endOfMonth(periodStart)
                        }
                        // Adjust periodEnd to end of day
                        periodEnd.setHours(23, 59, 59, 999)

                        let createdCount = 0
                        let concludedCount = 0
                        let balanceCount = 0

                        userInquiries.forEach(inq => {
                            const createdDate = parseISO(inq.created_at)

                            // Check if created IN this period
                            let createdKey = ''
                            if (formatStr === 'yyyy-MM-dd') {
                                createdKey = format(startOfWeek(createdDate, { weekStartsOn: 1 }), formatStr)
                            } else {
                                createdKey = format(createdDate, formatStr)
                            }

                            if (createdKey === key) {
                                createdCount++
                                totalCreated++
                            }

                            // Check if concluded IN this period
                            if (inq.estado === 'concluido' && inq.data_conclusao) {
                                const concludedDate = parseISO(inq.data_conclusao)
                                let concludedKey = ''
                                if (formatStr === 'yyyy-MM-dd') {
                                    concludedKey = format(startOfWeek(concludedDate, { weekStartsOn: 1 }), formatStr)
                                } else {
                                    concludedKey = format(concludedDate, formatStr)
                                }

                                if (concludedKey === key) {
                                    concludedCount++
                                    totalConcluded++
                                }
                            }

                            // Calculate Balance (Active at end of period)
                            // Created before or during period AND (Not concluded OR concluded AFTER period)
                            const isCreatedBeforeEnd = createdDate <= periodEnd
                            const isActiveAtEnd = !inq.data_conclusao || parseISO(inq.data_conclusao) > periodEnd

                            // Special case: If status is 'concluido' but no data_conclusao (legacy data issue?), assume not active? 
                            // Logic: If status='concluido' AND data_conclusao is null -> Treat as active? No, treat as concluded long ago?
                            // Safe bet: defined 'isCreatedBeforeEnd' and 'isActiveAtEnd' check covers mostly.
                            // Wait, strict check:
                            // Active = Created <= End AND (Status != Concluded OR (Status == Concluded AND Date > End))

                            let effectivelyActive = false
                            if (isCreatedBeforeEnd) {
                                if (inq.estado !== 'concluido') {
                                    effectivelyActive = true
                                } else {
                                    // It IS concluded, but was it concluded AFTER this period?
                                    if (inq.data_conclusao && parseISO(inq.data_conclusao) > periodEnd) {
                                        effectivelyActive = true
                                    }
                                }
                            }

                            if (effectivelyActive) {
                                balanceCount++
                            }
                        })

                        userStats[key] = { created: createdCount, concluded: concludedCount, balance: balanceCount }
                    })

                    return {
                        userName: user.full_name || user.email,
                        stats: userStats,
                        totals: { created: totalCreated, concluded: totalConcluded }
                    }
                }) || []

                team.forEach(u => {
                    keys.forEach((k, idx) => {
                        overall[idx].created += u.stats[k].created
                        overall[idx].concluded += u.stats[k].concluded
                        overall[idx].balance += u.stats[k].balance
                    })
                })

                return { team, overall, keys, labels }
            }

            // --- MONTHLY (Last 6 months) ---
            const last6MonthsDates = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i))
            const monthlyRes = processTeamStats(last6MonthsDates, 'yyyy-MM', 'MMM yyyy')
            setMonthlyKeys(monthlyRes.keys)
            setMonthlyLabels(monthlyRes.labels)
            setMonthlyTeamStats(monthlyRes.team)
            setMonthlyOverallStats(monthlyRes.overall)

            // --- WEEKLY (Last 8 weeks) ---
            const last8WeeksDates = Array.from({ length: 8 }).map((_, i) => subWeeks(new Date(), 7 - i))
            const weeklyRes = processTeamStats(last8WeeksDates.map(d => startOfWeek(d, { weekStartsOn: 1 })), 'yyyy-MM-dd', 'dd/MM')
            setWeeklyKeys(weeklyRes.keys)
            setWeeklyLabels(weeklyRes.labels)
            setWeeklyTeamStats(weeklyRes.team)
            setWeeklyOverallStats(weeklyRes.overall)

            setLoading(false)
        }

        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSelectWeek = async (week: { startDate: Date, endDate: Date }) => {
        setReportLoading(true)
        try {
            const { data: reportInquiries, error } = await supabase
                .from('inqueritos')
                .select('nuipc, tipo_crime, data_conclusao, numero_oficio, user_id, destino')
                .eq('estado', 'concluido')
                .not('numero_oficio', 'is', null)
                .gte('data_conclusao', week.startDate.toISOString())
                .lte('data_conclusao', week.endDate.toISOString())

            if (error) throw error

            if (!reportInquiries || reportInquiries.length === 0) {
                alert("Erro: Dados não encontrados.")
                return
            }

            const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, email')
            const profiles = allProfiles?.filter(p => p.email !== 'user@sapo.pt') || []

            const reportDataAll = profiles.map(p => {
                const userInqs = reportInquiries.filter(i => i.user_id === p.id)
                return {
                    userId: p.id,
                    userName: p.full_name || p.email,
                    inquiries: userInqs
                }
            })

            const { data: { user } } = await supabase.auth.getUser()
            const currentUserName = user?.user_metadata?.full_name || 'Admin'

            await generateWeeklyProductivityReport(reportDataAll, stats, week.startDate, week.endDate, currentUserName)
            setReportDialogOpen(false)

        } catch (e) {
            console.error(e)
            alert("Erro ao gerar relatório.")
        } finally {
            setReportLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            setReportLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            const currentUserName = user?.user_metadata?.full_name || 'Admin'

            await generateDashboardReport(
                {
                    weekly: weeklyData,
                    monthly: monthlyData,
                    quarterly: quarterlyData
                },
                {
                    weekly: weeklyTeamStats,
                    monthly: monthlyTeamStats
                },
                stats,
                currentUserName
            )
        } catch (error) {
            console.error("Error exporting dashboard:", error)
            alert("Erro ao exportar dashboard.")
        } finally {
            setReportLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <WeeklyReportDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                weeks={availableWeeks}
                onSelect={handleSelectWeek}
                loading={reportLoading}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Estado da Nação</h1>
                    <p className="text-muted-foreground">Visão geral da distribuição de processos e produtividade da equipa.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setReportDialogOpen(true)} variant="default">
                        <FileText className="mr-2 h-4 w-4" />
                        Relatório Semanal
                    </Button>
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar Dashboard
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Militares</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inquéritos Ativos</CardTitle>
                        <div className="h-4 w-4 rounded-full bg-blue-500/20" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.reduce((acc, curr) => acc + curr.activeInquiries, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inquéritos Concluídos</CardTitle>
                        <div className="h-4 w-4 rounded-full bg-green-500/20" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.reduce((acc, curr) => acc + curr.closedInquiries, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Charts */}
            <InquiryFlowChart
                weeklyData={weeklyData}
                monthlyData={monthlyData}
                quarterlyData={quarterlyData}
            />

            {/* TEAM PERFORMANCE TABLES */}
            <TeamPerformanceTable
                title="Performance Semanal (Últimas 8 Semanas)"
                periodLabels={weeklyLabels}
                periodKeys={weeklyKeys}
                teamStats={weeklyTeamStats}
                overallStats={weeklyOverallStats}
            />

            <TeamPerformanceTable
                title="Performance Mensal (Últimos 6 Meses)"
                periodLabels={monthlyLabels}
                periodKeys={monthlyKeys}
                teamStats={monthlyTeamStats}
                overallStats={monthlyOverallStats}
            />


            {/* Detailed List (Legacy/Current Snapshot) */}
            <Card>
                <CardHeader>
                    <CardTitle>Carga de Trabalho Atual</CardTitle>
                    <CardDescription>Snapshot do momento atual: quem tem mais processos ativos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Militar</TableHead>
                                <TableHead className="text-center">Existentes (Ativos)</TableHead>
                                <TableHead className="text-center">Concluídos (Total)</TableHead>
                                <TableHead className="text-center">Total Atribuído</TableHead>
                                <TableHead className="text-right">Carga</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.map((stat) => (
                                <TableRow key={stat.userId}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={`https://avatar.vercel.sh/${stat.userEmail}`} />
                                                <AvatarFallback>{stat.userName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span>{stat.userName}</span>
                                                <span className="text-xs text-muted-foreground">{stat.userEmail}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                            {stat.activeInquiries}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                            {stat.closedInquiries}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                        {stat.totalInquiries}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {stat.activeInquiries > 120 ? (
                                            <Badge variant="destructive" className="bg-red-950 hover:bg-red-900 border-red-900 animate-pulse">Excesso Detectado</Badge>
                                        ) : stat.activeInquiries >= 100 ? (
                                            <Badge variant="destructive">Muito Alta</Badge>
                                        ) : stat.activeInquiries >= 80 ? (
                                            <Badge className="bg-orange-500 hover:bg-orange-600">Alta</Badge>
                                        ) : stat.activeInquiries >= 61 ? (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Moderada</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-200">Baixa</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
