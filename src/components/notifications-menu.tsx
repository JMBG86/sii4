'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Notification } from '@/types/database'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function NotificationsMenu() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Initial fetch
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) {
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.read).length)
            }

            // Realtime Subscription
            const channel = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newNotification = payload.new as Notification
                        setNotifications((prev) => [newNotification, ...prev])
                        setUnreadCount((prev) => prev + 1)
                        // Optional: Play sound or show browser notification here
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        fetchNotifications()
    }, [supabase])

    const handleMarkAsRead = async (notificationId: string, link: string | null) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)

        if (link) {
            setIsOpen(false)
            router.push(link)
        }
    }

    const handleMarkAllRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false)
        }
    }

    const handleClearAll = async () => {
        // Optimistic update
        setNotifications([])
        setUnreadCount(0)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificações</span>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-500" onClick={handleMarkAllRead}>
                                Lidas
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleClearAll}>
                                Limpar
                            </Button>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhuma notificação.
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`cursor-pointer flex flex-col items-start gap-1 p-3 ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                                onClick={() => handleMarkAsRead(notification.id, notification.link)}
                            >
                                <div className="flex w-full items-start justify-between gap-2">
                                    <span className="font-semibold text-sm leading-none">
                                        {notification.title}
                                    </span>
                                    {!notification.read && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </p>
                                <span className="text-[10px] text-muted-foreground pt-1">
                                    {new Date(notification.created_at).toLocaleString('pt-PT')}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
