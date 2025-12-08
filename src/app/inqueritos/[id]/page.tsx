import { createClient } from '@/lib/supabase/server'
import { InquiryStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StateUpdateDialog } from '@/components/inquiry/state-update-dialog'
import { EditInquiryDialog } from '@/components/inquiry/edit-inquiry-dialog'
import { DiligenceList } from '@/components/inquiry/diligence-list'
import { RelatedLinks } from '@/components/inquiry/related-links'
import { HistoryList } from '@/components/inquiry/history-list'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function InquiryDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch Inquiry Details
    const { data: inquiry, error } = await supabase
        .from('inqueritos')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !inquiry) {
        return <div>Inquérito não encontrado.</div>
    }

    // 2. Fetch Diligences
    const { data: diligences } = await supabase
        .from('diligencias')
        .select('*')
        .eq('inquerito_id', id)
        .order('created_at', { ascending: false })

    // 3. Fetch Links
    const { data: linksA } = await supabase.from('ligacoes').select('*, inqueritos:inquerito_b(id, nuipc)').eq('inquerito_a', id)
    const { data: linksB } = await supabase.from('ligacoes').select('*, inqueritos:inquerito_a(id, nuipc)').eq('inquerito_b', id)

    // Normalize links
    const normalizedLinks = [
        ...(linksA || []).map(l => ({ id: l.id, razao: l.razao, other_id: l.inqueritos.id, other_nuipc: (l.inqueritos as any).nuipc })),
        ...(linksB || []).map(l => ({ id: l.id, razao: l.razao, other_id: l.inqueritos.id, other_nuipc: (l.inqueritos as any).nuipc }))
    ]


    const getStatusColor = (status: InquiryStatus) => {
        switch (status) {
            case 'por_iniciar': return 'bg-blue-500'
            case 'em_diligencias': return 'bg-yellow-500'
            case 'tribunal': return 'bg-purple-500'
            case 'concluido': return 'bg-green-500'
            case 'aguardando_resposta': return 'bg-orange-500'
            default: return 'bg-gray-500'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/inqueritos">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{inquiry.nuipc}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground">{inquiry.tipo_crime}</span>
                        <Badge className={getStatusColor(inquiry.estado as InquiryStatus)}>
                            {inquiry.estado.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {inquiry.classificacao === 'relevo' && <Badge variant="destructive">Relevo</Badge>}
                    </div>
                </div>
                <EditInquiryDialog inquiry={inquiry} />
                <StateUpdateDialog inquiryId={inquiry.id} currentState={inquiry.estado} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Ocorrência</div>
                                <div>{inquiry.data_ocorrencia || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Participação</div>
                                <div>{inquiry.data_participacao || '-'}</div>
                            </div>

                            {/* New Fields */}
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Denunciantes</div>
                                <div className="flex flex-col gap-1 mt-1">
                                    {(inquiry.denunciantes as any[])?.length > 0 ? (
                                        (inquiry.denunciantes as any[]).map((d, i) => (
                                            <div key={i} className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block w-fit">
                                                {d.nome}
                                            </div>
                                        ))
                                    ) : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Denunciados / Suspeitos</div>
                                <div className="flex flex-col gap-1 mt-1">
                                    {(inquiry.denunciados as any[])?.length > 0 ? (
                                        (inquiry.denunciados as any[]).map((d, i) => (
                                            <div key={i} className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block w-fit">
                                                {d.nome}
                                            </div>
                                        ))
                                    ) : '-'}
                                </div>
                            </div>

                            <div className="col-span-2">
                                <div className="text-sm font-medium text-muted-foreground">Observações</div>
                                <p className="text-sm mt-1 whitespace-pre-wrap">{inquiry.observacoes || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <DiligenceList inquiryId={inquiry.id} diligences={diligences || []} />
                </div>

                <div className="space-y-6">
                    <RelatedLinks inquiryId={inquiry.id} links={normalizedLinks} />
                    <HistoryList inquiryId={inquiry.id} />
                </div>
            </div>
        </div>
    )
}
