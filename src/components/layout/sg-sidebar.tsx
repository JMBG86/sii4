'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import {
    LayoutDashboard,
    Search,
    BarChart3,
    Image as ImageIcon,
    LogOut,
    User,
    ShieldAlert,
    Package
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const sgSidebarItems = [
    {
        title: 'Dashboard',
        href: '/sg/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Imagens',
        href: '/sg/imagens',
        icon: ImageIcon,
    },
    {
        title: 'Apreensões',
        href: '/sg/apreensoes',
        icon: Package,
    },
    {
        title: 'Zonas Quentes',
        href: '/sg/zonas-quentes',
        icon: ShieldAlert,
    },
    {
        title: 'Estatística',
        href: '/sg/estatistica',
        icon: BarChart3,
    },
    {
        title: 'Pesquisa',
        href: '/sg/pesquisa',
        icon: Search,
    },
]

export function SGSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [userName, setUserName] = useState('')

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Sargento')
            }
        }
        getUser()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-amber-50 dark:bg-amber-950/20">
            <Link href="/sg/dashboard" className="flex flex-col items-center justify-center p-6 border-b hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer">
                <div className="relative h-28 w-28 mb-4">
                    <Image
                        src="/LOGO.png"
                        alt="Logo SG"
                        fill
                        className="object-contain opacity-90"
                        priority
                    />
                </div>
                <span className="text-sm font-bold text-center leading-tight text-amber-900 dark:text-amber-100">
                    SECÇÃO DE SARGENTOS<br />(SG)
                </span>
            </Link>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-1 px-2">
                    {sgSidebarItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-amber-900',
                                pathname === item.href
                                    ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                                    : 'text-amber-700/80 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t border-amber-200 dark:border-amber-900 p-4 space-y-2">
                <Link href="/perfil" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40">
                    <User className="h-4 w-4" />
                    {userName}
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </button>
            </div>
        </div>
    )
}
