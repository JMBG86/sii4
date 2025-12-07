'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Type-casting here for simplicity since we validate existence below
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        redirect('/login?error=Missing credentials')
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Could not authenticate user')
        // Note: In a real app we might want to return the error to display it better
        // but redirect is simple for now as requested.
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
