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
        href: '#', // Not a direct link
        icon: Package,
        submenu: [
            { title: 'Droga', href: '/sg/apreensoes/droga' },
            { title: 'Numerário', href: '/sg/apreensoes/numerario' },
            { title: 'Telemóveis', href: '/sg/apreensoes/telemoveis' },
            { title: 'Armas', href: '/sg/apreensoes/armas' },
            { title: 'Veículos', href: '/sg/apreensoes/veiculos' },
        ]
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

import { ChevronDown, ChevronRight } from 'lucide-react'

import { getSidebarCounts } from '@/features/seizures/actions'

export function SGSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [userName, setUserName] = useState('')
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
    const [counts, setCounts] = useState({ drugs: 0, cash: 0, phones: 0, weapons: 0 })

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Sargento')
            }
        }
        getUser()

        // Fetch counts
        getSidebarCounts().then(setCounts).catch(console.error)

        // Auto-expand if current page is in submenu
        const activeItem = sgSidebarItems.find(item => item.submenu?.some(sub => sub.href === pathname))
        if (activeItem) {
            setExpandedMenu(activeItem.title)
        }

    }, [supabase, pathname])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const toggleMenu = (title: string) => {
        setExpandedMenu(expandedMenu === title ? null : title)
    }

    // Helper to get count by title
    const getCount = (title: string) => {
        if (title === 'Droga') return counts.drugs
        if (title === 'Numerário') return counts.cash
        if (title === 'Telemóveis') return counts.phones
        if (title === 'Armas') return counts.weapons
        return 0
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
                    {sgSidebarItems.map((item, index) => {
                        const isActive = pathname === item.href || item.submenu?.some(sub => sub.href === pathname)
                        const isExpanded = expandedMenu === item.title

                        return (
                            <div key={index}>
                                {item.submenu ? (
                                    <button
                                        onClick={() => toggleMenu(item.title)}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-amber-900',
                                            isActive
                                                ? 'bg-amber-200/50 text-amber-900 dark:bg-amber-800/50 dark:text-amber-100'
                                                : 'text-amber-700/80 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-4 w-4" />
                                            {item.title}
                                        </div>
                                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-amber-900',
                                            isActive
                                                ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                                                : 'text-amber-700/80 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                )}

                                {item.submenu && isExpanded && (
                                    <div className="ml-9 mt-1 grid gap-1 border-l border-amber-200 pl-2">
                                        {item.submenu.map((sub, subIndex) => {
                                            const count = getCount(sub.title)
                                            return (
                                                <Link
                                                    key={subIndex}
                                                    href={sub.href}
                                                    className={cn(
                                                        'rounded-md px-3 py-1.5 text-xs font-medium transition-all hover:text-amber-900 flex justify-between items-center',
                                                        pathname === sub.href
                                                            ? 'bg-amber-100 text-amber-900 font-bold'
                                                            : 'text-amber-600 hover:bg-amber-50'
                                                    )}
                                                >
                                                    <span>{sub.title}</span>
                                                    {count > 0 && sub.title !== 'Veículos' && ( // Explicit exclude Veiculos per user request
                                                        <span className="text-[10px] items-center justify-center flex h-5 min-w-[20px] rounded-full bg-red-100 px-1 text-red-600 font-bold">
                                                            {count}
                                                        </span>
                                                    )}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
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

