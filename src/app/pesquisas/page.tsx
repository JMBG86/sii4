'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Inquiry, InquiryStatus } from '@/types/database'

export default function SearchPage() {
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<Inquiry[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchTerm.trim()) return

        setLoading(true)
        setHasSearched(true)

        // Search by NUIPC (case insensitive matching if possible, but ILIKE is good)
        const { data, error } = await supabase
            .from('inqueritos')
            .select('*')
            .ilike('nuipc', `%${searchTerm.trim()}%`)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Error searching:', error)
        } else {
            setResults(data || [])
        }

        setLoading(false)
    }

    const getStatusColor = (status: InquiryStatus) => {
        switch (status) {
            case 'por_iniciar': return 'bg-blue-500'
            case 'em_diligencias': return 'bg-yellow-500'
            case 'tribunal': return 'bg-purple-500'
            case 'concluido': return 'bg-green-500'
            case 'aguardando_resposta': return 'bg-orange-500'
            default: return 'bg-gray-500'
        }
    }

    const getStatusLabel = (status: InquiryStatus) => {
        return status.replace('_', ' ').toUpperCase()
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Pesquisas</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Pesquisar por NUIPC</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <Input
                            placeholder="Digite o NUIPC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Pesquisar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {hasSearched && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados ({results.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NUIPC</TableHead>
                                    <TableHead>Tipo de Crime</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Classificação</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((inq) => (
                                    <TableRow key={inq.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <TableCell className="font-medium">
                                            <Link href={`/inqueritos/${inq.id}`} className="block">
                                                {inq.nuipc}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/inqueritos/${inq.id}`} className="block">
                                                {inq.tipo_crime || '-'}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/inqueritos/${inq.id}`} className="block">
                                                <Badge className={getStatusColor(inq.estado)}>
                                                    {getStatusLabel(inq.estado)}
                                                </Badge>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/inqueritos/${inq.id}`} className="block">
                                                {inq.classificacao === 'relevo' && (
                                                    <Badge variant="destructive" className="text-xs">Relevo</Badge>
                                                )}
                                                {inq.classificacao === 'normal' && (
                                                    <span className="text-sm text-gray-500">Normal</span>
                                                )}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/inqueritos/${inq.id}`} className="block">
                                                {new Date(inq.created_at).toLocaleDateString()}
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {results.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            Nenhum inquérito encontrado com este NUIPC.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
