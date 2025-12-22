'use client'

import { createClient } from '@/lib/supabase/client'
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
import { ChevronLeft, Loader2 } from 'lucide-react'
import { ExportTemplateButton } from '@/components/inquiry/export-template-button'
import { DeleteInquiryButton } from '@/components/inquiry/delete-inquiry-button'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function InquiryDetailsContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const supabase = createClient()

    const [inquiry, setInquiry] = useState<any>(null)
    const [diligences, setDiligences] = useState<any[]>([])
    const [correspondence, setCorrespondence] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadData = async () => {
        if (!id) return
        try {
            // 1. Parallel Fetch: Inquiry, Diligences
            const [
                { data: inquiryData, error: inqError },
                { data: dilData },
            ] = await Promise.all([
                // Inquiry
                supabase.from('inqueritos')
                    .select(`*, profiles:user_id ( full_name )`)
                    .eq('id', id)
                    .single(),
                // Diligences
                supabase.from('diligencias')
                    .select('*')
                    .eq('inquerito_id', id)
                    .order('created_at', { ascending: false }),
            ])

            if (inqError || !inquiryData) {
                setLoading(false)
                return
            }
            setInquiry(inquiryData)
            if (dilData) setDiligences(dilData)

            // 2. Fetch Correspondence (Dependent on NUIPC)
            if (inquiryData.nuipc) {
                const { data: corrData } = await supabase
                    .from('correspondencias')
                    .select('*')
                    .eq('nuipc', inquiryData.nuipc)
                    .order('data_entrada', { ascending: false })

                if (corrData) setCorrespondence(corrData)
            }

        } catch (error) {
            console.error('Error loading inquiry details:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [id])

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!inquiry) {
        return <div>Inquérito não encontrado.</div>
    }

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
                <EditInquiryDialog inquiry={inquiry} onUpdate={loadData} />
                <ExportTemplateButton inquiry={inquiry} />
                <StateUpdateDialog inquiryId={inquiry.id} currentState={inquiry.estado} onUpdate={loadData} />
                <DeleteInquiryButton inquiryId={inquiry.id} nuipc={inquiry.nuipc} redirectTo="/inqueritos" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Data dos Factos</div>
                                <div className="text-sm">{inquiry.data_ocorrencia || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Data de Conhecimento dos Factos</div>
                                <div className="text-sm">{inquiry.data_participacao || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Data de Atribuição</div>
                                <div className="text-sm">{inquiry.data_atribuicao || '-'}</div>
                            </div>
                            {inquiry.numero_oficio && (
                                <div className="col-span-2 md:col-span-1">
                                    <div className="text-sm font-medium text-muted-foreground text-blue-600">Nº Ofício de Saída</div>
                                    <div className="font-bold text-blue-700">{inquiry.numero_oficio}</div>
                                </div>
                            )}
                            {inquiry.destino && (
                                <div className="col-span-2 md:col-span-1">
                                    <div className="text-sm font-medium text-muted-foreground text-blue-600">Destino / Entidade</div>
                                    <div className="font-bold text-blue-700">{inquiry.destino}</div>
                                </div>
                            )}

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
                    {/* <RelatedLinks inquiryId={inquiry.id} links={normalizedLinks} /> */}
                    {/* Correspondence Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Correspondência ({correspondence?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {correspondence && correspondence.length > 0 ? (
                                <div className="space-y-4">
                                    {correspondence.map((c) => (
                                        <div key={c.id} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-sm">{c.assunto}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(c.data_entrada).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">De:</span> {c.origem} <span className="mx-1">|</span>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Ofício:</span> {c.numero_oficio || '-'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sem correspondência registada.</p>
                            )}
                        </CardContent>
                    </Card>
                    <HistoryList inquiry={inquiry} />
                </div>
            </div>
        </div>
    )
}

export default function InquiryDetailsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <InquiryDetailsContent />
        </Suspense>
    )
}
