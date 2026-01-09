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
    Gavel,
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
                {/* --- LINHA 1 --- */}

                {/* 1. Imagens (Global - Todos os Anos) */}
                <Card className="hover:shadow-md transition-shadow border-amber-200 dark:border-amber-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Imagens (Global)</CardTitle>
                        <ImageIcon className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{data.imagesStats.total}</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex flex-col p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-100 dark:border-amber-900">
                                <span className="font-semibold text-amber-700 dark:text-amber-400">Total</span>
                                <span className="text-lg font-bold">{data.imagesStats.total}</span>
                            </div>
                            <div className="flex flex-col p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900">
                                <span className="font-semibold text-blue-700 dark:text-blue-400">Notificadas</span>
                                <span className="text-lg font-bold">{data.imagesStats.notified}</span>
                            </div>
                            <div className="flex flex-col p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-100 dark:border-green-900">
                                <span className="font-semibold text-green-700 dark:text-green-400">Executadas</span>
                                <span className="text-lg font-bold">{data.imagesStats.executed}</span>
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
                        <div className="text-2xl font-bold mb-2">{data.totalDetidos}</div>
                        <div className="space-y-2 h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                            {data.detaineesBreakdown && data.detaineesBreakdown.length > 0 ? (
                                data.detaineesBreakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-100 dark:border-zinc-800 pb-1 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground truncate max-w-[180px]" title={item.crime}>
                                            {item.crime}
                                        </span>
                                        <span className="font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 px-1.5 rounded-sm">
                                            {item.count}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Sem detidos registados.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Alertas / Zonas Quentes */}
                <Card className="hover:shadow-md transition-shadow border-red-100 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Alertas</CardTitle>
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

                {/* --- LINHA 2 --- */}

                {/* 4. Armas */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Armas</CardTitle>
                        <Gavel className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{data.weaponsStats.total}</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between p-1 bg-green-50 dark:bg-green-950/20 rounded border border-green-100 dark:border-green-900">
                                <span className="text-green-700 dark:text-green-400 font-semibold">Entregues PSP</span>
                                <span className="font-bold text-green-800 dark:text-green-300">{data.weaponsStats.remetido}</span>
                            </div>
                            <div className="flex justify-between p-1 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-100 dark:border-amber-900">
                                <span className="text-amber-700 dark:text-amber-400 font-semibold">Por Entregar</span>
                                <span className="font-bold text-amber-800 dark:text-amber-300">{data.weaponsStats.porRemeter}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Estupefacientes */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estupefacientes</CardTitle>
                        <Syringe className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-100 dark:border-green-900 text-center">
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-green-700">Entregues</div>
                                <div className="text-lg font-bold text-green-800">{data.drugsStats.remetido}</div>
                            </div>
                            <div className="flex-1 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-100 dark:border-amber-900 text-center">
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700">Por Entregar</div>
                                <div className="text-lg font-bold text-amber-800">{data.drugsStats.porByRemeter}</div>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
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

                {/* 6. Numerário */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Numerário</CardTitle>
                        <div className="font-bold text-amber-600">€</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{formatMoney(data.cashStats.total)}</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between p-1 bg-green-50 dark:bg-green-950/20 rounded border border-green-100 dark:border-green-900">
                                <span className="text-green-700 dark:text-green-400 font-semibold">Depositado</span>
                                <span className="font-bold text-green-800 dark:text-green-300">{formatMoney(data.cashStats.remetido)}</span>
                            </div>
                            <div className="flex justify-between p-1 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-100 dark:border-amber-900">
                                <span className="text-amber-700 dark:text-amber-400 font-semibold">Cofre (Por Depositar)</span>
                                <span className="font-bold text-amber-800 dark:text-amber-300">{formatMoney(data.cashStats.porRemeter)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- LINHA 3 --- */}

                {/* 7. Telemóveis */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Telemóveis</CardTitle>
                        <Smartphone className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{data.mobilePhones.total}</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between p-1 bg-green-50 dark:bg-green-950/20 rounded border border-green-100 dark:border-green-900">
                                <span className="text-green-700 dark:text-green-400 font-semibold">Total Remetido</span>
                                <span className="font-bold text-green-800 dark:text-green-300">{data.mobilePhones.remetido}</span>
                            </div>
                            <div className="flex justify-between p-1 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-100 dark:border-amber-900">
                                <span className="text-amber-700 dark:text-amber-400 font-semibold">Por Remeter</span>
                                <span className="font-bold text-amber-800 dark:text-amber-300">{data.mobilePhones.porRemeter}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 8. Detalhe de Apreensões */}
                <Card className="hover:shadow-md transition-shadow md:col-span-2">
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

            </div>
        </div>
    )
}
