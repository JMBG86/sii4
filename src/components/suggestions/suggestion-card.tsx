'use client'

import { Suggestion, SuggestionStatus } from '@/types/database'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, Trash2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { updateSuggestionStatus, deleteSuggestion } from '@/app/(sii)/sugestoes/actions'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'

interface SuggestionCardProps {
    suggestion: Suggestion
    isAdmin: boolean
    currentUserId: string | null
}

export function SuggestionCard({ suggestion, isAdmin, currentUserId }: SuggestionCardProps) {
    const isOwner = currentUserId && suggestion.user_id === currentUserId

    const handleStatusChange = async (newStatus: string) => {
        await updateSuggestionStatus(suggestion.id, newStatus as SuggestionStatus)
    }

    const handleDelete = async () => {
        if (confirm('Apagar esta sugestão?')) {
            await deleteSuggestion(suggestion.id)
        }
    }

    const typeColor = suggestion.tipo === 'bug' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'

    return (
        <Card className="mb-3">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={typeColor}>
                            {suggestion.tipo === 'bug' ? 'BUG' : 'SUGESTÃO'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true, locale: pt })}
                        </span>
                    </div>
                    <CardTitle className="text-base font-semibold leading-tight">
                        {suggestion.titulo}
                    </CardTitle>
                </div>

                {(isAdmin || isOwner) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {isAdmin && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Alterar Estado</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuRadioGroup value={suggestion.status} onValueChange={handleStatusChange}>
                                            <DropdownMenuRadioItem value="enviada">Enviada</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="aberta">Aberta</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="em_tratamento">Em Tratamento</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="implementado">Implementado</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}

                            {(isOwner || isAdmin) && (
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Apagar
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {suggestion.descricao}
                </p>
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
                Por: {suggestion.profiles?.full_name || 'Anónimo'}
            </CardFooter>
        </Card >
    )
}
