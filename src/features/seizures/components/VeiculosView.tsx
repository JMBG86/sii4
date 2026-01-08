'use client'

import { useEffect, useState } from 'react'
import { fetchSeizures } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2 } from 'lucide-react'

interface VeiculosViewProps {
    module: 'sg' | 'sp'
}

export function VeiculosView({ module }: VeiculosViewProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        load()
    }, [])

    async function load() {
        const res = await fetchSeizures('Veículos')
        setData(res || [])
        setLoading(false)
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
                    Apreensões de Veículos {module === 'sp' ? '(SP)' : ''}
                </h1>
                <p className="text-muted-foreground">Listagem de viaturas apreendidas.</p>
            </div>
            <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader><CardTitle>Registos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Processo</TableHead>
                                <TableHead>Descrição</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-mono">{item.sp_processos_crime?.nuipc_completo}</TableCell>
                                    <TableCell>{item.descricao}</TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">Sem registos.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
