'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return null
    return createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function assignInquiries(inquiryIds: string[], targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check if admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Forbidden' }

    const adminClient = getAdminClient()
    if (!adminClient) return { error: 'Configuration Error' }

    const { error } = await adminClient
        .from('inqueritos')
        .update({ user_id: targetUserId })
        .in('id', inquiryIds)

    if (error) {
        console.error('Assignment error:', error)
        return { error: error.message }
    }

    // Optional: Notify the user?
    // We could add a notification here.

    revalidatePath('/admin/inqueritos')
    revalidatePath('/') // Update dashboard
    return { success: true }
}
