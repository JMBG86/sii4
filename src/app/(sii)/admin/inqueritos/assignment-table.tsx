'use client'

import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { assignInquiries } from './actions'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Profile {
    id: string
    full_name: string
    email: string
}

interface Inquiry {
    id: string
    nuipc: string
    tipo_crime: string
    estado: string
    user_id: string
}

export function InquiryAssignmentTable({ inquiries, profiles }: { inquiries: Inquiry[], profiles: Profile[] }) {
    const [selected, setSelected] = useState<string[]>([])
    const [targetUser, setTargetUser] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelected(inquiries.map(i => i.id))
        } else {
            setSelected([])
        }
    }

    const handleSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelected(prev => [...prev, id])
        } else {
            setSelected(prev => prev.filter(x => x !== id))
        }
    }

    const handleAssign = async () => {
        if (!targetUser || selected.length === 0) return
        setLoading(true)
        const res = await assignInquiries(selected, targetUser)
        setLoading(false)
        if (res.success) {
            setSelected([])
            router.refresh()
            // Could verify with toast
        } else {
            alert('Erro: ' + res.error)
        }
    }

    // Profiles map for display
    const profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, Profile>)

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-md border dark:bg-gray-800">
                <div className="flex-1 font-medium">
                    {selected.length} inquéritos selecionados
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Atribuir a:</span>
                    <select
                        className="h-9 w-[250px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                    >
                        <option value="">Selecione um militar...</option>
                        {profiles.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.full_name || p.email}
                            </option>
                        ))}
                    </select>
                    <Button
                        onClick={handleAssign}
                        disabled={selected.length === 0 || !targetUser || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Atribuir
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selected.length === inquiries.length && inquiries.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                />
                            </TableHead>
                            <TableHead>NUIPC</TableHead>
                            <TableHead>Crime</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Atribuído a</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inquiries.map((inq) => (
                            <TableRow key={inq.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selected.includes(inq.id)}
                                        onCheckedChange={(checked) => handleSelect(inq.id, !!checked)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{inq.nuipc}</TableCell>
                                <TableCell>{inq.tipo_crime}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{inq.estado}</Badge>
                                </TableCell>
                                <TableCell>
                                    {profilesMap[inq.user_id]?.full_name || profilesMap[inq.user_id]?.email || <span className="text-red-500">Sem Dono</span>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
