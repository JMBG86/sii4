'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { InquiryAssignmentTable } from './assignment-table'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminInquiriesPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [inquiries, setInquiries] = useState<any[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Check Auth & Admin
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.replace('/login')
                    return
                }

                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                if (profile?.role !== 'admin') {
                    setLoading(false)
                    return
                }

                setIsAdmin(true)

                // 2. Fetch Data (Parallel)
                // RLS Policy "Enable select for users and admins" allows admin to see all rows.
                const [inquiriesResult, profilesResult] = await Promise.all([
                    supabase
                        .from('inqueritos')
                        .select('id, nuipc, tipo_crime, estado, user_id')
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('profiles')
                        .select('id, full_name, email')
                        .order('full_name')
                ])

                if (inquiriesResult.data) setInquiries(inquiriesResult.data)
                if (profilesResult.data) setProfiles(profilesResult.data)

            } catch (err) {
                console.error('Error loading admin data:', err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [router, supabase])

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!isAdmin) {
        return <div>Access Denied</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Gestão Global de Inquéritos</h1>
            <p className="text-muted-foreground">
                Reatribuição de processos entre militares.
            </p>

            <InquiryAssignmentTable
                inquiries={inquiries}
                profiles={profiles}
            />
        </div>
    )
}
