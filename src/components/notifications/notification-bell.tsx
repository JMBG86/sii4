'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    message: string
    read: boolean
    link?: string
    created_at: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        let channel: any

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch initial notifications
            const fetchNotifications = async () => {
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
            }
            fetchNotifications()

            // 2. Subscribe to realtime changes
            channel = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newNotif = payload.new as Notification
                        setNotifications(current => {
                            const updated = [newNotif, ...current].slice(0, 10)
                            setUnreadCount(updated.filter(n => !n.read).length)
                            return updated
                        })
                    }
                )
                .subscribe()
        }

        setupRealtime()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [supabase])

    const handleMarkAsRead = async (id: string, link?: string) => {
        // Optimistic update
        setNotifications(current =>
            current.map(n =>
                n.id === id ? { ...n, read: true } : n
            )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))

        // DB Update
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)

        if (link) {
            setIsOpen(false)
            router.push(link)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-gray-950" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    <span className="text-xs text-muted-foreground">{unreadCount} novas</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhuma notificação.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex cursor-pointer flex-col gap-1 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                                        !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                                    )}
                                    onClick={() => handleMarkAsRead(notification.id, notification.link)}
                                >
                                    <p className={cn(
                                        "text-sm",
                                        !notification.read ? "font-medium text-foreground" : "text-muted-foreground"
                                    )}>
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
