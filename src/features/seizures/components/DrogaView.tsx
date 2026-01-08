'use client'

import { useEffect, useState } from 'react'
import { fetchSeizures, updateDrugStatus } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Edit, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface DrogaViewProps {
    module: 'sg' | 'sp'
}

export function DrogaView({ module }: DrogaViewProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])

    // Edit Logic
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [entregue, setEntregue] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const res = await fetchSeizures('Droga')
            setData(res || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    function openEdit(item: any) {
        // sp_apreensoes_drogas might be an array or object depending on join, assumming object based on previous code
        const drugs = Array.isArray(item.sp_apreensoes_drogas) ? item.sp_apreensoes_drogas[0] : item.sp_apreensoes_drogas

        setSelectedItem({ ...item, sp_apreensoes_drogas: drugs })
        setEntregue(drugs?.entregue_lpc || false)
        setIsDialogOpen(true)
    }

    async function handleSave() {
        if (!selectedItem || !selectedItem.sp_apreensoes_drogas) return
        await updateDrugStatus(selectedItem.sp_apreensoes_drogas.id, entregue)
        setIsDialogOpen(false)
        loadData()
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
                    Apreensões de Estupefacientes {module === 'sp' ? '(SP)' : ''}
                </h1>
                <p className="text-muted-foreground">Listagem e controlo de entrega ao NAT / LPC.</p>
            </div>
            <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader><CardTitle>Registos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Processo</TableHead>
                                <TableHead>Haxixe (g)</TableHead>
                                <TableHead>Cocaína (g)</TableHead>
                                <TableHead>Heroína (g)</TableHead>
                                <TableHead>Outros (g)</TableHead>
                                <TableHead>Plantas</TableHead>
                                <TableHead>Remetido NAT?</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => {
                                const drugs = Array.isArray(item.sp_apreensoes_drogas) ? item.sp_apreensoes_drogas[0] : item.sp_apreensoes_drogas
                                if (!drugs) return null
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>{new Date(item.data_registo).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono">{item.nuipc_completo}</TableCell>
                                        <TableCell className={drugs.cannabis_resina_g ? 'font-bold' : ''}>{drugs.cannabis_resina_g || '-'}</TableCell>
                                        <TableCell className={drugs.cocaina_g ? 'font-bold' : ''}>{drugs.cocaina_g || '-'}</TableCell>
                                        <TableCell className={drugs.heroina_g ? 'font-bold' : ''}>{drugs.heroina_g || '-'}</TableCell>
                                        <TableCell>{drugs.liamba_g || drugs.cannabis_folhas_g || '-'}</TableCell>
                                        <TableCell>{drugs.cannabis_plantas_un || '-'}</TableCell>
                                        <TableCell>
                                            {drugs.entregue_lpc
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
                                )
                            })}
                            {data.length === 0 && <TableRow><TableCell colSpan={9} className="text-center">Sem registos.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerir Envio NAT/LPC</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center space-x-4 border p-4 rounded-lg bg-slate-50 dark:bg-zinc-900">
                            <CheckCircle className="h-8 w-8 text-amber-600" />
                            <div className="flex-1 space-y-1">
                                <Label className="text-base font-semibold">Remetido para NAT / LPC?</Label>
                                <p className="text-sm text-muted-foreground">
                                    Confirmar se o estupefaciente já foi remetido para análise.
                                </p>
                            </div>
                            <Switch
                                checked={entregue}
                                onCheckedChange={setEntregue}
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
