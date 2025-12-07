'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const fullName = formData.get('fullName') as string

    const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
    })

    if (error) {
        return { error: 'Failed to update profile' }
    }

    revalidatePath('/', 'layout')
    return { success: 'Profile updated successfully' }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: 'Failed to update password' }
    }

    return { success: 'Password updated successfully' }
}
