'use client'

import { useState, useEffect } from 'react'
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
import { Eye, Plus } from 'lucide-react'
import { InquiryStatus } from '@/types/database'
import { DeleteInquiryButton } from '@/components/inquiry/delete-inquiry-button'
import { useRouter } from 'next/navigation'

export default function InqueritosPage() {
    const [inqueritos, setInqueritos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        async function fetchInqueritos() {
            const supabase = createClient()
            let query = supabase
                .from('inqueritos')
                .select('*')
                .order('created_at', { ascending: false })

            // Apply filters from URL parameters
            const status = searchParams.get('status')
            const classificacao = searchParams.get('classificacao')

            if (status) {
                query = query.eq('estado', status)
            }
            if (classificacao) {
                query = query.eq('classificacao', classificacao)
            }

            const { data } = await query

            setInqueritos(data || [])
            setLoading(false)
        }
        fetchInqueritos()
    }, [searchParams])

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
                            <TableHead>NUIPC</TableHead>
                            <TableHead>Crime</TableHead>
                            <TableHead>Data Ocorrência</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Classificação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inqueritos?.map((inq) => (
                            <TableRow
                                key={inq.id}
                                onClick={() => router.push(`/inqueritos/${inq.id}`)}
                                className="cursor-pointer"
                            >
                                <TableCell className="font-medium">{inq.nuipc}</TableCell>
                                <TableCell>{inq.tipo_crime}</TableCell>
                                <TableCell>
                                    {inq.data_ocorrencia
                                        ? new Date(inq.data_ocorrencia).toLocaleDateString()
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
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Link href={`/inqueritos/${inq.id}`}>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Eye className="h-4 w-4" />
                                                Ver Detalhes
                                            </Button>
                                        </Link>
                                        <DeleteInquiryButton inquiryId={inq.id} nuipc={inq.nuipc} />
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
