'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const ZonesMap = dynamic(
    () => import('./zones-map'),
    {
        ssr: false,
        loading: () => <Skeleton className="w-full h-[600px] rounded-md" />
    }
)

export default ZonesMap
