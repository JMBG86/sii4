'use client'

import { useEffect, useState } from 'react'
import { fetchSeizures } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VehicleDialog } from './VehicleDialog'

interface VeiculosViewProps {
    module: 'sg' | 'sp'
}

export function VeiculosView({ module }: VeiculosViewProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null)

    const handleAdd = () => {
        setSelectedVehicle(null)
        setDialogOpen(true)
    }

    const handleEdit = (vehicle: any) => {
        setSelectedVehicle(vehicle)
        setDialogOpen(true)
    }

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

            <div className="flex justify-end">
                <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Viatura
                </Button>
            </div>

            <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader><CardTitle>Registos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>NUIPC</TableHead>
                                <TableHead>Data NUIPC</TableHead>
                                <TableHead>Matrícula</TableHead>
                                <TableHead>Marca/Modelo</TableHead>
                                <TableHead>Chave?</TableHead>
                                <TableHead>Entregue?</TableHead>
                                <TableHead>Depósito SDTER</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono">{item.nuipc || '-'}</TableCell>
                                    <TableCell>{item.data_nuipc ? new Date(item.data_nuipc).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell className="font-bold">{item.matricula || '-'}</TableCell>
                                    <TableCell>{item.marca_modelo || '-'}</TableCell>
                                    <TableCell>{item.chave_existente ? 'Sim' : 'Não'}</TableCell>
                                    <TableCell>{item.entregue ? 'Sim' : 'Não'}</TableCell>
                                    <TableCell>{item.deposito_sdter ? 'Sim' : 'Não'}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && <TableRow><TableCell colSpan={8} className="text-center">Sem registos.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {dialogOpen && (
                <VehicleDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vehicle={selectedVehicle}
                    onSuccess={load}
                />
            )}
        </div>
    )
}
