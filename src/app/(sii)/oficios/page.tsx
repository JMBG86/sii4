import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { FolderIcon, FileTextIcon } from 'lucide-react'

export default async function OficiosPage() {
    const supabase = await createClient()

    // Fetch Categories
    const { data: categories, error } = await supabase
        .from('oficio_categories')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching categories:', error)
        return <div className="p-4 text-red-500">Erro ao carregar ofícios.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Ofícios</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories?.map((category) => (
                    <Link href={`/oficios/${category.id}`} key={category.id} className="block group">
                        <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {category.name}
                                </CardTitle>
                                <FolderIcon className="h-5 w-5 text-muted-foreground group-hover:text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Ver modelos e minutas
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {categories?.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        <FolderIcon className="mx-auto h-10 w-10 mb-2 opacity-50" />
                        <p>Nenhuma categoria encontrada.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
