'use client'

import { useState } from 'react'
import { addDiligence } from '@/app/inqueritos/actions'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'
import { Diligence } from '@/types/database'

export function DiligenceList({
    inquiryId,
    diligences,
}: {
    inquiryId: string
    diligences: Diligence[]
}) {
    const [showAdd, setShowAdd] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleAdd = async (formData: FormData) => {
        setLoading(true)
        await addDiligence(formData)
        setLoading(false)
        setShowAdd(false)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Diligências</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {showAdd && (
                    <form action={handleAdd} className="space-y-4 rounded-md border p-4 bg-gray-50 dark:bg-gray-800">
                        <input type="hidden" name="inquerito_id" value={inquiryId} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input name="descricao" required placeholder="O que é necessário fazer?" />
                            </div>
                            <div className="space-y-2">
                                <Label>Entidade</Label>
                                <Input name="entidade" placeholder="Ex: Banco, ISP..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Prevista</Label>
                                <Input type="date" name="data_prevista" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar
                            </Button>
                        </div>
                    </form>
                )}

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Entidade</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {diligences.map((d) => (
                            <TableRow key={d.id}>
                                <TableCell>{d.descricao}</TableCell>
                                <TableCell>{d.entidade || '-'}</TableCell>
                                <TableCell>{d.data_prevista ? new Date(d.data_prevista).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={d.estado === 'pendente' ? 'outline' : 'secondary'}>
                                        {d.estado}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {diligences.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">Sem diligências registadas.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
