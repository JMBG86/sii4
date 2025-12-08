'use client'

import { useState } from 'react'
// If valid client helper exists, use it. Otherwise use createBrowserClient from @supabase/ssr or similar.
// Assuming standard Next.js + Supabase setup.
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
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CreateCategoryDialog() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('oficio_categories')
                .insert([{ name }])

            if (error) throw error

            setOpen(false)
            setName('')
            router.refresh()
        } catch (error) {
            console.error('Error creating category:', error)
            alert('Erro ao criar categoria')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Criar Categoria</DialogTitle>
                        <DialogDescription>
                            Crie uma nova categoria para agrupar modelos de ofícios.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Criando...' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
