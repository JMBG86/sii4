'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FileDown, Loader2, CalendarIcon } from 'lucide-react'
import { generateBrandedReport } from '@/lib/pdf-generator'
import { generateGlobalReport } from '@/lib/pdf-generator-global'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const INQUIRY_STATES = [
    { value: 'por_iniciar', label: 'Por Iniciar' },
    { value: 'em_diligencias', label: 'Em Diligências' },
    { value: 'aguardando_resposta', label: 'Aguardando Resposta' },
    { value: 'tribunal', label: 'Tribunal' },
    { value: 'concluido', label: 'Concluído' },
]

export default function RelatoriosPage() {
    const [loading, setLoading] = useState(false)
    const [customLoading, setCustomLoading] = useState(false)
    const [globalLoading, setGlobalLoading] = useState(false)
    const [startDate, setStartDate] = useState<Date>()
    const [globalStartDate, setGlobalStartDate] = useState<Date>()
    const [globalEndDate, setGlobalEndDate] = useState<Date>()
    const [selectedStates, setSelectedStates] = useState<string[]>(['por_iniciar', 'em_diligencias'])
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

    const handleStateToggle = (state: string) => {
        setSelectedStates(prev =>
            prev.includes(state)
                ? prev.filter(s => s !== state)
                : [...prev, state]
        )
    }

    const handleGenerateWeeklyReport = async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert('Sessão inválida')
                setLoading(false)
                return
            }

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
                .select('nuipc, data_conclusao, numero_oficio, tipo_crime, destino')
                .eq('estado', 'concluido')
                .eq('user_id', user.id) // Filter by current user
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
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert('Sessão inválida')
                setCustomLoading(false)
                return
            }

            const endDate = new Date()
            endDate.setHours(23, 59, 59, 999)

            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const { data: inquiries } = await supabase
                .from('inqueritos')
                .select('nuipc, data_conclusao, numero_oficio, tipo_crime')
                .eq('estado', 'concluido')
                .eq('user_id', user.id) // Filter by current user
                .gte('data_conclusao', start.toISOString())
                .lte('data_conclusao', endDate.toISOString())
                .order('data_conclusao', { ascending: false })

            if (!inquiries || inquiries.length === 0) {
                alert('Nenhum inquérito concluído neste período para o utilizador atual.')
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

    const handleGenerateGlobalReport = async () => {
        if (!globalStartDate || !globalEndDate) {
            alert('Por favor, selecione as datas de início e fim')
            return
        }

        if (selectedStates.length === 0) {
            alert('Por favor, selecione pelo menos um estado')
            return
        }

        setGlobalLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert('Sessão inválida')
                setGlobalLoading(false)
                return
            }

            const start = new Date(globalStartDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(globalEndDate)
            end.setHours(23, 59, 59, 999)

            const { data: inquiries } = await supabase
                .from('inqueritos')
                .select('nuipc, tipo_crime, estado, classificacao, data_ocorrencia, created_at, numero_oficio, destino')
                .in('estado', selectedStates)
                .eq('user_id', user.id) // Filter by current user
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString())
                .order('created_at', { ascending: false })

            if (!inquiries || inquiries.length === 0) {
                alert('Nenhum inquérito encontrado com os filtros selecionados para o utilizador atual.')
                return
            }

            await generateGlobalReport(inquiries, start, end, userName, selectedStates.map(s =>
                INQUIRY_STATES.find(state => state.value === s)?.label || s
            ))
        } catch (error) {
            console.error('Error generating report:', error)
            alert('Erro ao gerar relatório')
        } finally {
            setGlobalLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

                <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CardHeader>
                        <CardTitle className="text-green-900 dark:text-green-100">Report Global</CardTitle>
                        <CardDescription className="text-green-700 dark:text-green-300">
                            Exporta todos os inquéritos por estado e intervalo de datas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estados:</label>
                            <div className="grid grid-cols-2 gap-2">
                                {INQUIRY_STATES.map((state) => (
                                    <div key={state.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={state.value}
                                            checked={selectedStates.includes(state.value)}
                                            onCheckedChange={() => handleStateToggle(state.value)}
                                        />
                                        <Label htmlFor={state.value} className="text-xs cursor-pointer">
                                            {state.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Início:</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                'justify-start text-left font-normal',
                                                !globalStartDate && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {globalStartDate ? format(globalStartDate, 'dd/MM/yy', { locale: pt }) : 'Data'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={globalStartDate}
                                            onSelect={setGlobalStartDate}
                                            initialFocus
                                            locale={pt}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Fim:</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                'justify-start text-left font-normal',
                                                !globalEndDate && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {globalEndDate ? format(globalEndDate, 'dd/MM/yy', { locale: pt }) : 'Data'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={globalEndDate}
                                            onSelect={setGlobalEndDate}
                                            initialFocus
                                            locale={pt}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerateGlobalReport}
                            disabled={globalLoading || !globalStartDate || !globalEndDate || selectedStates.length === 0}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {globalLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    A gerar...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Gerar Report Global
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
