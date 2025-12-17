'use client'

import { Correspondence } from '@/types/database'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function CorrespondenceDetailDialog({
    correspondence,
    open,
    onOpenChange
}: {
    correspondence: Correspondence | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    if (!correspondence) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Detalhes da Correspondência</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">SRV</Label>
                            <p className="font-medium">{correspondence.srv}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Nº Ofício</Label>
                            <p className="font-medium">{correspondence.numero_oficio}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Data Entrada</Label>
                            <p className="font-medium">{new Date(correspondence.data_entrada).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">NUIPC</Label>
                            <p className="font-medium">
                                {correspondence.nuipc || <span className="text-muted-foreground italic">Não associado</span>}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Origem</Label>
                        <p className="font-medium">{correspondence.origem}</p>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Destino</Label>
                        <div className="pt-1">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-0">
                                {correspondence.destino}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-1 bg-muted/50 p-3 rounded-md">
                        <Label className="text-muted-foreground text-xs mb-1 block">Assunto</Label>
                        <p className="text-sm whitespace-pre-wrap">{correspondence.assunto}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
