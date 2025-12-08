'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Users } from 'lucide-react'
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
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            // 1. Fetch Profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true })

            if (profilesError) {
                console.error('Error fetching profiles', profilesError)
                setLoading(false)
                return
            }

            // 2. Fetch Inquiries (Lightweight fetch)
            const { data: inquiries, error: inqError } = await supabase
                .from('inqueritos')
                .select('id, user_id, estado')

            if (inqError) {
                console.error('Error fetching inquiries', inqError)
                setLoading(false)
                return
            }

            // 3. Process Data
            const statsMap: Record<string, UserStat> = {}

            // Initialize map with all profiles
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

            // Aggregate counts
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
            setLoading(false)
        }

        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleExport = () => {
        alert("A funcionalidade de exportação será implementada em breve.")
    }

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Estado da Nação</h1>
                    <p className="text-muted-foreground">Visão geral da distribuição de processos e produtividade da equipa.</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Relatório
                </Button>
            </div>

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

            <Card>
                <CardHeader>
                    <CardTitle>Distribuição por Militar</CardTitle>
                    <CardDescription>Lista detalhada de carga de trabalho atual.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Militar</TableHead>
                                <TableHead className="text-center">Ativos</TableHead>
                                <TableHead className="text-center">Concluídos</TableHead>
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
                                        {stat.activeInquiries > 15 ? (
                                            <Badge variant="destructive">Alta</Badge>
                                        ) : stat.activeInquiries > 5 ? (
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-200">Média</Badge>
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
