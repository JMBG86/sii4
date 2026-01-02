'use server'

import { createClient } from '@supabase/supabase-js'

// Helper to get Admin Client safely. 
// If key is missing, it will throw or return null inside the action, 
// preventing app crash at startup.
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If key or url is missing, return null so we can handle it in the action
    if (!url || !key) {
        console.error("ADMIN CLIENT ERROR: Missing SUPABASE_URL or SERVICE_ROLE_KEY")
        return null
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function createUser(formData: FormData) {
    const supabaseAdmin = getAdminClient()
    if (!supabaseAdmin) {
        return { error: 'Configuração em falta: SUPABASE_SERVICE_ROLE_KEY não encontrada no servidor.' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const role = formData.get('role') as string
    const access_sp = formData.get('access_sp') === 'on'

    const fullName = `${firstName} ${lastName}`.trim()

    // 1. Create User in Auth
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto confirm
        user_metadata: {
            full_name: fullName
        }
    })

    if (createError) return { error: createError.message }
    if (!user.user) return { error: 'Unknown error creating user' }

    // 2. Update Profile Custom Fields
    // (Trigger might have created the profile row, so we update it)
    // Wait a brief moment or just Upsert
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            role: role,
            access_sp: access_sp,
            full_name: fullName
        })
        .eq('id', user.user.id)

    if (profileError) {
        // Fallback: Try insert if trigger failed or didn't run
        const { error: insertError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.user.id,
                email: email,
                role: role,
                access_sp: access_sp,
                full_name: fullName,
                updated_at: new Date().toISOString()
            })

        if (insertError) return { error: `User created but profile failed: ${insertError.message}` }
    }

    return { success: true }
}

export async function updateUser(userId: string, formData: FormData) {
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as 'user' | 'admin'

    // Admin Client to bypass RLS if needed, or stick to RLS if policy allows "Admins can update anyone"
    // Using Admin Client is safer for "Admin" actions in this context
    const supabaseAdmin = getAdminClient()
    if (!supabaseAdmin) {
        return { error: 'Admin Client unavailable (Check Service Role Key)' }
    }

    const { error } = await supabaseAdmin
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
    const supabaseAdmin = getAdminClient()
    if (!supabaseAdmin) {
        return { error: 'Admin Client unavailable (Check Service Role Key)' }
    }

    // 1. Delete from Auth (Cascade should handle profile, but we can be explicit)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) return { error: error.message }

    return { success: true }
}
