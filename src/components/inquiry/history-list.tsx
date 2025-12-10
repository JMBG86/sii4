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

export async function HistoryList({ inquiry }: { inquiry: any }) {
    const supabase = await createClient()

    const { data: dbHistory } = await supabase
        .from('historico_estados')
        .select('*')
        .eq('inquerito_id', inquiry.id)
        .order('data', { ascending: false })

    // Create initial event
    const creationEvent = {
        id: 'creation',
        data: inquiry.created_at,
        estado_anterior: null,
        estado_novo: 'REGISTADO',
        utilizador: inquiry.profiles?.full_name || 'Sistema'
    }

    // specific sorting: created_at might be older than history
    // We want newest first.
    // So usually creation is LAST in the list (oldest).
    // The user said "primeira entrada", which could mean "top of the list" or "first chronologically".
    // "primeira entrada do momento do registo" suggests Chronological Start.
    // BUT the table is usually ordered Newest -> Oldest.
    // If Creation is "First entry", it means the BOTTOM of the list (Oldest).
    // Wait, "primeira entrada... em que fica logo na primeira opcao de POR INICIAR".
    // If the list is a Timeline, "First" is Top? Or Start?
    // Usually "History" lists latest changes at the top.
    // So Creation should be at the BOTTOM.
    // User says: "deve ter como primeira entrada o momento do registo".
    // "Primeira entrada" usually means "First thing likely to be seen" if it was a chronological log.
    // But if it's "Newest First", then it's the LAST entry.
    // However, maybe the user wants checking the START. 
    // Let's assume standard Reverse Chronological (Newest First), so Creation is at the Bottom.
    // OR does the user want it at the TOP? "First entry"
    // "History of States" -> usually implies chronological order? Or Reverse?
    // Current code: `.order('data', { ascending: false })` -> Reverse Chronological (Newest Top).
    // If I add creation, it should be at the END (Bottom).
    // Unless the user wants to see it First (Top)?
    // "primeira entrada o momento do registo" -> likely means "The initial entry" (chronologically first).
    // I will put it at the END of the array (since array is Descending).

    // Combined list (descending)
    const history = [...(dbHistory || []), creationEvent].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

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
                        {history.map((h) => (
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
                                    <Badge variant={h.id === 'creation' ? 'default' : 'secondary'}>
                                        {h.estado_novo.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {h.utilizador || 'Sistema'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {history.length === 0 && (
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
