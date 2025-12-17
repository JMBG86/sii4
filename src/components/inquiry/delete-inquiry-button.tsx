'use client'

import { useState } from 'react'
import { deleteInquiry } from '@/app/(sii)/inqueritos/actions'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DeleteInquiryButton({ inquiryId, nuipc, onSuccess, redirectTo }: { inquiryId: string, nuipc: string, onSuccess?: () => void, redirectTo?: string }) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        setLoading(true)
        const result = await deleteInquiry(inquiryId)

        if (result?.error) {
            alert(result.error)
            setLoading(false)
        } else {
            // Success path
            setOpen(false)
            setLoading(false)
            if (redirectTo) {
                router.push(redirectTo)
            } else {
                router.refresh() // Force client-side refresh to update the list immediately
            }
            if (onSuccess) onSuccess()
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                    <Trash2 className="h-4 w-4" />
                    Apagar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser revertida. Vai apagar permanentemente o inquérito <strong>{nuipc}</strong> e todas as diligências, apensações e histórico associados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => {
                        e.preventDefault()
                        handleDelete()
                    }} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Apagar Inquérito
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
