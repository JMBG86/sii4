'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateTemplateDialog } from './create-template-dialog'
import { DeleteTemplateButton } from './delete-template-button'
import { EditTemplateDialog } from './edit-template-dialog'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminOficioDetailPage() {
    const supabase = createClient()
    const params = useParams()
    const id = params?.id as string

    const [category, setCategory] = useState<any>(null)
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!id) return

        async function loadData() {
            // 1. Fetch Category
            const { data: catData, error: catError } = await supabase
                .from('oficio_categories')
                .select('*')
                .eq('id', id)
                .single()

            if (catError || !catData) {
                setError(true)
                setLoading(false)
                return
            }

            setCategory(catData)

            // 2. Fetch Templates
            const { data: templData } = await supabase
                .from('oficio_templates')
                .select('*')
                .eq('category_id', id)
                .order('title', { ascending: true })

            if (templData) setTemplates(templData)
            setLoading(false)
        }

        loadData()
    }, [id, supabase])

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !category) {
        return <div className="p-4 text-red-500">Categoria não encontrada.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/oficios">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Gerir: {category.name}</h1>
                </div>
                <CreateTemplateDialog categoryId={category.id} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {templates.map((template) => (
                    <Card key={template.id} className="h-full flex flex-col group hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-blue-800">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {template.title}
                            </CardTitle>
                            <div className="flex items-center -mr-2">
                                <EditTemplateDialog template={template} />
                                <DeleteTemplateButton templateId={template.id} />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="space-y-2 text-sm text-muted-foreground">
                                {template.subject && (
                                    <div className="line-clamp-2 font-medium text-foreground">
                                        {template.subject}
                                    </div>
                                )}
                                <div className="line-clamp-3 text-xs font-mono bg-muted/30 p-2 rounded">
                                    {template.content}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {templates.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Nenhum modelo criado.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
