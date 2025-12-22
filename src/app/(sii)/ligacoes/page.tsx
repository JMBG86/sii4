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
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LigacoesPage() {
    const supabase = createClient()
    const [links, setLinks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const { data } = await supabase
                .from('ligacoes')
                .select(`
                    id, 
                    razao, 
                    created_at,
                    inquerito_a_data:inquerito_a (id, nuipc),
                    inquerito_b_data:inquerito_b (id, nuipc)
                `)
                .order('created_at', { ascending: false })

            if (data) setLinks(data)
            setLoading(false)
        }
        loadData()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Apensações entre Inquéritos</h1>

            <div className="rounded-md border bg-white shadow-sm dark:bg-gray-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Inquérito A</TableHead>
                            <TableHead>Inquérito B</TableHead>
                            <TableHead>Razão</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {links.map((link: any) => (
                            <TableRow key={link.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/inqueritos/detalhe?id=${link.inquerito_a_data?.id}`} className="hover:underline">
                                        {link.inquerito_a_data?.nuipc}
                                    </Link>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link href={`/inqueritos/detalhe?id=${link.inquerito_b_data?.id}`} className="hover:underline">
                                        {link.inquerito_b_data?.nuipc}
                                    </Link>
                                </TableCell>
                                <TableCell>{link.razao}</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    {/* Just showing links to both */}
                                </TableCell>
                            </TableRow>
                        ))}
                        {links.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Nenhuma apensação encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
