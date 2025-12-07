'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import {
    LayoutDashboard,
    FileText,
    PlusCircle,
    ClipboardList,
    Link2,
    LogOut,
    User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Inquéritos',
        href: '/inqueritos',
        icon: FileText,
    },
    {
        title: 'Adicionar Inquérito',
        href: '/inqueritos/novo',
        icon: PlusCircle,
    },
    {
        title: 'Diligências',
        href: '/diligencias',
        icon: ClipboardList,
    },
    {
        title: 'Ligações',
        href: '/ligacoes',
        icon: Link2,
    },
    {
        title: 'Relatórios',
        href: '/relatorios',
        icon: FileText,
    },
]

export function Sidebar() {
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
        router.push('/login')
    }

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-950">
            <Link href="/" className="flex flex-col items-center justify-center p-6 border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
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
                    SECÇÃO DE INVESTIGAÇÃO<br />E INQUÉRITOS
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
