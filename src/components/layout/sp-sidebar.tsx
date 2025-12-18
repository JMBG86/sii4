'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import {
    LayoutDashboard,
    FileText,
    Inbox,
    PlusCircle,
    User,
    LogOut,
    Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/sp/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Correspondência',
        href: '/sp/correspondencia',
        icon: Inbox,
    },
    {
        title: 'Mapa de Processos',
        href: '/sp/processos-crime',
        icon: FileText,
    },
    {
        title: 'Pesquisa Global',
        href: '/sp/pesquisa',
        icon: Search,
    },
]

export function SPSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [userName, setUserName] = useState('')

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilizador')
            }
        }
        getUser()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-stone-50 dark:bg-zinc-950">
            <Link href="/sp/dashboard" className="flex flex-col items-center justify-center p-6 border-b hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                {/* Maybe a different logo or color variant in the future */}
                <div className="relative h-24 w-24 mb-3 opacity-90">
                    {/* Temporarily reuse logo but smaller or grayscale? keeping same for now */}
                    <Image
                        src="/LOGO.png"
                        alt="Logo SII"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <span className="text-sm font-bold text-center leading-tight text-emerald-800 dark:text-emerald-400">
                    SECÇÃO DE<br />PROCESSOS
                </span>
            </Link>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-1 px-2">
                    {sidebarItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-emerald-700',
                                pathname === item.href
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                    : 'text-gray-500 hover:bg-stone-100 dark:text-gray-400 dark:hover:bg-zinc-900'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t p-4 space-y-2">
                <Link href="/perfil" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    <User className="h-4 w-4" />
                    {userName}
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </button>
            </div>
        </div>
    )
}
