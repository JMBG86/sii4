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
    Image as ImageIcon,
    Package,
    ChevronDown,
    ChevronRight
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
        title: 'Apreensões',
        href: '#',
        icon: Package,
        submenu: [
            { title: 'Droga', href: '/sp/apreensoes/droga' },
            { title: 'Numerário', href: '/sp/apreensoes/numerario' },
            { title: 'Telemóveis', href: '/sp/apreensoes/telemoveis' },
            { title: 'Armas', href: '/sp/apreensoes/armas' },
            { title: 'Veículos', href: '/sp/apreensoes/veiculos' },
        ]
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
        icon: User,
    },
    {
        title: 'Informações',
        href: '/sp/informacoes',
        icon: FileText,
    },
]

import { getPendingImagesCount } from '@/app/sp/imagens/actions'
import { getSidebarCounts } from '@/features/seizures/actions'

export function SPSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [userName, setUserName] = useState('')
    const [pendingCount, setPendingCount] = useState(0)
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
    const [seizureCounts, setSeizureCounts] = useState({ drugs: 0, cash: 0, phones: 0, weapons: 0 })

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilizador')
            }
        }

        const getCounts = async () => {
            const imgCount = await getPendingImagesCount()
            setPendingCount(imgCount)

            const sCounts = await getSidebarCounts()
            setSeizureCounts(sCounts)
        }

        getUser()
        getCounts()

        const activeItem = sidebarItems.find(item => (item as any).submenu?.some((sub: any) => sub.href === pathname))
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

    const getSeizureCount = (title: string) => {
        if (title === 'Droga') return seizureCounts.drugs
        if (title === 'Numerário') return seizureCounts.cash
        if (title === 'Telemóveis') return seizureCounts.phones
        if (title === 'Armas') return seizureCounts.weapons
        return 0
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
                    {sidebarItems.map((item, index) => {
                        const hasSubmenu = (item as any).submenu && (item as any).submenu.length > 0
                        const isActive = pathname === item.href || (hasSubmenu && (item as any).submenu.some((sub: any) => sub.href === pathname))
                        const isExpanded = expandedMenu === item.title

                        return (
                            <div key={index}>
                                {hasSubmenu ? (
                                    <button
                                        onClick={() => toggleMenu(item.title)}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                            isActive
                                                ? 'bg-gray-100 text-primary dark:bg-gray-800'
                                                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-4 w-4" />
                                            <span className="flex-1 text-left">{item.title}</span>
                                        </div>
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                                            isActive
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
                                )}

                                {hasSubmenu && isExpanded && (
                                    <div className="ml-9 mt-1 grid gap-1 border-l pl-2">
                                        {(item as any).submenu.map((sub: any, subIndex: number) => {
                                            const count = getSeizureCount(sub.title)
                                            return (
                                                <Link
                                                    key={subIndex}
                                                    href={sub.href}
                                                    className={cn(
                                                        'rounded-md px-3 py-1.5 text-xs font-medium transition-all hover:text-primary flex justify-between items-center',
                                                        pathname === sub.href
                                                            ? 'bg-gray-50 text-primary font-bold dark:bg-gray-900'
                                                            : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400'
                                                    )}
                                                >
                                                    <span>{sub.title}</span>
                                                    {count > 0 && sub.title !== 'Veículos' && (
                                                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1 text-[10px] font-bold text-red-600">
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
