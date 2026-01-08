'use client'

import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import InquiryDetailView from '@/components/inquiry/inquiry-detail-view'

function InquiryDetailsContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    if (!id) return <div>Inquérito não especificado.</div>

    return <InquiryDetailView inquiryId={id} />
}

export default function InquiryDetailsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <InquiryDetailsContent />
        </Suspense>
    )
}
