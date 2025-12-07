import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateDiligenceDialog } from '@/components/diligence/create-diligence-dialog'
import { Inquiry } from '@/types/database'

export default async function DiligenciasPage() {
    const supabase = await createClient()

    // Fetch diligences
    const { data: diligences } = await supabase
        .from('diligencias')
        .select('*, inqueritos(id, nuipc)')
        .order('data_prevista', { ascending: true })

    // Fetch active inquiries for the selection list
    const { data: inquiries } = await supabase
        .from('inqueritos')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Gestão de Diligências</h1>
                <CreateDiligenceDialog inquiries={inquiries as Inquiry[] || []} />
            </div>

            <Tabs defaultValue="pendentes" className="w-full">
                <TabsList>
                    <TabsTrigger value="pendentes">Tarefas Pendentes</TabsTrigger>
                    <TabsTrigger value="inqueritos">Por Inquérito</TabsTrigger>
                </TabsList>

                <TabsContent value="pendentes" className="space-y-4">
                    <div className="rounded-md border bg-white shadow-sm dark:bg-gray-900">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NUIPC</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Entidade</TableHead>
                                    <TableHead>Data Enviado</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {diligences?.map((d) => (
                                    <TableRow key={d.id}>
                                        <TableCell className="font-medium">{(d.inqueritos as any)?.nuipc}</TableCell>
                                        <TableCell>
                                            {d.tipo ? (
                                                <Badge variant="outline" className="capitalize">{d.tipo.replace('_', ' ')}</Badge>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>{d.descricao}</TableCell>
                                        <TableCell>{d.entidade || '-'}</TableCell>
                                        <TableCell>
                                            {d.data_prevista ? new Date(d.data_prevista).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={d.estado === 'pendente' ? 'outline' : 'secondary'}>
                                                {d.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/inqueritos/${(d.inqueritos as any)?.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {diligences?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            Nenhuma diligência encontrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="inqueritos">
                    <div className="rounded-md border bg-white shadow-sm dark:bg-gray-900">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NUIPC</TableHead>
                                    <TableHead>Crime</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inquiries?.map((inq) => (
                                    <TableRow key={inq.id}>
                                        <TableCell className="font-medium">{inq.nuipc}</TableCell>
                                        <TableCell>{inq.tipo_crime}</TableCell>
                                        <TableCell><Badge variant="outline">{inq.estado.replace('_', ' ')}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <CreateDiligenceDialog inquiries={inquiries as Inquiry[]} preSelectedInquiryId={inq.id} />
                                                <Link href={`/inqueritos/${inq.id}`}>
                                                    <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
