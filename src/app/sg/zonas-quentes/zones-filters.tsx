'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Filter, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface ZonesFiltersProps {
    availableCrimeTypes: string[]
}

export function ZonesFilters({ availableCrimeTypes }: ZonesFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Date State
    const [date, setDate] = useState<DateRange | undefined>(() => {
        const start = searchParams.get('startDate')
        const end = searchParams.get('endDate')
        if (start && end) {
            return { from: new Date(start), to: new Date(end) }
        }
        return undefined
    })

    // Crime Types State (Multi-select)
    const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
        const types = searchParams.get('crimeTypes')
        return types ? types.split(',') : []
    })

    const [openCrime, setOpenCrime] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Update URL when filters change
    const applyFilters = () => {
        const params = new URLSearchParams()
        if (date?.from) {
            // Use yyyy-MM-dd to avoid timezone shifts and ensure what user sees is what goes to query
            params.set('startDate', format(date.from, 'yyyy-MM-dd'))
        }
        if (date?.to) {
            params.set('endDate', format(date.to, 'yyyy-MM-dd'))
        }
        if (selectedTypes.length > 0) params.set('crimeTypes', selectedTypes.join(','))

        router.push(`?${params.toString()}`)
    }

    const clearFilters = () => {
        setDate(undefined)
        setSelectedTypes([])
        router.push('?')
    }

    // Toggle crime type selection
    const toggleCrimeType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }

    const filteredTypes = useMemo(() => {
        if (!searchTerm) return availableCrimeTypes
        return availableCrimeTypes.filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [availableCrimeTypes, searchTerm])

    return (
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm my-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2">
                <Filter className="w-4 h-4" />
                Filtros:
            </div>

            {/* Date Range Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy", { locale: pt })} -{" "}
                                    {format(date.to, "dd/MM/yyyy", { locale: pt })}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy", { locale: pt })
                            )
                        ) : (
                            <span>Selecione datas</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={pt}
                    />
                </PopoverContent>
            </Popover>

            {/* Crime Types Multi-Select (Custom Implementation) */}
            <Popover open={openCrime} onOpenChange={setOpenCrime}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCrime}
                        className="w-[300px] justify-between"
                    >
                        {selectedTypes.length > 0
                            ? `${selectedTypes.length} selecionado(s)`
                            : "Tipos de Crime..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Procurar crime..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {filteredTypes.length === 0 ? (
                            <div className="py-2 text-center text-sm text-muted-foreground">
                                Nenhum tipo encontrado.
                            </div>
                        ) : (
                            filteredTypes.map((type) => (
                                <div
                                    key={type}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                                        selectedTypes.includes(type) && "bg-slate-100 dark:bg-slate-800"
                                    )}
                                    onClick={() => toggleCrimeType(type)}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-4 h-4 rounded-sm border border-primary",
                                        selectedTypes.includes(type) ? "bg-primary text-primary-foreground" : "opacity-50"
                                    )}>
                                        <Check className={cn("h-3 w-3", selectedTypes.includes(type) ? "opacity-100" : "opacity-0")} />
                                    </div>
                                    <span>{type}</span>
                                </div>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="icon" onClick={clearFilters} title="Limpar Filtros">
                    <X className="h-4 w-4" />
                </Button>
                <Button onClick={applyFilters}>
                    Aplicar
                </Button>
            </div>

            {/* Active Filters Display */}
            {selectedTypes.length > 0 && (
                <div className="hidden md:flex flex-wrap gap-1 max-w-[300px]">
                    {selectedTypes.slice(0, 3).map(type => (
                        <Badge key={type} variant="secondary" className="text-[10px]">{type}</Badge>
                    ))}
                    {selectedTypes.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">+{selectedTypes.length - 3}</Badge>
                    )}
                </div>
            )}
        </div>
    )
}
