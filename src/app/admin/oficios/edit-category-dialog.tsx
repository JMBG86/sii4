'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { OficioCategory } from '@/types/database'

export function EditCategoryDialog({ category }: { category: OficioCategory }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(category.name)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('oficio_categories')
                .update({ name })
                .eq('id', category.id)

            if (error) throw error

            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Error updating category:', error)
            alert('Erro ao atualizar categoria')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Categoria</DialogTitle>
                        <DialogDescription>
                            Altere o nome da categoria.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome da Categoria</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Operadoras"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardar' : 'Guardar Alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
