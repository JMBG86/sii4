'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { InquiryStatus } from '@/types/database'

export function ExportDropdown() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const generateCSV = async (filter?: { field: string; value: string }) => {
        setLoading(true)
        try {
            let query = supabase.from('inqueritos').select('*')

            if (filter) {
                query = query.eq(filter.field, filter.value)
            }

            const { data, error } = await query

            if (error || !data) {
                console.error(error)
                return
            }

            if (data.length === 0) {
                alert('Não há dados para exportar.')
                return
            }

            // Generate Headers
            const headers = ['NUIPC', 'Crime', 'Estado', 'Classificação', 'Data Ocorrência', 'Loc.', 'Obs']
            const rows = data.map(i => [
                i.nuipc,
                i.tipo_crime,
                i.estado,
                i.classificacao,
                i.data_ocorrencia,
                i.localizacao,
                `"${(i.observacoes || '').replace(/"/g, '""')}"` // Escape quotes
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n')

            const filename = `inqueritos_${filter ? filter.value : 'todos'}_${new Date().toISOString().split('T')[0]}.csv`
            downloadCSV(csvContent, filename)

        } finally {
            setLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar CSV
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => generateCSV()}>
                    Todos os Inquéritos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateCSV({ field: 'estado', value: 'em_diligencias' })}>
                    Em Diligências
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateCSV({ field: 'estado', value: 'concluido' })}>
                    Concluídos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateCSV({ field: 'classificacao', value: 'relevo' })}>
                    De Relevo
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
