'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardCounts, DashboardData } from "./actions"
import { getFiscalYears } from "@/app/sp/config/actions"
import { FileText, Mail, Users, Package, Syringe, Inbox, Loader2, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

export default function SPDashboard() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<DashboardData | null>(null)
    // Year State
    const [years, setYears] = useState<{ active: number, previous: number }>({ active: 2026, previous: 2025 })

    useEffect(() => {
        async function load() {
            try {
                // 1. Get Years
                const fiscalYears = await getFiscalYears()
                const available = fiscalYears?.map(d => d.year).sort((a, b) => b - a) || []

                // Active should be the max year found, OR 2026 if nothing higher exists.
                // This prevents fallback to 2025 if 2026 isn't in DB yet.
                const maxDbYear = available.length > 0 ? available[0] : 0
                const active = Math.max(maxDbYear, 2026)

                // Previous is either the next available year in DB, OR active - 1
                const nextAvailable = available.find(y => y < active)
                const previous = nextAvailable || (active - 1)

                setYears({ active, previous })

                // 2. Get Stats using those years

                const stats = await getDashboardCounts(active, previous)
                setData(stats)
            } catch (err) {
                console.error("Failed to load dashboard:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // Helper to format currency
    const formatMoney = (val: number) => val.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

    // Helper for Diff Indicator
    const TrendIndicator = ({ current, previous }: { current: number, previous: number }) => {
        if (current === previous) return <span className="text-gray-400 flex items-center text-xs"><Minus className="h-3 w-3 mr-1" /> Igual a {years.previous}</span>
        const isUp = current > previous
        const diff = current - previous
        const color = isUp ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400" // Generally Up is "More Work" or "More Seizures". For Pending, Up is bad? Context matters. Let's stick to neutral colors or just Up/Down.
        // Actually, for "Processos Crime" (Entrances/Stock?), user usually wants to see volume.

        return (
            <span className={`${color} flex items-center text-xs font-semibold`}>
                {isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {diff > 0 ? '+' : ''}{diff} vs {years.previous} ({previous})
            </span>
        )
    }

    if (loading || !data) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const { active, previous } = data

    return (
        <div className="p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    Secção de Processos
                    <span className="text-sm font-normal text-muted-foreground bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full border">
                        Ano Ativo: {years.active}
                    </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Visão geral da atividade comparativa ({years.active} vs {years.previous}).
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Processos Crime Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Processos Crime (GBABF)</CardTitle>
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{active.processos}</div>
                        <div className="mt-1">
                            <TrendIndicator current={active.processos} previous={previous.processos} />
                        </div>
                    </CardContent>
                </Card>

                {/* Inquéritos Externos Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inquéritos Externos</CardTitle>
                        <Inbox className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{active.inqueritosExternos}</div>
                        <div className="mt-1">
                            <TrendIndicator current={active.inqueritosExternos} previous={previous.inqueritosExternos} />
                        </div>
                    </CardContent>
                </Card>

                {/* Correspondência Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Correspondência</CardTitle>
                        <Mail className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{active.correspondencia}</div>
                        <div className="mt-1">
                            <TrendIndicator current={active.correspondencia} previous={previous.correspondencia} />
                        </div>
                    </CardContent>
                </Card>

                {/* Total Detainees Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Detidos ({years.active})</CardTitle>
                        <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{active.totalDetidos}</div>
                        <div className="mt-1">
                            <TrendIndicator current={active.totalDetidos} previous={previous.totalDetidos} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 align-start items-start">
                {/* Seizures Breakdown Card */}
                <Card className="hover:shadow-md transition-shadow md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium">Apreensões ({years.active})</CardTitle>
                        <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-3">
                            {Object.keys(active.seizuresTree).length > 0 ? (
                                Object.entries(active.seizuresTree as Record<string, any>)
                                    .sort(([, a], [, b]) => b.total - a.total)
                                    .map(([cat, stats]) => (
                                        <div key={cat} className="space-y-1">
                                            {/* Main Category */}
                                            <div className="flex justify-between items-center text-sm font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-zinc-800 pb-1">
                                                <span>{cat}</span>
                                                {!stats.isValue && (
                                                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                                        {stats.total}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Subcategories */}
                                            {Object.entries(stats.subs as Record<string, number>).map(([subKey, subVal]) => (
                                                <div key={subKey} className="flex justify-between items-center text-xs pl-4 pr-1 text-gray-600 dark:text-gray-400">
                                                    <span>↳ {subKey}</span>
                                                    <span className="font-mono font-semibold">
                                                        {stats.isValue ? formatMoney(subVal) : subVal}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Sem registos de apreensões</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Drugs Breakdown Card */}
                <Card className="hover:shadow-md transition-shadow md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium">Estupefacientes ({years.active})</CardTitle>
                        <Syringe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-2">
                            {Object.entries(active.drugsTotals as Record<string, number>).map(([type, amount]) => (
                                amount > 0 && (
                                    <div key={type} className="flex justify-between items-center text-sm border-b pb-1 last:border-0 last:pb-0">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{type}</span>
                                        <span className="font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {amount.toLocaleString('pt-PT')}
                                        </span>
                                    </div>
                                )
                            ))}
                            {Object.values(active.drugsTotals as Record<string, number>).every(v => v === 0) && (
                                <p className="text-sm text-muted-foreground italic">Sem apreensões de estupefacientes</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
