import { createClient } from '@/lib/supabase/client'

export async function login(formData: FormData) {
    const supabase = createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const context = formData.get('context') as string // 'sii' | 'sp'

    if (!email || !password) {
        return { error: 'Missing credentials' }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Could not authenticate user' }
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return { error: 'Could not authenticate user' }
    }

    if (context === 'sp') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('access_sp')
            .eq('id', user.id)
            .single()

        if (!profile?.access_sp) {
            await supabase.auth.signOut()
            return { error: 'Unauthorized: Sem acesso à Secção de Processos' }
        }

        return { success: true, redirect: '/sp/dashboard' }
    }

    return { success: true, redirect: '/' }
}
