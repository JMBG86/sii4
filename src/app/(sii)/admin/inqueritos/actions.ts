import { createClient } from '@/lib/supabase/client'

export async function assignInquiries(inquiryIds: string[], targetUserId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check if admin (Double check on client, but RLS is the real guard)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Forbidden' }

    // Perform Update using standard client (relying on RLS)
    const { error } = await supabase
        .from('inqueritos')
        .update({ user_id: targetUserId })
        .in('id', inquiryIds)

    if (error) {
        console.error('Assignment error:', error)
        return { error: error.message }
    }

    return { success: true }
}
