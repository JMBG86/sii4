import { createClient } from '@/lib/supabase/server'
import ProfileClient from './profile-client'

export default async function Page() {
    // Fetch current user data to prepopulate
    // Note: In strict Server Actions we can't easily pass data to the client form inputs 
    // without making them controlled or using defaultValue. 
    // For simplicity, we'll just render the client component. 
    // Enhacement: Fetch user metadata here if needed.

    return <ProfileClient />
}
