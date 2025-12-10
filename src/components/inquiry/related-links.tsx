'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Link2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// We handle this one client-side for "search" interactivity or just simple ID input
// For simplicity, we'll ask for exact NUIPC or ID, 
// but wait, requirements say "Selecionar outro inquérito".
// Implementing a search dropdown is best, but simple Input with NUIPC is faster for V1.
// Let's do a simple implementation: Input the UUID or NUIPC of the other inquiry.
// Actually, inputting UUID is hard. Inputting NUIPC is better.

export function RelatedLinks({
    inquiryId,
    links,
}: {
    inquiryId: string
    links: any[] // We pass the joined data
}) {
    const [targetNuipc, setTargetNuipc] = useState('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleLink = async () => {
        setLoading(true)
        setMsg('')

        // 1. Find the target inquiry
        const { data: target, error: searchError } = await supabase
            .from('inqueritos')
            .select('id')
            .eq('nuipc', targetNuipc)
            .single()

        if (searchError || !target) {
            setMsg('Inquérito não encontrado com esse NUIPC.')
            setLoading(false)
            return
        }

        if (target.id === inquiryId) {
            setMsg('Não pode ligar a si próprio.')
            setLoading(false)
            return
        }

        // 2. Create link
        const { error: linkError } = await supabase.from('ligacoes').insert({
            inquerito_a: inquiryId,
            inquerito_b: target.id,
            razao: reason
        })

        if (linkError) {
            setMsg('Erro ao criar ligação (verifique se já existe).')
        } else {
            setMsg('Ligação criada com sucesso.')
            setTargetNuipc('')
            setReason('')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Apensações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-sm font-medium">Adicionar Ligação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>NUIPC do Inquérito Relacionado</Label>
                            <Input
                                value={targetNuipc}
                                onChange={(e) => setTargetNuipc(e.target.value)}
                                placeholder="Ex: 123/24..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Razão</Label>
                            <Input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Motivo da conexão..."
                            />
                        </div>
                    </div>
                    {msg && <div className="text-sm text-blue-600">{msg}</div>}
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleLink} disabled={loading || !targetNuipc}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ligar
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    {links.map((link) => {
                        // Determine which side is the "other"
                        const other = link.inqueritos_b // Assuming we fetch this way or similar
                        // Wait, joins are tricky. 
                        // If we fetch links where (a=id OR b=id), we get mixed results.
                        // Let's assume the parent component standardizes the "other" object for us.
                        return (
                            <div key={link.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex flex-col">
                                    <span className="font-semibold">{link.other_nuipc}</span>
                                    <span className="text-xs text-muted-foreground">{link.razao}</span>
                                </div>
                                <Link href={`/inqueritos/${link.other_id}`}>
                                    <Button variant="ghost" size="icon">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )
                    })}
                    {links.length === 0 && <div className="text-sm text-muted-foreground text-center">Nenhuma ligação.</div>}
                </div>
            </CardContent>
        </Card>
    )
}
