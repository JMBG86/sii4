'use client'

import { useState } from 'react'
import { Diligence } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { addDiligence } from '@/app/(sii)/inqueritos/actions'
import { DiligenceDetailDialog } from './diligence-detail-dialog'
import { createClient } from '@/lib/supabase/client' // client component 
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'


interface DiligenceListProps {
    diligences: Diligence[]
    inquiryId: string
    onUpdate?: () => void
}

export function DiligenceList({ diligences, inquiryId, onUpdate }: DiligenceListProps) {
    const [diligencesList, setDiligencesList] = useState(diligences)
    const [showAdd, setShowAdd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedDiligence, setSelectedDiligence] = useState<Diligence | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const supabase = createClient()
    const router = useRouter() // Re-use router for potential refresh triggers if needed, but we handle local state

    useEffect(() => {
        setDiligencesList(diligences)
    }, [diligences])

    useEffect(() => {
        const channel = supabase
            .channel(`diligences-realtime-${inquiryId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'diligencias',
                    filter: `inquerito_id=eq.${inquiryId}`
                },
                async () => {
                    // Optimistic or Fetch? Fetch is safer for order and calculated fields
                    // Since this component gets data from props (Server Component parent), 
                    // we can either re-fetch locally or refresh router.
                    // Refreshing router is easiest way to keep sync with parent SC.
                    router.refresh()
                    // Call onUpdate if provided to let parent re-fetch data (for Client Component parents)
                    if (onUpdate) onUpdate()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, inquiryId, router, onUpdate])

    const handleAdd = async (formData: FormData) => {
        setLoading(true)
        const result = await addDiligence(formData)

        if (result?.error) {
            alert(result.error) // Simple alert for now
        } else {
            setShowAdd(false)
            if (onUpdate) {
                // Short timeout to ensure DB propagation
                setTimeout(() => onUpdate(), 100)
            }
        }

        setLoading(false)
    }

    const handleRowClick = (diligence: Diligence) => {
        setSelectedDiligence(diligence)
        setDialogOpen(true)
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Diligências</CardTitle>
                    <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                        onClick={() => setShowAdd(!showAdd)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Diligência
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {showAdd && (
                        <form action={handleAdd} className="space-y-4 rounded-md border p-4 bg-gray-50 dark:bg-gray-800">
                            <input type="hidden" name="inquerito_id" value={inquiryId} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Descrição *</Label>
                                    <Input name="descricao" required placeholder="O que é necessário fazer?" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Entidade</Label>
                                    <Input name="entidade" placeholder="Ex: Banco, ISP..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Enviado</Label>
                                    <Input type="date" name="data_enviado" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status *</Label>
                                    <select
                                        name="status"
                                        defaultValue="a_realizar"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="a_realizar">A Realizar</option>
                                        <option value="enviado_aguardar">Enviado e a Aguardar</option>
                                        <option value="realizado">Realizado</option>
                                    </select>
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
                                <TableHead>Data Enviado</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {diligencesList.map((d) => (
                                <TableRow
                                    key={d.id}
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleRowClick(d)}
                                >
                                    <TableCell>{d.descricao}</TableCell>
                                    <TableCell>{d.entidade || '-'}</TableCell>
                                    <TableCell>{d.data_enviado ? new Date(d.data_enviado).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={d.status === 'realizado' ? 'default' : d.status === 'enviado_aguardar' ? 'secondary' : 'outline'}>
                                            {d.status === 'realizado' ? 'Realizado' : d.status === 'enviado_aguardar' ? 'Enviado e a Aguardar' : 'A Realizar'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {diligencesList.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">Sem diligências registadas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DiligenceDetailDialog
                diligence={selectedDiligence}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                inquiryId={inquiryId}
                onUpdate={onUpdate}
            />
        </>
    )
}
