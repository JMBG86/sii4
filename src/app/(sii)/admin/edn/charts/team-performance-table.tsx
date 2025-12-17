'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PeriodStat {
    period: string
    created: number
    concluded: number
    balance: number
}

interface UserPeriodStat {
    userName: string
    stats: Record<string, { created: number; concluded: number; balance: number }> // Key is period identifier (e.g. "2024-01" or "2024-W01")
    totals: { created: number; concluded: number }
}

interface TeamPerformanceTableProps {
    title: string
    periodLabels: string[] // List of display labels "Jan 2024", "Week 12", etc.
    periodKeys: string[]   // List of keys corresponding to the labels "2024-01", "2024-12", etc.
    teamStats: UserPeriodStat[]
    overallStats: PeriodStat[]
}

export function TeamPerformanceTable({ title, periodLabels, periodKeys, teamStats, overallStats }: TeamPerformanceTableProps) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 overflow-x-auto">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    Detalhamento de entradas e saídas por militar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px] sticky left-0 bg-background z-10">Militar / Período</TableHead>
                            {periodLabels.map((label, i) => (
                                <TableHead key={i} className="text-center border-l bg-muted/20">
                                    <div className="font-bold whitespace-nowrap px-1 text-xs">{label}</div>
                                    <div className="text-[10px] text-muted-foreground grid grid-cols-3 gap-1 mt-1">
                                        <span>Ent.</span>
                                        <span>Sai.</span>
                                        <span className="font-bold text-purple-600">Exist.</span>
                                    </div>
                                </TableHead>
                            ))}
                            <TableHead className="text-center font-bold border-l bg-muted/40 sticky right-0 z-10">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Overall Row */}
                        <TableRow className="bg-muted/30 font-semibold border-b-2">
                            <TableCell className="sticky left-0 bg-muted/30 z-10">TOTAL EQUIPA</TableCell>
                            {overallStats.map((stat, i) => (
                                <TableCell key={i} className="text-center border-l p-0 px-1">
                                    <div className="grid grid-cols-3 gap-1 h-full items-center">
                                        <div className="text-blue-600">{stat.created}</div>
                                        <div className="text-green-600">{stat.concluded}</div>
                                        <div className="text-purple-600 font-bold">{stat.balance}</div>
                                    </div>
                                </TableCell>
                            ))}
                            <TableCell className="text-center border-l font-bold sticky right-0 bg-muted/30 z-10">
                                <span className="text-blue-600">{overallStats.reduce((a, b) => a + b.created, 0)}</span> / <span className="text-green-600">{overallStats.reduce((a, b) => a + b.concluded, 0)}</span>
                            </TableCell>
                        </TableRow>

                        {/* Per User Rows */}
                        {teamStats.map((user) => (
                            <TableRow key={user.userName}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10 truncate max-w-[200px]" title={user.userName}>
                                    {user.userName}
                                </TableCell>
                                {periodKeys.map(key => {
                                    const stat = user.stats[key] || { created: 0, concluded: 0 }
                                    return (
                                        <TableCell key={key} className="text-center border-l p-0 px-1">
                                            <div className="grid grid-cols-3 gap-1 h-full items-center text-xs">
                                                <div className={stat.created > 0 ? "text-blue-600 font-medium" : "text-gray-300"}>{stat.created}</div>
                                                <div className={stat.concluded > 0 ? "text-green-600 font-medium" : "text-gray-300"}>{stat.concluded}</div>
                                                <div className={stat.balance > 0 ? "text-purple-600 font-bold" : "text-gray-300"}>{stat.balance}</div>
                                            </div>
                                        </TableCell>
                                    )
                                })}
                                <TableCell className="text-center border-l sticky right-0 bg-background z-10">
                                    <Badge variant="outline" className="text-xs font-normal">
                                        {user.totals.created} / {user.totals.concluded}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
