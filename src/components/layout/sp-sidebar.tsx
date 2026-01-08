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
    BarChart3,
    AlertOctagon,
    Image as ImageIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/sp/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Mapa de Processos',
        href: '/sp/processos-crime',
        icon: FileText,
    },
    {
        title: 'Inquéritos Externos',
        href: '/sp/inqueritos-externos',
        icon: Inbox,
    },
    {
        title: 'Deprecadas',
        href: '/sp/deprecadas',
        icon: AlertOctagon,
    },
    {
        title: 'Correspondência',
        href: '/sp/correspondencia',
        icon: Inbox,
    },
    {
        title: 'Pesquisa Global',
        href: '/sp/pesquisa',
        icon: Search,
    },

    {
        title: 'Imagens',
        href: '/sp/imagens',
        icon: ImageIcon,
    },
    {
        title: 'Mapas',
        href: '/sp/mapas',
        icon: FileText,
    },
    {
        title: 'Estatísticas',
        href: '/sp/estatisticas',
        icon: BarChart3,
    },
    {
        title: 'CPCJ',
        href: '/sp/cpcj',
        icon: User, // Using User as generic or maybe replace with Baby in component
    },
    {
        title: 'Informações',
        href: '/sp/informacoes',
        icon: FileText,
    },
]

import { getPendingImagesCount } from '@/app/sp/imagens/actions'

export function SPSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [userName, setUserName] = useState('')
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilizador')
            }
        }

        const getCount = async () => {
            const count = await getPendingImagesCount()
            setPendingCount(count)
        }

        getUser()
        getCount()

        // Optional: Interval to refresh count? Or use Realtime? 
        // For now, fetch on mount is enough as per typical request.
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-950">
            <Link href="/sp/dashboard" className="flex flex-col items-center justify-center p-6 border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
                <div className="relative h-36 w-36 mb-4">
                    <Image
                        src="/LOGO.png"
                        alt="Logo SII"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <span className="text-sm font-bold text-center leading-tight">
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
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                pathname === item.href
                                    ? 'bg-gray-100 text-primary dark:bg-gray-800'
                                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1">{item.title}</span>
                            {item.title === 'Imagens' && pendingCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-red-600 animate-in zoom-in">
                                    {pendingCount}
                                </span>
                            )}
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
