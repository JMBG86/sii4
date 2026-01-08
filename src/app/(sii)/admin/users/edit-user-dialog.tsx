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
    role: 'user' | 'admin' | string
    access_sp?: boolean
    access_sg?: boolean
    default_app?: string
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

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="admin-edit"
                                    checked={isAdmin}
                                    onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                                />
                                <Label htmlFor="admin-edit" className="font-semibold">Acesso de Administrador</Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="access_sp_edit"
                                        name="access_sp"
                                        defaultChecked={user.access_sp}
                                    />
                                    <Label htmlFor="access_sp_edit">Acesso SP</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="access_sg_edit"
                                        name="access_sg"
                                        defaultChecked={user.access_sg}
                                    />
                                    <Label htmlFor="access_sg_edit">Acesso SG</Label>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="default_app">Aplicação Padrão</Label>
                                <select
                                    id="default_app"
                                    name="default_app"
                                    defaultValue={user.default_app || 'sii'}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="sii">SII - Investigação (Padrão)</option>
                                    <option value="sp">SP - Secretaria de Processos</option>
                                    <option value="sg">SG - Secção de Sargentos</option>
                                </select>
                            </div>
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
