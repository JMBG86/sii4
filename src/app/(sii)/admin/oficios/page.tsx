import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FolderIcon, Plus } from 'lucide-react'
import { CreateCategoryDialog } from './create-category-dialog'
import { EditCategoryDialog } from './edit-category-dialog'

export default async function AdminOficiosPage() {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
        .from('oficio_categories')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Administração de Ofícios</h1>
                <CreateCategoryDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories?.map((category) => (
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
