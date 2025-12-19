'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { generateMapsExcel } from '@/lib/excel-service'
import { toast } from 'sonner'
import { fetchAllProcessosForExport, fetchInqueritosForExcel, fetchCorrespondenciaForExcel } from '@/app/sp/processos-crime/actions'

export function ExcelExportCard() {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            // Fetch multiple datasets in parallel
            const [processosData, inqueritosData, correspondenciaData] = await Promise.all([
                fetchAllProcessosForExport(),
                fetchInqueritosForExcel(),
                fetchCorrespondenciaForExcel()
            ])

            if ((!processosData || processosData.length === 0) && (!inqueritosData || inqueritosData.length === 0)) {
                toast.warning('Não existem dados para exportar em nenhuma das folhas.')
                // Proceed to export even if only one is present, or show warning if TOTAL lack of data.
                // But logic above assumes valid empty arrays if no data.
            }

            await generateMapsExcel(processosData || [], inqueritosData || [], correspondenciaData || [])
            toast.success('Ficheiro Excel gerado com sucesso!')
        } catch (error) {
            console.error(error)
            toast.error('Erro ao gerar ficheiro Excel.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <FileSpreadsheet className="h-5 w-5" />
                    Exportação para Excel
                </CardTitle>
                <CardDescription>
                    Gerar ficheiro com todas as folhas de dados (Processos, Externos, etc).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleExport}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                    Descarregar Excel
                </Button>
            </CardContent>
        </Card>
    )
}
