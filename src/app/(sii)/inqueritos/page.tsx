'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { InquiryStatus } from '@/types/database'
import { DeleteInquiryButton } from '@/components/inquiry/delete-inquiry-button'
import { useRouter } from 'next/navigation'

function getStatusLabel(status: InquiryStatus): string {
    const labels: Record<InquiryStatus, string> = {
        por_iniciar: 'Por Iniciar',
        em_diligencias: 'Em Diligências',
        aguardando_resposta: 'Aguardando Resposta',
        tribunal: 'Tribunal',
        concluido: 'Concluído',
    }
    return labels[status] || status
}

function getStatusColor(status: InquiryStatus): string {
    const colors: Record<InquiryStatus, string> = {
        por_iniciar: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-0',
        em_diligencias: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-0',
        aguardando_resposta: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0',
        tribunal: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-0',
        concluido: 'bg-green-100 text-green-700 hover:bg-green-200 border-0',
    }
    return colors[status] || ''
}

// ... types and helpers ...

function InqueritosContent() {
    const [inqueritos, setInqueritos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [profilesMap, setProfilesMap] = useState<Record<string, any>>({})

    const fetchInqueritos = useCallback(async () => {
        // ... same logic ...
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        let admin = false
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (profile?.role === 'admin') {
                setIsAdmin(true)
                admin = true
            }
        }

        if (!user) return

        let query = supabase
            .from('inqueritos')
            .select('*')
            .eq('user_id', user.id)

        const status = searchParams.get('status')
        const classificacao = searchParams.get('classificacao')

        if (status) {
            query = query.eq('estado', status)
        }
        if (classificacao) {
            query = query.eq('classificacao', classificacao)
        }

        if (sortConfig) {
            query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
        } else {
            query = query.order('created_at', { ascending: false })
        }

        const { data } = await query
        setInqueritos(data || [])

        if (admin && data && data.length > 0) {
            const userIds = Array.from(new Set(data.map((i: any) => i.user_id).filter(Boolean)))
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', userIds)
                if (profiles) {
                    const map: Record<string, any> = {}
                    profiles.forEach(p => {
                        map[p.id] = p
                    })
                    setProfilesMap(map)
                }
            }
        }
        setLoading(false)
    }, [searchParams, sortConfig])

    useEffect(() => {
        fetchInqueritos()
        const supabase = createClient()
        const channel = supabase
            .channel('inqueritos-list-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inqueritos' }, () => {
                fetchInqueritos()
            })
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchInqueritos])

    function handleSort(key: string) {
        setSortConfig((current) => {
            if (current?.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' }
                return null
            }
            return { key, direction: 'asc' }
        })
    }

    function SortIcon({ column }: { column: string }) {
        if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />
        if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />
        return <ArrowDown className="ml-2 h-4 w-4" />
    }

    if (loading) {
        return <div className="p-6">A carregar...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Inquéritos</h1>
                <Link href="/inqueritos/novo">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Inquérito
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('nuipc')}>
                                <div className="flex items-center">NUIPC <SortIcon column="nuipc" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('tipo_crime')}>
                                <div className="flex items-center">Crime <SortIcon column="tipo_crime" /></div>
                            </TableHead>
                            <TableHead className="w-[110px] cursor-pointer hover:bg-gray-50" onClick={() => handleSort('data_ocorrencia')}>
                                <div className="flex items-center">Data dos Factos <SortIcon column="data_ocorrencia" /></div>
                            </TableHead>
                            <TableHead className="w-[110px] cursor-pointer hover:bg-gray-50" onClick={() => handleSort('data_participacao')}>
                                <div className="flex items-center">Data C. Factos <SortIcon column="data_participacao" /></div>
                            </TableHead>
                            <TableHead className="w-[110px] cursor-pointer hover:bg-gray-50" onClick={() => handleSort('data_atribuicao')}>
                                <div className="flex items-center">Data Atribuição <SortIcon column="data_atribuicao" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('estado')}>
                                <div className="flex items-center">Estado <SortIcon column="estado" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('classificacao')}>
                                <div className="flex items-center">Classificação <SortIcon column="classificacao" /></div>
                            </TableHead>
                            {isAdmin && (
                                <TableHead>Atribuído a</TableHead>
                            )}
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inqueritos?.map((inq) => (
                            <TableRow
                                key={inq.id}
                                onClick={() => router.push(`/inqueritos/${inq.id}`)}
                                className="cursor-pointer hover:bg-gray-50"
                            >
                                <TableCell className="font-medium">{inq.nuipc}</TableCell>
                                <TableCell>{inq.tipo_crime || '-'}</TableCell>
                                <TableCell className="text-sm">
                                    {inq.data_ocorrencia
                                        ? new Date(inq.data_ocorrencia).toLocaleDateString()
                                        : '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {inq.data_participacao
                                        ? new Date(inq.data_participacao).toLocaleDateString()
                                        : '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {inq.data_atribuicao
                                        ? new Date(inq.data_atribuicao).toLocaleDateString()
                                        : '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={`${getStatusColor(
                                            inq.estado as InquiryStatus
                                        )} hover:${getStatusColor(inq.estado as InquiryStatus)}`}
                                    >
                                        {getStatusLabel(inq.estado as InquiryStatus)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {inq.classificacao === 'relevo' && (
                                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-0">Relevo</Badge>
                                    )}
                                    {inq.classificacao === 'normal' && (
                                        <span className="text-muted-foreground text-sm">Normal</span>
                                    )}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell>
                                        {profilesMap[inq.user_id] ? (
                                            <div className="flex flex-col text-xs">
                                                <span className="font-medium">{profilesMap[inq.user_id].full_name || 'Usuário'}</span>
                                                <span className="text-muted-foreground">{profilesMap[inq.user_id].email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                )}
                                <TableCell>
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Link href={`/inqueritos/${inq.id}`}>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Eye className="h-4 w-4" />
                                                Ver Detalhes
                                            </Button>
                                        </Link>
                                        <DeleteInquiryButton inquiryId={inq.id} nuipc={inq.nuipc} onSuccess={fetchInqueritos} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {inqueritos?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Nenhum inquérito encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default function InqueritosPage() {
    return (
        <Suspense fallback={<div className="p-6">A carregar...</div>}>
            <InqueritosContent />
        </Suspense>
    )
}
