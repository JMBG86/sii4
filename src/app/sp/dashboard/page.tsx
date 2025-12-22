'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardCounts } from "./actions"
import { FileText, Mail, Users, Package, Syringe, Inbox, Loader2 } from "lucide-react"

export default function SPDashboard() {
    const [loading, setLoading] = useState(true)
    const [counts, setCounts] = useState<any>({
        processos: 0,
        inqueritosExternos: 0,
        correspondencia: 0,
        totalDetidos: 0,
        seizuresTree: {},
        drugsTotals: {}
    })

    useEffect(() => {
        getDashboardCounts()
            .then(data => {
                setCounts(data)
                setLoading(false)
            })
            .catch(err => {
                console.error("Failed to fetch dashboard counts", err)
                setLoading(false)
            })
    }, [])

    // Helper to format currency
    const formatMoney = (val: number) => val.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Secção de Processos</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Visão geral da atividade e pendentes.
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
                        <div className="text-2xl font-bold">{counts.processos}</div>
                        <p className="text-xs text-muted-foreground">Processos registados e atribuídos</p>
                    </CardContent>
                </Card>

                {/* Inquéritos Externos Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inquéritos Externos</CardTitle>
                        <Inbox className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.inqueritosExternos}</div>
                        <p className="text-xs text-muted-foreground">Registados e em tratamento</p>
                    </CardContent>
                </Card>

                {/* Correspondência Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Correspondência Pendente</CardTitle>
                        <Mail className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.correspondencia}</div>
                        <p className="text-xs text-muted-foreground">Total de entradas registadas</p>
                    </CardContent>
                </Card>

                {/* Total Detainees Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Detidos</CardTitle>
                        <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.totalDetidos}</div>
                        <p className="text-xs text-muted-foreground">Total acumulado de detidos</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 align-start items-start">
                {/* Seizures Breakdown Card - No Scroll Area, Auto Height */}
                <Card className="hover:shadow-md transition-shadow md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium">Apreensões (Geral)</CardTitle>
                        <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-3">
                            {Object.keys(counts.seizuresTree).length > 0 ? (
                                Object.entries(counts.seizuresTree as Record<string, any>)
                                    .sort(([, a], [, b]) => b.total - a.total)
                                    .map(([cat, stats]) => (
                                        <div key={cat} className="space-y-1">
                                            {/* Main Category */}
                                            <div className="flex justify-between items-center text-sm font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-zinc-800 pb-1">
                                                <span>{cat}</span>
                                                {/* Don't show total for distinct value types like Numerário, redundant if we show subs */}
                                                {!stats.isValue && (
                                                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                                        {stats.total}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Subcategories (Indented) */}
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

                {/* Drugs Breakdown Card - Auto Height too */}
                <Card className="hover:shadow-md transition-shadow md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium">Estupefacientes Apreendidos</CardTitle>
                        <Syringe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-2">
                            {Object.entries(counts.drugsTotals as Record<string, number>).map(([type, amount]) => (
                                amount > 0 && (
                                    <div key={type} className="flex justify-between items-center text-sm border-b pb-1 last:border-0 last:pb-0">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{type}</span>
                                        <span className="font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {amount.toLocaleString('pt-PT')}
                                        </span>
                                    </div>
                                )
                            ))}
                            {Object.values(counts.drugsTotals as Record<string, number>).every(v => v === 0) && (
                                <p className="text-sm text-muted-foreground italic">Sem apreensões de estupefacientes</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
