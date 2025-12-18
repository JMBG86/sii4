import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { MarkAsReadButton } from './mark-read-button'
import { format } from 'date-fns'

export default async function CorrespondenciaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Não autenticado.</div>

    // 1. Get User's Inquiries NUIPCs
    const { data: myInquiries } = await supabase
        .from('inqueritos')
        .select('nuipc, id')
        .eq('user_id', user.id)

    const myNuipcs = myInquiries?.map(i => i.nuipc).filter(Boolean) || []

    // Map for linking back to inquiry details
    const nuipcToIdMap = new Map()
    myInquiries?.forEach(i => nuipcToIdMap.set(i.nuipc, i.id))

    let correspondence: any[] = []

    if (myNuipcs.length > 0) {
        // 2. Fetch Correspondence matching these NUIPCs
        const { data } = await supabase
            .from('correspondencias')
            .select('*')
            .in('nuipc', myNuipcs)
            .order('data_entrada', { ascending: false })

        correspondence = data || []
    }

    const hasUnread = correspondence.some(c => !c.lida)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Minha Correspondência</h1>
                    <p className="text-muted-foreground">Correspondência associada aos meus inquéritos em curso.</p>
                </div>
                <MarkAsReadButton hasUnread={hasUnread} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Entradas Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    {correspondence.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center">Não existe correspondência associada aos seus inquéritos.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Data Entrada</TableHead>
                                    <TableHead>Assunto</TableHead>
                                    <TableHead>Origem</TableHead>
                                    <TableHead>Nº Ofício</TableHead>
                                    <TableHead>NUIPC</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {correspondence.map((c) => {
                                    const inquiryId = nuipcToIdMap.get(c.nuipc)
                                    const isUnread = !c.lida
                                    return (
                                        <TableRow key={c.id} className={isUnread ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}>
                                            <TableCell>
                                                {isUnread && <span className="inline-block w-2 h-2 rounded-full bg-blue-500" title="Não lida" />}
                                            </TableCell>
                                            <TableCell className={isUnread ? 'font-semibold' : ''}>{format(new Date(c.data_entrada), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="font-medium">{c.assunto}</TableCell>
                                            <TableCell>{c.origem}</TableCell>
                                            <TableCell>{c.numero_oficio || '-'}</TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                    {c.nuipc}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {inquiryId && (
                                                    <Link href={`/inqueritos/${inquiryId}`}>
                                                        <Button size="icon" variant="ghost" title="Ver Inquérito">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
