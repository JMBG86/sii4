'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InquiryStatus } from '@/types/database'

interface InquiryDetailsDialogProps {
    inquiry: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function InquiryDetailsDialog({
    inquiry,
    open,
    onOpenChange
}: InquiryDetailsDialogProps) {
    if (!inquiry) return null

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle className="text-2xl font-bold">{inquiry.nuipc}</DialogTitle>
                        <Badge className={getStatusColor(inquiry.estado as InquiryStatus)}>
                            {inquiry.estado?.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>
                    <DialogDescription>
                        {inquiry.tipo_crime}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Dates */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Ocorrência</h4>
                                <p>{inquiry.data_ocorrencia ? new Date(inquiry.data_ocorrencia).toLocaleDateString() : '-'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Participação</h4>
                                <p>{inquiry.data_participacao ? new Date(inquiry.data_participacao).toLocaleDateString() : '-'}</p>
                            </div>
                        </div>

                        {/* Assignee & Classification */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Atribuído a</h4>
                                <p className="font-semibold">{inquiry.profiles?.full_name || 'Sem Dono'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Classificação</h4>
                                {inquiry.classificacao === 'relevo' ? (
                                    <Badge variant="destructive">Relevo</Badge>
                                ) : (
                                    <span>Normal</span>
                                )}
                            </div>
                        </div>

                        {/* Denunciantes */}
                        <div className="col-span-2 md:col-span-1">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Denunciantes</h4>
                            <div className="flex flex-wrap gap-2">
                                {(inquiry.denunciantes as any[])?.length > 0 ? (
                                    (inquiry.denunciantes as any[]).map((d, i) => (
                                        <div key={i} className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                                            {d.nome}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </div>
                        </div>

                        {/* Denunciados */}
                        <div className="col-span-2 md:col-span-1">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Denunciados / Suspeitos</h4>
                            <div className="flex flex-wrap gap-2">
                                {(inquiry.denunciados as any[])?.length > 0 ? (
                                    (inquiry.denunciados as any[]).map((d, i) => (
                                        <div key={i} className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                                            {d.nome}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </div>
                        </div>

                        {/* Obs */}
                        <div className="col-span-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Observações</h4>
                            <div className="mt-1 rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                                {inquiry.observacoes || 'Sem observações.'}
                            </div>
                        </div>

                        {/* Conclusão Details */}
                        {(inquiry.data_conclusao || inquiry.numero_oficio || inquiry.destino) && (
                            <div className="col-span-2 bg-green-50 dark:bg-green-950 p-4 rounded-md border border-green-100 dark:border-green-900 mt-2">
                                <h4 className="text-sm font-semibold text-green-800 dark:text-green-100 mb-3 flex items-center gap-2">
                                    Dados de Conclusão
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <h5 className="text-xs font-medium text-green-700 dark:text-green-300">Data Conclusão</h5>
                                        <p className="text-sm font-medium">{inquiry.data_conclusao ? new Date(inquiry.data_conclusao).toLocaleDateString() : '-'}</p>
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-medium text-green-700 dark:text-green-300">Ofício Nº</h5>
                                        <p className="text-sm font-medium">{inquiry.numero_oficio || '-'}</p>
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-medium text-green-700 dark:text-green-300">Destino</h5>
                                        <p className="text-sm font-medium">{inquiry.destino || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
