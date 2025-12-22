'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function AppSwitcher() {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [canSwitch, setCanSwitch] = useState(false)
    const [isSP, setIsSP] = useState(false)

    useEffect(() => {
        const checkAccess = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            // Check profile for admin role and sp access
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, access_sp')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'admin' && profile?.access_sp === true) {
                setCanSwitch(true)
            }

            setLoading(false)
        }

        checkAccess()
    }, [])

    useEffect(() => {
        setIsSP(pathname?.startsWith('/sp') || false)
    }, [pathname])

    const handleSwitch = (checked: boolean) => {
        setIsSP(checked)
        if (checked) {
            router.push('/sp/dashboard')
        } else {
            router.push('/')
        }
    }

    if (loading) return null // Or a small skeleton
    if (!canSwitch) return null

    return (
        <div className="flex items-center gap-2 mr-2">
            <Label htmlFor="app-mode" className={`text-xs font-semibold ${!isSP ? 'text-blue-600' : 'text-gray-400'}`}>
                SII
            </Label>
            <Switch
                id="app-mode"
                checked={isSP}
                onCheckedChange={handleSwitch}
                className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-blue-600"
            />
            <Label htmlFor="app-mode" className={`text-xs font-semibold ${isSP ? 'text-emerald-600' : 'text-gray-400'}`}>
                SP
            </Label>
        </div>
    )
}
