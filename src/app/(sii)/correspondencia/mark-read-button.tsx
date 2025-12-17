'use client'

import { Button } from '@/components/ui/button'
import { CheckCheck, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { markAllCorrespondenceAsRead } from './actions'

export function MarkAsReadButton({ hasUnread }: { hasUnread: boolean }) {
    const [loading, setLoading] = useState(false)

    const handleMarkAsRead = async () => {
        setLoading(true)
        await markAllCorrespondenceAsRead()
        setLoading(false)
    }

    if (!hasUnread) return null

    return (
        <Button onClick={handleMarkAsRead} disabled={loading} variant="outline" size="sm">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
            Marcar todas como lidas
        </Button>
    )
}
