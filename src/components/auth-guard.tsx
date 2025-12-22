'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // Redirect to login preserving the return url if needed
                // For now simple redirect
                console.log(`[AuthGuard] No session, redirecting from ${pathname}`)
                router.replace('/login')
            } else {
                setAuthorized(true)
            }
            setLoading(false)
        }

        checkAuth()
    }, [pathname, router])

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500 font-medium">A verificar sessão...</p>
                </div>
            </div>
        )
    }

    if (!authorized) {
        return null // Will redirect
    }

    return <>{children}</>
}
