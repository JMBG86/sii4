'use client'

import { Button } from '@/components/ui/button'
import { CheckCheck, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner' // Assuming sonner is used, if not we'll use a simple approach or adjust later.
// Note: If 'sonner' or specific toast is not installed, we can rely on state change for feedback.

export function ClientCopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
            {copied ? (
                <CheckCheck className="h-4 w-4 text-green-500" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copiar</span>
        </Button>
    )
}
