'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSGDashboardStats, SGDashboardData } from "./actions"
import {
    Image as ImageIcon,
    Package,
    Syringe,
    Smartphone,
    ShieldAlert,
    Users,
    Loader2,
    Calendar,
    Send,
    Gavel,
    Search
} from "lucide-react"

export default function SGDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<SGDashboardData | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const stats = await getSGDashboardStats()
                setData(stats)
            } catch (err) {
                console.error("Failed to load SG dashboard:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const formatMoney = (val: number) => val.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
                        Dashboard SG
                    </h1>
                    <p className="text-muted-foreground">
                        Visão geral da Secção de Sargentos ({data.year}).
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900">
                    <Calendar className="h-4 w-4" />
                    Ano Ativo: {data.year}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* 1. Processos com Imagens */}
                <Card className="hover:shadow-md transition-shadow border-amber-200 dark:border-amber-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Imagens</CardTitle>
                        <ImageIcon className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{data.imagesStats.total}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex flex-col p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-100 dark:border-amber-900">
                                <span className="font-semibold text-amber-700 dark:text-amber-400">Por Notificar</span>
                                <span className="text-lg font-bold">{data.imagesStats.pending}</span>
                            </div>
                            <div className="flex flex-col p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-100 dark:border-green-900">
                                <span className="font-semibold text-green-700 dark:text-green-400">Concluídas</span>
                                <span className="text-lg font-bold">{data.imagesStats.concluded}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Detidos */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Detidos</CardTitle>
                        <Users className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalDetidos}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total de detidos registados no ano corrente.
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Telemóveis */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Telemóveis</CardTitle>
                        <Smartphone className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{data.mobilePhones.total}</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Com Despacho</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300">{data.mobilePhones.despacho}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Enviados Perícia</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300">{data.mobilePhones.pericia}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Enviados Tribunal</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300">{data.mobilePhones.tribunal}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Zonas Quentes (Alertas) */}
                <Card className="hover:shadow-md transition-shadow border-red-100 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Alertas / Zonas Quentes</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        {data.hotZones.length > 0 ? (
                            <div className="space-y-2">
                                {data.hotZones.map((zone, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-white dark:bg-black/20 p-2 rounded shadow-sm">
                                        <span className="font-medium text-red-800 dark:text-red-300">{zone.crime}</span>
                                        <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {zone.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Sem alertas ativos.</p>
                        )}
                    </CardContent>
                </Card>

                {/* 5. Apreensões (Detailed Tree) - Spanning 2 cols if possible or scroll */}
                <Card className="hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1 row-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Detalhe de Apreensões</CardTitle>
                        <Package className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent className="h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-3">
                            {Object.keys(data.seizuresTree).length > 0 ? (
                                Object.entries(data.seizuresTree)
                                    .sort(([, a], [, b]) => b.total - a.total)
                                    .map(([cat, stats]) => (
                                        <div key={cat} className="space-y-1">
                                            {/* Main Category */}
                                            <div className="flex justify-between items-center text-sm font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-zinc-800 pb-1 sticky top-0 bg-card z-10">
                                                <span>{cat}</span>
                                                {!stats.isValue && (
                                                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                                        {stats.total}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Subcategories */}
                                            {Object.entries(stats.subs)
                                                .filter(([subKey]) => Object.keys(stats.subs).length > 1 || subKey !== 'Geral')
                                                .map(([subKey, subVal]) => (
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

                {/* 6. Estupefacientes */}
                <Card className="hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estupefacientes</CardTitle>
                        <Syringe className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(data.drugsTotals).map(([type, amount]) => (
                                amount > 0 && (
                                    <div key={type} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-zinc-800 pb-1 last:border-0 last:pb-0">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">{type}</span>
                                        <span className="font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {amount.toLocaleString('pt-PT')}
                                        </span>
                                    </div>
                                )
                            ))}
                            {Object.values(data.drugsTotals).every(v => v === 0) && (
                                <p className="text-sm text-muted-foreground italic">Sem apreensões.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
