import { createClient } from '@/lib/supabase/server'
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
import { redirect } from 'next/navigation'
import { CreateUserDialog } from './create-user-dialog'
import { EditUserDialog } from './edit-user-dialog'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // 1. Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserProfile?.role !== 'admin') {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                <p>Você não tem permissão para aceder a esta página.</p>
            </div>
        )
    }

    // 2. Fetch all profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

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
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles?.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell>{profile.email}</TableCell>
                                    <TableCell>{profile.full_name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={profile.role === 'admin' ? 'destructive' : 'secondary'}>
                                            {profile.role?.toUpperCase() || 'USER'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end">
                                            <EditUserDialog user={profile} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {profiles?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
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
