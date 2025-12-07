import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export async function HistoryList({ inquiryId }: { inquiryId: string }) {
    const supabase = await createClient()

    const { data: history } = await supabase
        .from('historico_estados')
        .select('*')
        .eq('inquerito_id', inquiryId)
        .order('data', { ascending: false })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Estados</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Estado Anterior</TableHead>
                            <TableHead>Novo Estado</TableHead>
                            <TableHead>Utilizador</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history?.map((h) => (
                            <TableRow key={h.id}>
                                <TableCell className="text-sm">
                                    {new Date(h.data).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    {h.estado_anterior ? (
                                        <Badge variant="outline">{h.estado_anterior.replace('_', ' ')}</Badge>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{h.estado_novo.replace('_', ' ')}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {h.utilizador || 'Sistema'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {history?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">Sem histórico.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
