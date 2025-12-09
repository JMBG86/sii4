import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InquiryAssignmentTable } from './assignment-table'

export default async function AdminInquiriesPage() {
    const supabase = await createClient()

    // 1. Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
        return <div>Access Denied</div>
    }

    // 2. Fetch Data
    // We need to fetch ALL inquiries. RLS might block this if we are not careful?
    // Wait, typical RLS policies allow "select" for own rows.
    // Admin needs to see ALL rows.
    // If our current RLS is `auth.uid() = user_id`, then Admin CANNOT see other users' rows with the standard client.
    // We must use Admin Client for this page fetching too?
    // OR we change RLS to allow Admins to Select All.
    // Using Admin Client in Server Component is easier/safer than changing DB policies randomly.

    // BUT createClient in '@/lib/supabase/server' is the standard one.
    // We need a way to fetch all data.
    // Let's implement `getAdminClient` here or assume user is Admin and policies have an exception?
    // Checking `migration_user_isolation.sql`:
    // `create policy "Enable select for users based on user_id" on public.inqueritos for select using (auth.uid() = user_id);`
    // This blocks admins from seeing others.
    // We should probably UPDATE the Policy to allow Admins to see everything. That's the correct architectural fix.
    // "Enable select for users based on user_id OR auth.role() = 'service_role' OR profile.role = 'admin'?"
    // RLS cannot easily join `profiles` inside the policy effectively without performance hit.
    // Standard Supabase way: using claims or just use Service Role in Admin Pages.
    // Since this is a Server Component, checking Admin role and then using Admin Client is fine.

    const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminSupabase = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { persistSession: false } }
    )

    const { data: inquiries } = await adminSupabase
        .from('inqueritos')
        .select('id, nuipc, tipo_crime, estado, user_id')
        .order('created_at', { ascending: false })

    const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Gestão Global de Inquéritos</h1>
            <p className="text-muted-foreground">
                Reatribuição de processos entre militares.
            </p>

            <InquiryAssignmentTable
                inquiries={inquiries || []}
                profiles={profiles || []}
            />
        </div>
    )
}
