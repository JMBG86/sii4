'use client'

import { useEffect, useState } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types/database'
import { useRouter } from 'next/navigation'
import { BellRing } from 'lucide-react'

export function NewInquiryAlert() {
    const [open, setOpen] = useState(false)
    const [notification, setNotification] = useState<Notification | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const checkForUnread = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check for unread 'assignment' notifications
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'assignment')
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(1)

        if (data && data.length > 0) {
            setNotification(data[0])
            setOpen(true)
        }
    }

    useEffect(() => {
        checkForUnread()

        // Realtime Listener for new Alerts
        const { data: { user } } = supabase.auth.getUser() as any // Async handling in effect is safer, doing simple check here

        // We need user ID for channel subscription.
        const subscribe = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const channel = supabase
                .channel('alert-assignments')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newNotif = payload.new as Notification
                        if (newNotif.type === 'assignment') {
                            setNotification(newNotif)
                            setOpen(true)
                        }
                    }
                )
                .subscribe()

            return channel
        }

        const channelPromise = subscribe()

        return () => {
            channelPromise.then(ch => ch && supabase.removeChannel(ch))
        }
    }, [supabase])

    const handleView = async () => {
        if (!notification) return

        // Mark as read
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notification.id)

        setOpen(false)
        if (notification.link) {
            router.push(notification.link)
        }
    }

    const handleLater = () => {
        setOpen(false)
    }

    if (!notification) return null

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
                        <BellRing className="h-5 w-5" />
                        {notification.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="pt-2 text-base text-foreground">
                        {notification.message}
                    </AlertDialogDescription>
                    <div className="text-xs text-muted-foreground mt-2">
                        Recebido em: {new Date(notification.created_at).toLocaleString('pt-PT')}
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleLater}>Ver mais tarde</AlertDialogCancel>
                    <AlertDialogAction onClick={handleView} className="bg-blue-600 hover:bg-blue-700">
                        Ver Inquérito Agora
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
