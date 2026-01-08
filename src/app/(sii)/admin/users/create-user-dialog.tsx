'use client'

import { useState } from 'react'
import { createUser } from './actions'
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
import { Loader2, Plus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function CreateUserDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.append('role', isAdmin ? 'admin' : 'user')

        const result = await createUser(formData)

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
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Utilizador
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Criar Novo Utilizador</DialogTitle>
                        <DialogDescription>
                            Adicione um novo membro à equipa.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstName">Nome Próprio</Label>
                                <Input id="firstName" name="firstName" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastName">Apelido</Label>
                                <Input id="lastName" name="lastName" required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required minLength={6} />
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="admin"
                                    checked={isAdmin}
                                    onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                                />
                                <Label htmlFor="admin" className="font-semibold">Acesso de Administrador</Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="access_sp"
                                        name="access_sp"
                                    />
                                    <Label htmlFor="access_sp">Acesso SP (Processos)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="access_sg"
                                        name="access_sg"
                                    />
                                    <Label htmlFor="access_sg">Acesso SG (Sargentos)</Label>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="default_app">Aplicação Padrão (Ao iniciar sessão)</Label>
                                <select
                                    id="default_app"
                                    name="default_app"
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
                            Criar Utilizador
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
