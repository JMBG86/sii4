import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Copy, FileText, CheckCheck } from 'lucide-react'
// import { CopyButton } from '@/components/ui/copy-button' // If exists, otherwise implemented inline or client component

export default async function OficioDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Category
    const { data: category, error: catError } = await supabase
        .from('oficio_categories')
        .select('*')
        .eq('id', id)
        .single()

    if (catError || !category) {
        return <div className="p-4 text-red-500">Categoria não encontrada.</div>
    }

    // Fetch Templates
    const { data: templates, error: templError } = await supabase
        .from('oficio_templates')
        .select('*')
        .eq('category_id', id)
        .order('title', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/oficios">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template) => (
                    <TemplateViewDialog key={template.id} template={template} />
                ))}

                {templates?.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        <p>Nenhum modelo disponível nesta categoria.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Simple client component for copy functionality
// Simple client component for dialog functionality
import { TemplateViewDialog } from './template-view-dialog'
