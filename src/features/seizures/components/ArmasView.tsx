'use client'

import { useEffect, useState, useMemo } from 'react'
import { fetchSeizures, updateSeizureStatus } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Edit, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface ArmasViewProps {
    module: 'sg' | 'sp'
}

export function ArmasView({ module }: ArmasViewProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [destino, setDestino] = useState<string>('cofre')
    const [customDestino, setCustomDestino] = useState('')

    // Derive used destinations from data for the "Saved for Future" requirement
    const availableDestinations = useMemo(() => {
        const standard = ['PSP', 'NAT', 'DIAP']
        const used = new Set<string>()
        data.forEach(d => {
            if (d.remetido && d.local_remessa) {
                const loc = d.local_remessa.trim().toUpperCase()
                if (!standard.includes(loc) && loc.length > 0) {
                    used.add(loc)
                }
            }
        })
        return [...standard, ...Array.from(used)].sort()
    }, [data])

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        try {
            const res = await fetchSeizures('Armas')
            setData(res || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    function openEdit(item: any) {
        setSelectedItem(item)
        setCustomDestino('')

        if (!item.remetido) {
            setDestino('cofre')
        } else {
            const local = item.local_remessa?.trim().toUpperCase() || 'PSP'
            if (availableDestinations.includes(local)) {
                setDestino(local)
            } else {
                setDestino('outro')
                setCustomDestino(item.local_remessa?.trim() || '') // Use original case for input
            }
        }
        setIsDialogOpen(true)
    }

    async function handleSave() {
        if (!selectedItem) return

        try {
            let remetido = false
            let local = 'Cofre'

            if (destino !== 'cofre') {
                remetido = true
                if (destino === 'outro') {
                    if (!customDestino.trim()) {
                        alert('Por favor indique o nome do destino.')
                        return
                    }
                    local = customDestino.trim().toUpperCase()
                } else {
                    local = destino
                }
            }

            await updateSeizureStatus(selectedItem.id, remetido, local)
            setIsDialogOpen(false)
            load()
        } catch (error) {
            console.error(error)
            alert('Erro ao guardar alterações.')
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
                    Apreensões de Armas {module === 'sp' ? '(SP)' : ''}
                </h1>
                <p className="text-muted-foreground">Listagem de armas apreendidas e controlo de entrega.</p>
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
                                <TableHead>Estado / Destino</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => {
                                let badge = <Badge variant="outline" className="border-amber-500 text-amber-600">Em Cofre</Badge>
                                if (item.remetido) {
                                    const dest = item.local_remessa?.trim().toUpperCase() || 'PSP'
                                    if (dest === 'NAT') badge = <Badge className="bg-blue-600 hover:bg-blue-700">NAT</Badge>
                                    else if (dest === 'PSP') badge = <Badge className="bg-green-600 hover:bg-green-700">PSP</Badge>
                                    else if (dest === 'DIAP') badge = <Badge className="bg-orange-500 hover:bg-orange-600">DIAP</Badge>
                                    else badge = <Badge className="bg-gray-600 hover:bg-gray-700">{item.local_remessa}</Badge>
                                }
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono">{item.sp_processos_crime?.nuipc_completo}</TableCell>
                                        <TableCell>{item.tipo.replace(/: /g, ' > ')}</TableCell>
                                        <TableCell>{item.descricao}</TableCell>
                                        <TableCell>{badge}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                                <Edit className="h-4 w-4 text-amber-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {data.length === 0 && <TableRow><TableCell colSpan={6} className="text-center">Sem registos.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerir Destino da Arma</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-zinc-900">
                            <div className="flex items-center space-x-4">
                                <Crosshair className="h-8 w-8 text-amber-600" />
                                <div className="flex-1 space-y-1">
                                    <Label className="text-base font-semibold">Destino</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Selecione o destino ou mantenha em cofre.
                                    </p>
                                </div>
                                <div className="w-[200px]">
                                    <Select value={destino} onValueChange={setDestino}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cofre">Em Cofre</SelectItem>
                                            {availableDestinations.map(dest => (
                                                <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                                            ))}
                                            <SelectItem value="outro">+ Novo Destino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {destino === 'outro' && (
                                <div className="pl-[52px]">
                                    <Label className="mb-2 block text-xs">Nome do Destino</Label>
                                    <Input
                                        placeholder="Ex: Tribunal de Portimão"
                                        value={customDestino}
                                        onChange={(e) => setCustomDestino(e.target.value)}
                                        className="bg-white dark:bg-black"
                                    />
                                </div>
                            )}
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
