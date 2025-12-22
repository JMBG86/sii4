'use client'

import { createClient } from '@/lib/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { CreateUserDialog } from './create-user-dialog'
import { EditUserDialog } from './edit-user-dialog'
import { DeleteUserButton } from './delete-user-button'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

// Define Profile type locally or import if available
type Profile = {
    id: string
    email: string
    full_name: string | null
    role: 'user' | 'admin' | string | null
    access_sp: boolean | null
    created_at: string | null
}

export default function AdminUsersPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Check Auth & Admin Role
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.replace('/login')
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile?.role !== 'admin') {
                    setLoading(false)
                    return // Render access denied
                }

                setIsAdmin(true)

                // 2. Fetch Profiles
                const { data: allProfiles, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching profiles:', error)
                } else {
                    setProfiles(allProfiles || [])
                }
            } catch (err) {
                console.error('Unexpected error:', err)
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
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                <p>Você não tem permissão para aceder a esta página.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Administração de Utilizadores</h1>
                <CreateUserDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Utilizadores Registados</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Acesso SP</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell>{profile.email}</TableCell>
                                    <TableCell>{profile.full_name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={profile.role === 'admin' ? 'destructive' : 'secondary'}>
                                            {profile.role?.toUpperCase() || 'USER'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {profile.access_sp && (
                                            <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
                                                SP
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <EditUserDialog user={profile as any} />
                                            <DeleteUserButton userId={profile.id} userName={profile.full_name || profile.email || ''} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {profiles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        Nenhum utilizador encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
