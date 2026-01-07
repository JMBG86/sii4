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

        const hasAccess = profile?.access_sp === true || profile?.role === 'admin' || profile?.role === 'sp'

        if (!hasAccess) {
            await supabase.auth.signOut()
            return {
                error: `Unauthorized: Sem acesso à Secção de Processos. (Debug: role=${profile?.role}, access_sp=${profile?.access_sp})`
            }
        }

        return { success: true, redirect: '/sp/dashboard' }
    }

    return { success: true, redirect: '/' }
}
