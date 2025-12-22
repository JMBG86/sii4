import { createClient } from '@/lib/supabase/client'

export async function createUser(formData: FormData) {
    // Cannot allow User Creation in Static Export without Edge Functions (requires Service Role)
    console.error("Create User is not supported in Static Export mode without a backend.")
    return { error: 'Funcionalidade indisponível em modo estático (requer Edge Functions). Use o Dashboard do Supabase.' }
}

export async function updateUser(userId: string, formData: FormData) {
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as 'user' | 'admin'
    // We cannot easily update email in Auth without re-verification flow or Admin API
    // updating it in Profile only changes display.

    const supabase = createClient()

    // 1. Check if requester is admin (Client side check + RLS)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    // 2. Update Profile using Standard Client (RLS must allow Admin to update profiles)
    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            role: role,
            access_sp: formData.get('access_sp') === 'on'
        })
        .eq('id', userId)

    if (error) return { error: error.message }

    return { success: true }
}

export async function deleteUser(userId: string) {
    // Cannot allow User Deletion in Static Export
    console.error("Delete User is not supported in Static Export mode.")
    return { error: 'Funcionalidade indisponível em modo estático (requer Edge Functions).' }
}
