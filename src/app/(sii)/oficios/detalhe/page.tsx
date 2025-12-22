'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { TemplateViewDialog } from './template-view-dialog'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function OficioDetailContent() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    const [category, setCategory] = useState<any>(null)
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!id) return

        async function loadData() {
            // Fetch Category
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

            // Fetch Templates
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
            <div className="flex items-center gap-4">
                <Link href="/oficios">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <TemplateViewDialog key={template.id} template={template} />
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        <p>Nenhum modelo disponível nesta categoria.</p>
                    </div>
                )}
            </div>
        </div>
    )
}


export default function OficioDetailPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <OficioDetailContent />
        </Suspense>
    )
}


