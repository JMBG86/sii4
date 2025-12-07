'use client'

import { useState } from 'react'
import { updateProfile, updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
    // We assume the user data is fetched in a parent or passed down, 
    // but for Client Component simplicity we might not have initial data easily without prop drilling or context.
    // For now, let's just show the forms. Ideally we fetch current name client side or pass from server page.

    // Actually, let's make the page Server Component and pass data to a Client Form.
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">O Meu Perfil</h1>

            <ProfileForm />
            <PasswordForm />
        </div>
    )
}

function ProfileForm() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage('')
        const result = await updateProfile(formData)
        setLoading(false)
        if (result?.error) setMessage(result.error)
        if (result?.success) setMessage(result.success)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Atualize o seu nome de exibição.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input name="fullName" placeholder="O seu nome" required />
                    </div>
                    {message && <p className="text-sm text-blue-600">{message}</p>}
                    <Button disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Alterações
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function PasswordForm() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage('')
        const result = await updatePassword(formData)
        setLoading(false)
        if (result?.error) setMessage(result.error)
        if (result?.success) setMessage(result.success)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Alterar a sua palavra-passe.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nova Password</Label>
                        <Input name="password" type="password" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Password</Label>
                        <Input name="confirmPassword" type="password" required />
                    </div>
                    {message && <p className="text-sm text-blue-600">{message}</p>}
                    <Button disabled={loading} variant="outline">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Alterar Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
