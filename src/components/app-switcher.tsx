'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { LayoutGrid, FileText, Shield, ChevronDown } from 'lucide-react'

export function AppSwitcher() {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)

    // Access Flags
    const [canAccessSP, setCanAccessSP] = useState(false)
    const [canAccessSG, setCanAccessSG] = useState(false)

    // Current Context
    const [currentCode, setCurrentCode] = useState<'SII' | 'SP' | 'SG'>('SII')

    useEffect(() => {
        const checkAccess = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, access_sp, access_sg')
                .eq('id', user.id)
                .single()

            if (profile) {
                const isAdmin = profile.role === 'admin'
                const isSargento = profile.role === 'sargento'

                if (isAdmin || profile.access_sp) setCanAccessSP(true)
                if (isAdmin || isSargento || profile.access_sg) setCanAccessSG(true)
            }
            setLoading(false)
        }

        checkAccess()
    }, [])

    useEffect(() => {
        if (pathname?.startsWith('/sp')) setCurrentCode('SP')
        else if (pathname?.startsWith('/sg')) setCurrentCode('SG')
        else setCurrentCode('SII')
    }, [pathname])

    const handleSwitch = (code: 'SII' | 'SP' | 'SG') => {
        if (code === 'SP') router.push('/sp/dashboard')
        else if (code === 'SG') router.push('/sg/dashboard')
        else router.push('/')
    }

    if (loading) return null

    // If only has SII access (no SP or SG), don't show switcher
    if (!canAccessSP && !canAccessSG) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    {currentCode === 'SII' && <span className="text-blue-600 font-bold">SII</span>}
                    {currentCode === 'SP' && <span className="text-emerald-600 font-bold">SP</span>}
                    {currentCode === 'SG' && <span className="text-amber-600 font-bold">SG</span>}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Módulos</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleSwitch('SII')} className="gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Investigação (SII)</span>
                </DropdownMenuItem>

                {canAccessSP && (
                    <DropdownMenuItem onClick={() => handleSwitch('SP')} className="gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-600" />
                        <span>Secretaria (SP)</span>
                    </DropdownMenuItem>
                )}

                {canAccessSG && (
                    <DropdownMenuItem onClick={() => handleSwitch('SG')} className="gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-600" />
                        <span>Sargentos (SG)</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
