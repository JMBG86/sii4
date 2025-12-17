'use client'

import { useEffect, useState } from 'react'
import { getUnassignedInquiries, getUsers, assignInquiry } from './actions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Loader2, UserCheck } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DistribuicaoPage() {
    const [inquiries, setInquiries] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState<string | null>(null) // ID of inquiry being assigned
    const [selectedUser, setSelectedUser] = useState<Record<string, string>>({}) // Map inquiryId -> userId

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [inqs, usrs] = await Promise.all([getUnassignedInquiries(), getUsers()])
        setInquiries(inqs)
        setUsers(usrs)
        setLoading(false)
    }

    const handleAssign = async (inquiryId: string) => {
        const userId = selectedUser[inquiryId]
        if (!userId) return

        setAssigning(inquiryId)
        const res = await assignInquiry(inquiryId, userId)
        if (res?.error) {
            alert('Erro ao atribuir: ' + res.error)
        } else {
            // Remove from list or refresh
            setInquiries(prev => prev.filter(i => i.id !== inquiryId))
        }
        setAssigning(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inquéritos por Distribuir</h1>
                    <p className="text-muted-foreground">Atribuição de inquéritos pendentes a investigadores.</p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    Atualizar Lista
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pendentes ({inquiries.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NUIPC</TableHead>
                                    <TableHead>Tipo Crime</TableHead>
                                    <TableHead>Origem</TableHead>
                                    <TableHead>Denunciados</TableHead>
                                    <TableHead>Data Entrada</TableHead>
                                    <TableHead>Atribuir a</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : inquiries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Não existem inquéritos por distribuir.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    inquiries.map((inq) => (
                                        <TableRow key={inq.id}>
                                            <TableCell className="font-mono font-medium">{inq.nuipc}</TableCell>
                                            <TableCell>{inq.tipo_crime || '-'}</TableCell>
                                            <TableCell>
                                                {inq.observacoes?.includes('[Importado da SP]') ? (
                                                    <Badge variant="secondary">SP (Importado)</Badge>
                                                ) : (
                                                    'Manual'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate text-xs">
                                                    {inq.denunciados?.map((d: any) => d.nome).join(', ') || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>{new Date(inq.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={selectedUser[inq.id] || ''}
                                                    onValueChange={(val) => setSelectedUser(prev => ({ ...prev, [inq.id]: val }))}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {users.map(u => (
                                                            <SelectItem key={u.id} value={u.id}>
                                                                {u.full_name || u.email}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    disabled={!selectedUser[inq.id] || assigning === inq.id}
                                                    onClick={() => handleAssign(inq.id)}
                                                >
                                                    {assigning === inq.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <UserCheck className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
