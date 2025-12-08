'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileDown } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface WeekOption {
    label: string
    startDate: Date
    endDate: Date
    count: number
}

interface WeeklyReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    weeks: WeekOption[]
    onSelect: (week: WeekOption) => void
    loading: boolean
}

export function WeeklyReportDialog({
    open,
    onOpenChange,
    weeks,
    onSelect,
    loading
}: WeeklyReportDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Selecionar Semana de Produção</DialogTitle>
                    <DialogDescription>
                        Escolha a semana (Sexta a Sexta) para gerar o relatório de produtividade.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                        {weeks.map((week, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border p-3 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                            >
                                <div className="space-y-1">
                                    {week.label && (
                                        <p className="text-xs font-bold text-primary uppercase tracking-wider">
                                            {week.label}
                                        </p>
                                    )}
                                    <p className="text-sm font-medium leading-none">
                                        {format(week.startDate, "dd MMM", { locale: pt })} - {format(week.endDate, "dd MMM", { locale: pt })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {week.count} inquéritos concluídos
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onSelect(week)}
                                    disabled={loading || week.count === 0}
                                    className="gap-2"
                                >
                                    <FileDown className="h-4 w-4" />
                                    Exportar
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
