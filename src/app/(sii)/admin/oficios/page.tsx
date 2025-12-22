'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CreateCategoryDialog } from './create-category-dialog'
import { EditCategoryDialog } from './edit-category-dialog'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminOficiosPage() {
    const supabase = createClient()
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadCategories() {
            const { data, error } = await supabase
                .from('oficio_categories')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setCategories(data)
            setLoading(false)
        }
        loadCategories()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Administração de Ofícios</h1>
                <CreateCategoryDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map((category) => (
                    <div key={category.id} className="relative group">
                        <Link href={`/admin/oficios/${category.id}`} className="block h-full">
                            <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-10">
                                    <CardTitle className="text-lg font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        {category.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Gerir modelos
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                        <div className="absolute top-5 right-5 z-10">
                            <EditCategoryDialog category={category} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
