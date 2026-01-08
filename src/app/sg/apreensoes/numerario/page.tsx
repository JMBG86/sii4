'use client'

import { useEffect, useState } from 'react'
import { fetchSeizures, updateSeizureStatus } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Edit, CheckCircle, XCircle, Euro } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

export default function NumerarioPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Edit Form State
    const [depositado, setDepositado] = useState(false)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        const res = await fetchSeizures('Numerário')
        setData(res || [])
        setLoading(false)
    }

    function openEdit(item: any) {
        setSelectedItem(item)
        setDepositado(item.remetido || false)
        setIsDialogOpen(true)
    }

    async function handleSave() {
        if (!selectedItem) return

        // If depositado, local = "Banco" (Generic), else "Cofre"
        const local = depositado ? 'Banco/CGD' : 'Cofre'

        await updateSeizureStatus(selectedItem.id, depositado, local)
        setIsDialogOpen(false)
        load()
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">Apreensões de Numerário</h1>
                <p className="text-muted-foreground">Gestão de dinheiro apreendido e depósitos bancários.</p>
            </div>

            <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader><CardTitle>Registos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>NUIPC</TableHead>
                                <TableHead>Numerário</TableHead>
                                <TableHead>Depósito Realizado?</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => {
                                const currency = item.tipo.replace('Numerário: ', '')
                                const value = item.descricao
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono">{item.sp_processos_crime?.nuipc_completo}</TableCell>
                                        <TableCell className="font-medium">
                                            {value} <span className="text-muted-foreground text-sm">{currency}</span>
                                        </TableCell>
                                        <TableCell>
                                            {item.remetido
                                                ? <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Sim</Badge>
                                                : <Badge variant="outline" className="border-amber-500 text-amber-600">Não</Badge>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                                <Edit className="h-4 w-4 text-amber-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">Sem registos de dinheiro apreendido.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerir Depósito</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center space-x-4 border p-4 rounded-lg bg-slate-50 dark:bg-zinc-900">
                            <Euro className="h-8 w-8 text-amber-600" />
                            <div className="flex-1 space-y-1">
                                <Label className="text-base font-semibold">Depósito Bancário Realizado?</Label>
                                <p className="text-sm text-muted-foreground">
                                    Indique se o valor já foi depositado na conta da GNR/Tribunal.
                                </p>
                            </div>
                            <Switch
                                checked={depositado}
                                onCheckedChange={setDepositado}
                            />
                        </div>
                        {depositado ? (
                            <p className="text-sm text-green-600 font-medium text-center animate-in fade-in">
                                O valor será marcado como depositado (Remetido).
                            </p>
                        ) : (
                            <p className="text-sm text-amber-600 font-medium text-center animate-in fade-in">
                                O valor mantém-se em cofre.
                            </p>
                        )}
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
