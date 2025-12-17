'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const context = formData.get('context') as string // 'sii' | 'sp'

    if (!email || !password) {
        redirect('/login?error=Missing credentials')
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Could not authenticate user')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect('/login?error=Could not authenticate user')
    }

    if (context === 'sp') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('access_sp')
            .eq('id', user.id)
            .single()

        if (!profile?.access_sp) {
            await supabase.auth.signOut()
            redirect('/login?error=Unauthorized: Sem acesso à Secção de Processos')
        }

        revalidatePath('/', 'layout')
        redirect('/sp/dashboard')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
