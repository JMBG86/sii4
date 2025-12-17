import { createClient } from '@/lib/supabase/server'
import { NewSuggestionDialog } from '@/components/suggestions/new-suggestion-dialog'
import { SuggestionCard } from '@/components/suggestions/suggestion-card'
import { Suggestion } from '@/types/database'

export default async function SuggestionsPage() {
    const supabase = await createClient()

    // Fetch user for permissions
    const { data: { user } } = await supabase.auth.getUser()
    let isAdmin = false
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        isAdmin = profile?.role === 'admin'
    }

    // Fetch suggestions
    const { data: suggestions } = await supabase
        .from('sugestoes')
        .select(`
            *,
            profiles:user_id ( full_name )
        `)
        .order('created_at', { ascending: false })

    const list = (suggestions || []) as Suggestion[]

    // Group by status
    const columns = {
        enviada: list.filter(s => s.status === 'enviada'),
        aberta: list.filter(s => s.status === 'aberta'),
        em_tratamento: list.filter(s => s.status === 'em_tratamento'),
        implementado: list.filter(s => s.status === 'implementado'),
    }

    const columnLabels = {
        enviada: 'Enviadas',
        aberta: 'Abertas',
        em_tratamento: 'Em Tratamento',
        implementado: 'Implementado'
    }

    const columnColors = {
        enviada: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700',
        aberta: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
        em_tratamento: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
        implementado: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sugestões e Bugs</h1>
                    <p className="text-muted-foreground">Ajude-nos a melhorar a plataforma.</p>
                </div>
                <NewSuggestionDialog />
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1000px] h-full">
                    {(Object.keys(columns) as (keyof typeof columns)[]).map((status) => (
                        <div
                            key={status}
                            className={`flex-1 min-w-[280px] rounded-lg border p-4 flex flex-col ${columnColors[status]}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg">{columnLabels[status]}</h3>
                                <span className="text-xs font-mono bg-white dark:bg-black px-2 py-1 rounded-full border">
                                    {columns[status].length}
                                </span>
                            </div>
                            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                {columns[status].map(suggestion => (
                                    <SuggestionCard
                                        key={suggestion.id}
                                        suggestion={suggestion}
                                        isAdmin={isAdmin}
                                        currentUserId={user?.id || null}
                                    />
                                ))}
                                {columns[status].length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-md">
                                        Vazio
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
