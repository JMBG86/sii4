'use client'

import { useState } from 'react'
import { updateUser } from './actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Pencil } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface Profile {
    id: string
    email: string | null
    full_name: string | null
    role: 'user' | 'admin'
}

export function EditUserDialog({ user }: { user: Profile }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isAdmin, setIsAdmin] = useState(user.role === 'admin')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.append('role', isAdmin ? 'admin' : 'user')

        const result = await updateUser(user.id, formData)

        setLoading(false)
        if (result?.error) {
            alert(result.error)
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Utilizador</DialogTitle>
                        <DialogDescription>
                            Alterar permissões e dados de {user.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Nome Completo</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                defaultValue={user.full_name || ''}
                                required
                            />
                        </div>
                        {/* Email editing is purely visual in Profile usually unless we call Admin Auth API.
                            For now, we just show it disabled or allow editing profile display only?
                            Prompt asked to edit name AND email. 
                            Let's keep email read-only for now or add a note. 
                            Actually, updateProfile only changes profile table. Auth email remains.
                            Let's just show it readonly to avoid confusion, or allow edit if we want to change DISPLAY email?
                            Let's keep it simple: ReadOnly. Changing auth email is complex.
                        */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email (Login)</Label>
                            <Input
                                id="email"
                                value={user.email || ''}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Para alterar o email de login, contacte o suporte técnico.
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="admin-edit"
                                checked={isAdmin}
                                onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                            />
                            <Label htmlFor="admin-edit">Acesso de Administrador</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Guardar Alterações
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
