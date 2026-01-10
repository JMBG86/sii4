'use client'

import { useState, useEffect } from 'react'
import { ProcessoDetailDialog } from '@/app/sp/processos-crime/detail-dialog'
import { getProcessoById } from '@/app/sp/processos-crime/actions'
import { SPProcessoCrime } from '@/types/database'
import { Loader2 } from 'lucide-react'

interface ProcessoDetailWrapperProps {
    processoId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProcessoDetailWrapper({ processoId, open, onOpenChange }: ProcessoDetailWrapperProps) {
    const [processo, setProcesso] = useState<SPProcessoCrime | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && processoId) {
            setLoading(true)
            getProcessoById(processoId)
                .then(data => {
                    if (data) setProcesso(data)
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false))
        } else {
            setProcesso(null)
        }
    }, [open, processoId])

    if (!open) return null

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">A carregar detalhes...</p>
                </div>
            </div>
        )
    }

    if (!processo) return null

    return (
        <ProcessoDetailDialog
            processo={processo}
            open={open}
            onOpenChange={onOpenChange}
            readOnly={true}
        />
    )
}
