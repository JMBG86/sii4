'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Loader2, Pencil, ArrowUpDown } from 'lucide-react'
import { Correspondence } from '@/types/database'

import { CorrespondenceDetailDialog } from './detail-dialog'
import { EditCorrespondenceDialog } from './edit-dialog'
import { DeleteCorrespondenceButton } from './delete-button'

export default function CorrespondencePage() {
    const [correspondences, setCorrespondences] = useState<Correspondence[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Correspondence; direction: 'asc' | 'desc' } | null>(null)

    // Selection States
    const [selectedView, setSelectedView] = useState<Correspondence | null>(null)
    const [selectedEdit, setSelectedEdit] = useState<Correspondence | null>(null)

    const handleSort = (key: keyof Correspondence) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
            }
            return { key, direction: 'asc' }
        })
    }

    const fetchCorrespondence = useCallback(async () => {
        setLoading(true)
        const supabase = createClient()

        let query = supabase
            .from('correspondencias')
            .select('*')

        // Apply sorting
        if (sortConfig) {
            query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
        } else {
            // Default sort
            query = query.order('created_at', { ascending: false })
        }

        if (searchTerm) {
            query = query.or(`assunto.ilike.%${searchTerm}%,origem.ilike.%${searchTerm}%,numero_oficio.ilike.%${searchTerm}%,srv.ilike.%${searchTerm}%`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching correspondence:', error)
        } else {
            setCorrespondences(data || [])
        }
        setLoading(false)
    }, [searchTerm, sortConfig])

    useEffect(() => {
        fetchCorrespondence()
        const supabase = createClient()
        const channel = supabase
            .channel('correspondencia-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'correspondencias' }, () => {
                fetchCorrespondence()
            })
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchCorrespondence])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Correspondência</h1>
                    <p className="text-muted-foreground">Registo de entrada de ofícios e documentos.</p>
                </div>
                <Link href="/sp/correspondencia/nova">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Entrada
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-2 rounded-md border">
                <Search className="h-4 w-4 text-muted-foreground ml-2" />
                <Input
                    placeholder="Pesquisar por assunto, origem, nº ofício ou SRV..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 focus-visible:ring-0"
                />
            </div>

            <div className="rounded-md border bg-white dark:bg-zinc-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('srv')}>
                                <div className="flex items-center gap-1">
                                    SRV
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('data_entrada')}>
                                <div className="flex items-center gap-1">
                                    Data Entrada
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('numero_oficio')}>
                                <div className="flex items-center gap-1">
                                    Nº Ofício
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('origem')}>
                                <div className="flex items-center gap-1">
                                    Origem
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('assunto')}>
                                <div className="flex items-center gap-1">
                                    Assunto
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('nuipc')}>
                                <div className="flex items-center gap-1">
                                    NUIPC
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('destino')}>
                                <div className="flex items-center gap-1">
                                    Destino
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : correspondences.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    Nenhuma correspondência registada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            correspondences.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800"
                                    onClick={() => setSelectedView(item)}
                                >
                                    <TableCell className="font-medium">{item.srv}</TableCell>
                                    <TableCell>
                                        {new Date(item.data_entrada).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{item.numero_oficio}</TableCell>
                                    <TableCell>{item.origem}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={item.assunto}>
                                        {item.assunto}
                                    </TableCell>
                                    <TableCell>
                                        {item.nuipc ? (
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {item.nuipc}
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 hover:bg-emerald-200">
                                            {item.destino}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-muted"
                                                onClick={() => setSelectedEdit(item)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <DeleteCorrespondenceButton id={item.id} onSuccess={fetchCorrespondence} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CorrespondenceDetailDialog
                correspondence={selectedView}
                open={!!selectedView}
                onOpenChange={(open) => !open && setSelectedView(null)}
            />

            {selectedEdit && (
                <EditCorrespondenceDialog
                    correspondence={selectedEdit}
                    open={!!selectedEdit}
                    onOpenChange={(open) => !open && setSelectedEdit(null)}
                    onSuccess={() => {
                        setSelectedEdit(null)
                        fetchCorrespondence()
                    }}
                />
            )}
        </div>
    )
}
