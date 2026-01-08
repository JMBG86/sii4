'use server'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const context = formData.get('context') as string // 'sii' | 'sp'

    if (!email || !password) {
        return { error: 'Missing credentials' }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (signInError) {
        return { error: 'Could not authenticate user' }
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return { error: 'Could not authenticate user' }
    }

    if (context === 'sp') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, access_sp')
            .eq('id', user.id)
            .single()

        const hasAccess = profile?.access_sp === true || profile?.role === 'admin'

        if (!hasAccess) {
            await supabase.auth.signOut()
            return {
                error: `Unauthorized: Sem acesso à Secção de Processos. (Debug: role=${profile?.role}, access_sp=${profile?.access_sp})`
            }
        }

        return { success: true, redirect: '/sp/dashboard' }
    }

    if (context === 'sg') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, access_sg')
            .eq('id', user.id)
            .single()

        const hasAccess = profile?.access_sg === true || profile?.role === 'admin' || profile?.role === 'sargento'

        if (!hasAccess) {
            await supabase.auth.signOut()
            return {
                error: `Unauthorized: Sem acesso à Secção de Sargentos.`
            }
        }

        return { success: true, redirect: '/sg/dashboard' }
    }

    // Default SII context or no context provided
    // Check for default_app preference
    const { data: profile } = await supabase
        .from('profiles')
        .select('default_app, access_sp, access_sg, role')
        .eq('id', user.id)
        .single()

    // Only redirect if explicitly set AND user has access
    if (profile?.default_app === 'sp' && (profile.access_sp || profile.role === 'admin')) {
        return { success: true, redirect: '/sp/dashboard' }
    }
    if (profile?.default_app === 'sg' && (profile.access_sg || profile.role === 'admin' || profile.role === 'sargento')) {
        return { success: true, redirect: '/sg/dashboard' }
    }

    return { success: true, redirect: '/' }
}
