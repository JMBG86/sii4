'use client'

import { useEffect, useState } from 'react'
import { fetchSeizures, updateSeizureStatus } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Edit, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function ArmasPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [remetido, setRemetido] = useState(false)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        const res = await fetchSeizures('Armas')
        setData(res || [])
        setLoading(false)
    }

    function openEdit(item: any) {
        setSelectedItem(item)
        setRemetido(item.remetido || false)
        setIsDialogOpen(true)
    }

    async function handleSave() {
        if (!selectedItem) return
        await updateSeizureStatus(selectedItem.id, remetido, remetido ? 'PSP' : 'Cofre')
        setIsDialogOpen(false)
        load()
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">Apreensões de Armas</h1>
                <p className="text-muted-foreground">Listagem de armas apreendidas e controlo de entrega à PSP.</p>
            </div>

            <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader><CardTitle>Registos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Processo</TableHead>
                                <TableHead>Arma / Munição</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead>Remetido PSP?</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-mono">{item.sp_processos_crime?.nuipc_completo}</TableCell>
                                    <TableCell>{item.tipo.replace('Armas: ', '').replace('Munições: ', '').replace('Explosivos: ', '')}</TableCell>
                                    <TableCell>{item.descricao}</TableCell>
                                    <TableCell>
                                        {item.remetido
                                            ? <Badge className="bg-green-600 hover:bg-green-700">Sim</Badge>
                                            : <Badge variant="outline" className="border-amber-500 text-amber-600">Não</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                            <Edit className="h-4 w-4 text-amber-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && <TableRow><TableCell colSpan={6} className="text-center">Sem registos.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerir Entrega PSP</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center space-x-4 border p-4 rounded-lg bg-slate-50 dark:bg-zinc-900">
                            <Crosshair className="h-8 w-8 text-amber-600" />
                            <div className="flex-1 space-y-1">
                                <Label className="text-base font-semibold">Remetido para a PSP?</Label>
                                <p className="text-sm text-muted-foreground">
                                    Armas e munições devem ser remetidas ao Núcleo de Armas e Explosivos da PSP.
                                </p>
                            </div>
                            <Switch
                                checked={remetido}
                                onCheckedChange={setRemetido}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
