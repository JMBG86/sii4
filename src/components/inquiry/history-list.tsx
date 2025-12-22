'use client'

import { createClient } from '@/lib/supabase/client'
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
import { useEffect, useState } from 'react'

export function HistoryList({ inquiry }: { inquiry: any }) {
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!inquiry?.id) return

        async function loadHistory() {
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

            const combined = [...(dbHistory || []), creationEvent].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            setHistory(combined)
            setLoading(false)
        }

        loadHistory()
    }, [inquiry, supabase])

    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>Histórico de Estados</CardTitle></CardHeader>
                <CardContent>A carregar histórico...</CardContent>
            </Card>
        )
    }

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
