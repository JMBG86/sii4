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
    Search,
    Shield,
    BarChart3,
    Lightbulb,
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
        title: 'Pesquisas',
        href: '/pesquisas',
        icon: Search,
    },
    {
        title: 'Apensações',
        href: '/ligacoes',
        icon: Link2,
    },

    {
        title: 'Relatórios',
        href: '/relatorios',
        icon: FileText,
    },
    {
        title: 'Ofícios',
        href: '/oficios',
        icon: FileText,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [userName, setUserName] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilizador')

                // Check admin role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile?.role === 'admin') {
                    setIsAdmin(true)
                }
            }
        }
        getUser()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        // Force full reload to clear Layout state (Server Components)
        window.location.href = '/login'
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

                    {isAdmin && (
                        <>
                            <div className="my-2 border-t px-2 text-xs font-semibold text-gray-500 pt-2">
                                ADMINISTRAÇÃO
                            </div>
                            <Link
                                href="/admin/users"
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                    pathname === '/admin/users'
                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/50'
                                        : 'text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30'
                                )}
                            >
                                <Shield className="h-4 w-4" />
                                Utilizadores
                            </Link>
                            <Link
                                href="/admin/distribuicao"
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                    pathname === '/admin/distribuicao'
                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/50'
                                        : 'text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30'
                                )}
                            >
                                <ClipboardList className="h-4 w-4" />
                                Inquéritos por Distribuir
                            </Link>
                            <Link
                                href="/admin/oficios"
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                    pathname.startsWith('/admin/oficios')
                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/50'
                                        : 'text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30'
                                )}
                            >
                                <FileText className="h-4 w-4" />
                                Gerir Ofícios
                            </Link>
                            <Link
                                href="/admin/edn"
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                    pathname.startsWith('/admin/edn')
                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/50'
                                        : 'text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30'
                                )}
                            >
                                <BarChart3 className="h-4 w-4" />
                                Estado da Nação
                            </Link>
                        </>
                    )}
                </nav>
            </div>
            <div className="border-t p-4 space-y-2">
                <Link
                    href="/sugestoes"
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary mb-2',
                        pathname === '/sugestoes'
                            ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'
                            : 'text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 dark:text-gray-400 dark:hover:bg-yellow-900/20'
                    )}
                >
                    <Lightbulb className="h-4 w-4" />
                    Sugestões / Bugs
                </Link>
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
