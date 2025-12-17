'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAllCorrespondenceAsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // 1. Get User's Inquiries NUIPCs
    const { data: myInquiries } = await supabase
        .from('inqueritos')
        .select('nuipc')
        .eq('user_id', user.id)

    const myNuipcs = myInquiries?.map(i => i.nuipc).filter(Boolean) || []

    if (myNuipcs.length === 0) return { success: true }

    // 2. Update status
    const { error } = await supabase
        .from('correspondencias')
        .update({ lida: true })
        .in('nuipc', myNuipcs)
        .eq('lida', false)

    if (error) {
        console.error('Error marking as read:', error)
        return { error: 'Failed to mark as read' }
    }

    revalidatePath('/correspondencia')
    revalidatePath('/') // To update sidebar count
    return { success: true }
}
