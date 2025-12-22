'use client'

import { createClient } from '@/lib/supabase/client'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, FileText, Calendar, Building, Hash, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkAsReadButton } from './mark-read-button'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

export default function CorrespondenciaPage() {
    const supabase = createClient()
    const [correspondence, setCorrespondence] = useState<any[]>([])
    const [nuipcToIdMap, setNuipcToIdMap] = useState<Map<string, string>>(new Map())
    const [loading, setLoading] = useState(true)

    // Search & View State
    const [searchTerm, setSearchTerm] = useState('')
    const [viewingItem, setViewingItem] = useState<any>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                // 1. Get User's Inquiries NUIPCs
                const { data: myInquiries } = await supabase
                    .from('inqueritos')
                    .select('nuipc, id')
                    .eq('user_id', user.id)

                const myNuipcs = myInquiries?.map(i => i.nuipc).filter(Boolean) as string[] || []

                // Map for linking back to inquiry details
                const map = new Map<string, string>()
                myInquiries?.forEach(i => {
                    if (i.nuipc) map.set(i.nuipc, i.id)
                })
                setNuipcToIdMap(map)

                if (myNuipcs.length > 0) {
                    // 2. Fetch Correspondence matching these NUIPCs
                    const { data } = await supabase
                        .from('correspondencias')
                        .select('*')
                        .in('nuipc', myNuipcs)
                        .order('data_entrada', { ascending: false })

                    if (data) setCorrespondence(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const hasUnread = correspondence.some(c => !c.lida)

    // Filter Logic
    const filteredCorrespondence = correspondence.filter(c => {
        const searchLower = searchTerm.toLowerCase()
        return (
            (c.assunto && c.assunto.toLowerCase().includes(searchLower)) ||
            (c.origem && c.origem.toLowerCase().includes(searchLower)) ||
            (c.nuipc && c.nuipc.toLowerCase().includes(searchLower)) ||
            (c.numero_oficio && c.numero_oficio.toLowerCase().includes(searchLower))
        )
    })

    const handleRowClick = (item: any) => {
        setViewingItem(item)
        setIsViewDialogOpen(true)
    }

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
                    <div className="relative w-full max-w-sm pt-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar por assunto, origem, ofício..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredCorrespondence.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center">
                            {searchTerm ? 'Nenhum resultado encontrado.' : 'Não existe correspondência associada aos seus inquéritos.'}
                        </p>
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
                                {filteredCorrespondence.map((c) => {
                                    const inquiryId = nuipcToIdMap.get(c.nuipc)
                                    const isUnread = !c.lida
                                    return (
                                        <TableRow
                                            key={c.id}
                                            className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${isUnread ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                                            onClick={() => handleRowClick(c)}
                                        >
                                            <TableCell>
                                                {isUnread && <span className="inline-block w-2 h-2 rounded-full bg-blue-500" title="Não lida" />}
                                            </TableCell>
                                            <TableCell className={isUnread ? 'font-semibold' : ''}>
                                                {c.data_entrada ? format(new Date(c.data_entrada), 'dd/MM/yyyy') : '-'}
                                            </TableCell>
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
                                                    <Link href={`/inqueritos/detalhe?id=${inquiryId}`} onClick={e => e.stopPropagation()}>
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

            {/* Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Correspondência</DialogTitle>
                        <DialogDescription>
                            Recebido a {viewingItem && viewingItem.data_entrada ? format(new Date(viewingItem.data_entrada), 'dd/MM/yyyy') : '-'}
                        </DialogDescription>
                    </DialogHeader>
                    {viewingItem && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Assunto
                                    </h4>
                                    <p className="font-semibold text-lg">{viewingItem.assunto}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                        <Building className="h-4 w-4" /> Origem
                                    </h4>
                                    <p>{viewingItem.origem}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                        <Hash className="h-4 w-4" /> N.º Ofício
                                    </h4>
                                    <p>{viewingItem.numero_oficio || 'Sem número'}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                        <Hash className="h-4 w-4" /> NUIPC
                                    </h4>
                                    <p className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block">
                                        {viewingItem.nuipc}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Data Entrada
                                    </h4>
                                    <p>{viewingItem.data_entrada ? format(new Date(viewingItem.data_entrada), 'dd/MM/yyyy') : '-'}</p>
                                </div>
                            </div>

                            {/* Additional info or link to inquiry */}
                            <div className="flex justify-end pt-4 border-t">
                                {nuipcToIdMap.get(viewingItem.nuipc) && (
                                    <Link href={`/inqueritos/detalhe?id=${nuipcToIdMap.get(viewingItem.nuipc)}`}>
                                        <Button className="gap-2">
                                            <ExternalLink className="h-4 w-4" />
                                            Abrir Processo
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
