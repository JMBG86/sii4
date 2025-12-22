'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from 'lucide-react'
import { NotificationsMenu } from '@/components/notifications-menu'
import { AppSwitcher } from '@/components/app-switcher'

export function Header() {
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
        <header className="flex h-14 items-center gap-4 border-b bg-white px-6 dark:bg-gray-950">
            <div className="flex-1">
                <h1 className="text-lg font-semibold">Gestão de Inquéritos</h1>
            </div>
            <div className="flex items-center gap-4">
                <AppSwitcher />
                <NotificationsMenu />
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{userName}</span>
                </div>
            </div>
        </header>
    )
}
