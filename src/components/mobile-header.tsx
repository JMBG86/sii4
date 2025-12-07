'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function MobileHeader() {
    const [userName, setUserName] = useState('')
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilizador')
            }
        }
        getUser()
    }, [supabase])

    return (
        <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-white px-4 md:hidden dark:bg-gray-950">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <Sidebar />
                </SheetContent>
            </Sheet>
            <div className="flex-1">
                <h1 className="text-sm font-semibold">SII - Gestão de Inquéritos</h1>
            </div>
            <Link href="/perfil" className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{userName}</span>
            </Link>
        </header>
    )
}
