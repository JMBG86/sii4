'use client'

import { useEffect, useState } from 'react'
import { fetchSeizures, updateSeizureStatus } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Edit, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function TelemoveisPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Edit Form State
    const [remetido, setRemetido] = useState(false)
    const [local, setLocal] = useState('')
    const [customLocal, setCustomLocal] = useState('')

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        const res = await fetchSeizures('Telemóveis')
        setData(res || [])
        setLoading(false)
    }

    function openEdit(item: any) {
        setSelectedItem(item)
        setRemetido(item.remetido || false)
        // Determine initial local value
        if (item.remetido) {
            if (['DIAP', 'NTP'].includes(item.local_remessa)) {
                setLocal(item.local_remessa)
                setCustomLocal('')
            } else {
                setLocal('Outro')
                setCustomLocal(item.local_remessa || '')
            }
        } else {
            // For "No", it's always custom "Local de Deposito" essentially, but we can have presets if needed
            // For now, treat Local de Deposito as free text usually
            setLocal('Depósito') // Just a dummy trigger
            setCustomLocal(item.local_deposito || '')
        }
        setIsDialogOpen(true)
    }

    async function handleSave() {
        if (!selectedItem) return

        const finalLocal = (remetido && local !== 'Outro') ? local : customLocal

        if (!finalLocal) {
            alert('Indique o local.')
            return
        }

        await updateSeizureStatus(selectedItem.id, remetido, finalLocal)
        setIsDialogOpen(false)
        load()
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">Apreensões de Telemóveis</h1>
                <p className="text-muted-foreground">Listagem e gestão de telemóveis apreendidos.</p>
            </div>

            <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader><CardTitle>Registos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>NUIPC</TableHead>
                                <TableHead>Telemóvel</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead>Remetido?</TableHead>
                                <TableHead>Local</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-mono">{item.sp_processos_crime?.nuipc_completo}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{item.tipo.replace('Material Informático: ', '')}</TableCell>
                                    <TableCell>{item.descricao}</TableCell>
                                    <TableCell>
                                        {item.remetido
                                            ? <Badge className="bg-green-600 hover:bg-green-700">Sim</Badge>
                                            : <Badge variant="outline" className="border-amber-500 text-amber-600">Não</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {item.remetido ? item.local_remessa : (item.local_deposito || '-')}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                            <Edit className="h-4 w-4 text-amber-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && <TableRow><TableCell colSpan={7} className="text-center">Sem registos.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerir Estado de Apreensão</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>O telemóvel foi remetido?</Label>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant={remetido ? 'default' : 'outline'}
                                    className={remetido ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setRemetido(true)}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Sim, Remetido
                                </Button>
                                <Button
                                    type="button"
                                    variant={!remetido ? 'default' : 'outline'}
                                    className={!remetido ? 'bg-amber-600 hover:bg-amber-700' : ''}
                                    onClick={() => setRemetido(false)}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Não, em Depósito
                                </Button>
                            </div>
                        </div>

                        {remetido && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label>Local de Remessa</Label>
                                <Select value={local} onValueChange={(val) => { setLocal(val); if (val !== 'Outro') setCustomLocal(val); else setCustomLocal('') }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DIAP">DIAP</SelectItem>
                                        <SelectItem value="NTP">NTP</SelectItem>
                                        <SelectItem value="Outro">Outro...</SelectItem>
                                    </SelectContent>
                                </Select>
                                {local === 'Outro' && (
                                    <Input
                                        placeholder="Especificar local..."
                                        value={customLocal}
                                        onChange={e => setCustomLocal(e.target.value)}
                                    />
                                )}
                            </div>
                        )}

                        {!remetido && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label>Local de Depósito</Label>
                                <Input
                                    placeholder="Ex: Cofre de Apreensões, Armário 2..."
                                    value={customLocal}
                                    onChange={e => setCustomLocal(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
