'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const CrimeLocationMap = dynamic(
    () => import('./crime-location-map'),
    {
        ssr: false,
        loading: () => <Skeleton className="w-full h-[400px] rounded-md" />
    }
)

export default CrimeLocationMap
