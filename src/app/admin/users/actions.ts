'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Helper to get admin client (for auth operations)
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

export async function createUser(formData: FormData) {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as 'user' | 'admin'

    const supabase = await createClient()

    // 1. Check if requester is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    // 2. Create User in Auth (Requires Service Role)
    const supabaseAdmin = getAdminClient()
    if (!supabaseAdmin) {
        return { error: 'Erro de Configuração: SUPABASE_SERVICE_ROLE_KEY em falta. Não é possível criar utilizadores.' }
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: `${firstName} ${lastName}`.trim()
        }
    })

    if (createError) return { error: createError.message }
    if (!newUser.user) return { error: 'Falha ao criar utilizador' }

    // 3. Update Profile with Role (Upsert to ensure role is set correctly)
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: newUser.user.id,
            email: email,
            full_name: `${firstName} ${lastName}`.trim(),
            role: role
        })

    if (profileError) return { error: 'Utilizador criado mas falha ao atualizar perfil: ' + profileError.message }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateUser(userId: string, formData: FormData) {
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as 'user' | 'admin'
    // We cannot easily update email in Auth without re-verification flow or Admin API
    // updating it in Profile only changes display.
    // Let's try to update Profile first.

    const supabase = await createClient()

    // 1. Check if requester is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    // 2. Update Profile using Admin Client to bypass RLS
    const supabaseAdmin = getAdminClient()
    if (!supabaseAdmin) {
        return { error: 'Erro de Configuração: SUPABASE_SERVICE_ROLE_KEY necessário para atualizações.' }
    }

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: fullName,
            role: role
        })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // 1. Check if requester is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    // 2. Delete User using Admin Client
    const supabaseAdmin = getAdminClient()
    if (!supabaseAdmin) {
        return { error: 'Erro de Configuração: SUPABASE_SERVICE_ROLE_KEY necessário para apagar utilizadores.' }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        console.error('Error deleting user:', error)
        return { error: 'Erro ao apagar utilizador: ' + error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
}
