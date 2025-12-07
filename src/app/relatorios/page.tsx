'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FileDown, Loader2, CalendarIcon } from 'lucide-react'
import { generateBrandedReport } from '@/lib/pdf-generator'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function RelatoriosPage() {
    const [loading, setLoading] = useState(false)
    const [customLoading, setCustomLoading] = useState(false)
    const [startDate, setStartDate] = useState<Date>()
    const [userName, setUserName] = useState('')

    // Get user name on mount
    useState(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilizador')
            }
        })
    })

    const handleGenerateWeeklyReport = async () => {
        setLoading(true)
        try {
            const supabase = createClient()

            const today = new Date()
            const dayOfWeek = today.getDay()
            const daysUntilFriday = (5 - dayOfWeek + 7) % 7
            const nextFriday = new Date(today)
            nextFriday.setDate(today.getDate() + daysUntilFriday)
            nextFriday.setHours(23, 59, 59, 999)

            const lastFriday = new Date(nextFriday)
            lastFriday.setDate(nextFriday.getDate() - 7)
            lastFriday.setHours(0, 0, 0, 0)

            const { data: inquiries } = await supabase
                .from('inqueritos')
                .select('nuipc, data_conclusao, numero_oficio, tipo_crime')
                .eq('estado', 'concluido')
                .gte('data_conclusao', lastFriday.toISOString())
                .lte('data_conclusao', nextFriday.toISOString())
                .order('data_conclusao', { ascending: false })

            if (!inquiries || inquiries.length === 0) {
                alert('Nenhum inquérito concluído neste período')
                return
            }

            await generateBrandedReport(inquiries, lastFriday, nextFriday, userName)
        } catch (error) {
            console.error('Error generating report:', error)
            alert('Erro ao gerar relatório')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateCustomReport = async () => {
        if (!startDate) {
            alert('Por favor, selecione uma data de início')
            return
        }

        setCustomLoading(true)
        try {
            const supabase = createClient()

            const endDate = new Date()
            endDate.setHours(23, 59, 59, 999)

            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const { data: inquiries } = await supabase
                .from('inqueritos')
                .select('nuipc, data_conclusao, numero_oficio, tipo_crime')
                .eq('estado', 'concluido')
                .gte('data_conclusao', start.toISOString())
                .lte('data_conclusao', endDate.toISOString())
                .order('data_conclusao', { ascending: false })

            if (!inquiries || inquiries.length === 0) {
                alert('Nenhum inquérito concluído neste período')
                return
            }

            await generateBrandedReport(inquiries, start, endDate, userName)
        } catch (error) {
            console.error('Error generating report:', error)
            alert('Erro ao gerar relatório')
        } finally {
            setCustomLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Relatório Semanal</CardTitle>
                        <CardDescription>
                            Gera um PDF simples com inquéritos concluídos desde a última sexta-feira.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleGenerateWeeklyReport} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    A gerar...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Gerar Relatório Semanal
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <CardHeader>
                        <CardTitle className="text-blue-900 dark:text-blue-100">Exportar Concluídos</CardTitle>
                        <CardDescription className="text-blue-700 dark:text-blue-300">
                            Exporta inquéritos concluídos desde uma data específica com design profissional.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Data de Início:</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start text-left font-normal',
                                            !startDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, 'PPP', { locale: pt }) : 'Selecione uma data'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                        locale={pt}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button
                            onClick={handleGenerateCustomReport}
                            disabled={customLoading || !startDate}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {customLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    A gerar...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Exportar Concluídos
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
