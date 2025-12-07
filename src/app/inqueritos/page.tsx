import { createClient } from '@/lib/supabase/server'
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
import { Input } from '@/components/ui/input'
import { Eye, Plus } from 'lucide-react'
import { InquiryStatus } from '@/types/database'
import { ExportDropdown } from '@/components/export-dropdown'
import { DeleteInquiryButton } from '@/components/inquiry/delete-inquiry-button'

export default async function InqueritosPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>
}) {
    const supabase = await createClient()
    const { q, status } = await searchParams
    const query = q || ''
    const statusFilter = status || 'all'

    let dbQuery = supabase
        .from('inqueritos')
        .select('*')
        .order('created_at', { ascending: false })

    if (query) {
        dbQuery = dbQuery.ilike('nuipc', `%${query}%`)
    }

    if (statusFilter !== 'all') {
        dbQuery = dbQuery.eq('estado', statusFilter)
    }

    const { data: inqueritos } = await dbQuery

    const getStatusColor = (status: InquiryStatus) => {
        switch (status) {
            case 'por_iniciar':
                return 'bg-blue-500'
            case 'em_diligencias':
                return 'bg-yellow-500'
            case 'tribunal':
                return 'bg-purple-500'
            case 'concluido':
                return 'bg-green-500'
            case 'aguardando_resposta':
                return 'bg-orange-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getStatusLabel = (status: InquiryStatus) => {
        return status.replace('_', ' ').toUpperCase()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Inquéritos</h1>
                <div className="flex gap-2">
                    <ExportDropdown />
                    <Link href="/inqueritos/novo">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Inquérito
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                <form className="flex flex-1 items-center gap-4">
                    <Input
                        name="q"
                        placeholder="Pesquisar por NUIPC..."
                        defaultValue={query}
                        className="max-w-sm"
                    />
                    <select
                        name="status"
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        defaultValue={statusFilter}
                    >
                        <option value="all">Todos os Estados</option>
                        <option value="por_iniciar">Por Iniciar</option>
                        <option value="em_diligencias">Em Diligências</option>
                        <option value="tribunal">Tribunal</option>
                        <option value="concluido">Concluído</option>
                        <option value="aguardando_resposta">Aguardando Resposta</option>
                    </select>
                    <Button type="submit" variant="secondary">
                        Filtrar
                    </Button>
                </form>
            </div>

            <div className="rounded-md border bg-white shadow-sm dark:bg-gray-900">
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
                            <TableRow key={inq.id}>
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
                                <TableCell className="text-right space-x-2">
                                    <Link href={`/inqueritos/${inq.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <DeleteInquiryButton inquiryId={inq.id} nuipc={inq.nuipc} />
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
