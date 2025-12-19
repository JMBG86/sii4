'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2, Download, Calendar as CalendarIcon } from 'lucide-react'
import { fetchAllProcessosForExport, fetchProcessosByDateRange, fetchMonthlyReportStats } from '../processos-crime/actions'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import { ExcelExportCard } from '@/components/sp/maps/excel-export-card'
import { createClient } from '@/lib/supabase/client'

export default function MapasPage() {
    const [loadingAll, setLoadingAll] = useState(false)
    const [loadingMonthly, setLoadingMonthly] = useState(false)
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    })
    const [userName, setUserName] = useState<string>('Utilizador')

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilizador')
            }
        })
    }, [])

    async function handleExportPDF() {
        setLoadingAll(true)
        try {
            const data: any[] = await fetchAllProcessosForExport()

            if (!data || data.length === 0) {
                alert('Não existem dados para exportar.')
                setLoadingAll(false)
                return
            }

            await generateDetailedListPDF(data, 'Mapa Geral de Processos', userName)

        } catch (error) {
            console.error(error)
            alert('Erro ao exportar PDF. Verifique a consola.')
        } finally {
            setLoadingAll(false)
        }
    }

    async function handleExportMonthly() {
        if (!date?.from || !date?.to) {
            alert('Selecione um intervalo de datas.')
            return
        }

        setLoadingMonthly(true)
        try {
            const startDate = date.from.toISOString().split('T')[0]
            const endDate = date.to.toISOString().split('T')[0]

            // Parallel Fetch
            const [data, stats] = await Promise.all([
                fetchProcessosByDateRange(startDate, endDate),
                fetchMonthlyReportStats(startDate, endDate)
            ])

            if (!data || data.length === 0) {
                // Warning only?
            }

            await generateMonthlyReportPDF(data || [], date.from, date.to, stats, userName)

        } catch (error) {
            console.error(error)
            alert('Erro ao exportar Relatório Mensal.')
        } finally {
            setLoadingMonthly(false)
        }
    }

    // --- PDF Generators ---

    async function generateDetailedListPDF(data: any[], title: string, userName: string) {
        const doc = new jsPDF('l')
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        // --- HEADER ---
        try {
            const { dataURL, aspectRatio } = await loadImageAsBase64('/LOGO.png')
            const logoWidth = 25
            const logoHeight = logoWidth / aspectRatio
            const logoX = 14
            const logoY = 10

            doc.addImage(dataURL, 'PNG', logoX, logoY, logoWidth, logoHeight)

            const textX = logoX + logoWidth + 5
            const textCenterY = logoY + (logoHeight / 2)

            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            const orgText = 'SECÇÃO DE INVESTIGAÇÃO E INQUÉRITOS'
            doc.text(orgText, textX, textCenterY - 2)

            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            const userText = `Exportado por: ${userName}`
            doc.text(userText, textX, textCenterY + 4)

        } catch (error) {
            console.error('Failed to load logo:', error)
        }

        const startY = 35

        doc.setDrawColor(41, 128, 185)
        doc.setLineWidth(0.5)
        doc.line(14, startY, pageWidth - 14, startY)

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(41, 128, 185)
        doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, startY + 8)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0)
        doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, (pageWidth - doc.getTextWidth(`Data de Emissão: ${new Date().toLocaleDateString()}`)) / 2, startY + 14)

        const rows = data.map(p => {
            // Detainees Formatting
            const detidosList = p.sp_detidos_info?.map((d: any) => `${d.quantidade} ${d.sexo} ${d.nacionalidade}`) || []
            const detidosStr = detidosList.join('\n')

            // Seizures Formatting
            let apreensoesStr = ''

            // 1. Generic Seizures
            if (p.sp_apreensoes_info && p.sp_apreensoes_info.length > 0) {
                apreensoesStr += p.sp_apreensoes_info.map((a: any) => `${a.tipo}: ${a.descricao}`).join('\n')
            }

            // 2. Drugs
            const rawDrugs = p.sp_apreensoes_drogas
            let drugs: any = null
            if (Array.isArray(rawDrugs) && rawDrugs.length > 0) drugs = rawDrugs[0]
            else if (rawDrugs && typeof rawDrugs === 'object' && !Array.isArray(rawDrugs)) drugs = rawDrugs

            if (drugs) {
                const drugLines = []
                if (drugs.heroina_g > 0) drugLines.push(`Heroína: ${drugs.heroina_g}g`)
                if (drugs.cocaina_g > 0) drugLines.push(`Cocaína: ${drugs.cocaina_g}g`)
                if (drugs.cannabis_folhas_g > 0) drugLines.push(`Liamba: ${drugs.cannabis_folhas_g}g`)
                if (drugs.cannabis_resina_g > 0) drugLines.push(`Hashish: ${drugs.cannabis_resina_g}g`)
                if (drugs.cannabis_oleo_g > 0) drugLines.push(`Óleo Can.: ${drugs.cannabis_oleo_g}g`)
                if (drugs.sinteticas_g > 0) drugLines.push(`Sintéticas: ${drugs.sinteticas_g}g`)
                if (drugs.cannabis_plantas_un > 0) drugLines.push(`Plantas: ${drugs.cannabis_plantas_un} un`)
                if (drugs.substancias_psicoativas_un > 0) drugLines.push(`Psicoativas: ${drugs.substancias_psicoativas_un} un`)

                if (drugLines.length > 0) {
                    if (apreensoesStr) apreensoesStr += '\n---\n'
                    apreensoesStr += drugLines.join('\n')
                }
            }

            return [
                p.numero_sequencial,
                p.nuipc_completo || '-',
                p.data_registo ? new Date(p.data_registo).toLocaleDateString() : '-',
                p.tipo_crime || '-',
                detidosStr || '-',
                apreensoesStr || '-',
                p.entidade_destino || '-',
                p.envio_em ? new Date(p.envio_em).toLocaleDateString() : '-',
                p.numero_oficio_envio || '-' // NEW COLUMN: Ofício de Saída
            ]
        })

        const tableWidth = 10 + 25 + 20 + 35 + 30 + 45 + 35 + 20 + 20
        const horizontalMargin = (pageWidth - tableWidth) / 2

        autoTable(doc, {
            head: [['Seq', 'NUIPC', 'Data Reg.', 'Crime', 'Detidos', 'Apreensões', 'Destino', 'Dt. Envio', 'Of. Saída']],
            body: rows,
            startY: startY + 25,
            styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak', halign: 'center', valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 25 },
                2: { cellWidth: 20 },
                3: { cellWidth: 35 },
                4: { cellWidth: 30 },
                5: { cellWidth: 45 },
                6: { cellWidth: 35 },
                7: { cellWidth: 20 },
                8: { cellWidth: 20 },
            },
            headStyles: { fillColor: [22, 163, 74], halign: 'center', valign: 'middle' },
            theme: 'grid',
            margin: { top: 20, bottom: 20, left: horizontalMargin, right: horizontalMargin }
        })

        addFooter(doc, pageHeight, pageWidth)
        doc.save(`mapa_processos_geral.pdf`)
    }

    async function generateMonthlyReportPDF(data: any[], from: Date, to: Date, stats: any, userName: string) {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const primaryColor: [number, number, number] = [22, 163, 74]

        // --- HEADER ---
        try {
            const { dataURL, aspectRatio } = await loadImageAsBase64('/LOGO.png')
            const logoWidth = 25
            const logoHeight = logoWidth / aspectRatio
            const logoX = 14
            const logoY = 10

            doc.addImage(dataURL, 'PNG', logoX, logoY, logoWidth, logoHeight)

            const textX = logoX + logoWidth + 5
            const textCenterY = logoY + (logoHeight / 2)

            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            const orgText = 'SECÇÃO DE INVESTIGAÇÃO E INQUÉRITOS'
            doc.text(orgText, textX, textCenterY - 2)

            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            const userText = `Exportado por: ${userName}`
            doc.text(userText, textX, textCenterY + 4)

        } catch (error) {
            console.error('Failed to load logo:', error)
        }

        const startY = 35

        doc.setDrawColor(41, 128, 185)
        doc.setLineWidth(0.5)
        doc.line(14, startY, pageWidth - 14, startY)

        // Title
        doc.setFontSize(16)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        const title = 'Relatório Mensal de Atividade - SP'
        doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, startY + 8)

        doc.setFontSize(12)
        doc.setTextColor(0)
        const dateRange = `Período: ${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}`
        doc.text(dateRange, (pageWidth - doc.getTextWidth(dateRange)) / 2, startY + 15)

        let y = startY + 25

        // NEW SUMMARY TABLE (Header)
        doc.setFontSize(14)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('Resumo de Movimento', 14, y)
        y += 8

        autoTable(doc, {
            startY: y,
            head: [['Pendentes Mês Ant.', 'Entrados (Registados)', 'Concluídos', 'Transitam p/ Seguinte']],
            body: [[
                stats.pendentesAnterior,
                stats.entrados,
                stats.concluidos,
                stats.transitam
            ]],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, halign: 'center' },
            bodyStyles: { halign: 'center', fontStyle: 'bold' }
        })
        y = (doc as any).lastAutoTable.finalY + 15

        // NEW: DEPRECADAS TABLE
        doc.setFontSize(14)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('Movimento de Deprecadas', 14, y)
        y += 8

        autoTable(doc, {
            startY: y,
            head: [['Pendentes Mês Ant.', 'Registadas', 'Saídas (Concluídas)', 'Transitam p/ Seguinte']],
            body: [[
                stats.deprecadas?.pendentes || 0,
                stats.deprecadas?.entradas || 0,
                stats.deprecadas?.concluidas || 0,
                stats.deprecadas?.transitam || 0
            ]],
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38], halign: 'center' }, // Red header for Deprecadas
            bodyStyles: { halign: 'center', fontStyle: 'bold' }
        })
        y = (doc as any).lastAutoTable.finalY + 15

        // Stats Aggregation (for Lists)
        let totalRegistados = data.length
        let enviadosDIAP = 0
        let enviadosSII = 0

        let totalDetidos = 0
        let detidosM = 0
        let detidosF = 0
        const detidosNacionalidade: Record<string, number> = {}

        const apreensoesStats: Record<string, number> = {}
        const drogasStats: Record<string, number> = {
            'Heroína (g)': 0,
            'Cocaína (g)': 0,
            'Liamba (g)': 0,
            'Hashish (g)': 0,
            'Sintéticas (g)': 0,
            'Plantas (un)': 0
        }

        data.forEach(p => {
            // Process Stats
            if (p.entidade_destino?.toUpperCase().includes('DIAP')) enviadosDIAP++
            if (p.entidade_destino?.toUpperCase().includes('SII')) enviadosSII++

            // Detirees Stats
            if (p.sp_detidos_info) {
                p.sp_detidos_info.forEach((d: any) => {
                    const qtd = d.quantidade || 0
                    totalDetidos += qtd
                    if (d.sexo === 'M') detidosM += qtd
                    else if (d.sexo === 'F') detidosF += qtd

                    const nac = d.nacionalidade || 'Desconhecida'
                    detidosNacionalidade[nac] = (detidosNacionalidade[nac] || 0) + qtd
                })
            }

            // Seizures Stats (Generic)
            if (p.sp_apreensoes_info) {
                p.sp_apreensoes_info.forEach((a: any) => {
                    const desc = a.descricao || ''
                    const match = desc.match(/^\d+/)
                    const qtd = match ? parseInt(match[0]) : 1
                    const key = a.tipo || 'Outros'
                    apreensoesStats[key] = (apreensoesStats[key] || 0) + qtd
                })
            }

            // Drugs Stats
            const rawDrugs = p.sp_apreensoes_drogas
            let d: any = null
            if (Array.isArray(rawDrugs) && rawDrugs.length > 0) d = rawDrugs[0]
            else if (rawDrugs && typeof rawDrugs === 'object' && !Array.isArray(rawDrugs)) d = rawDrugs

            if (d) {
                drogasStats['Heroína (g)'] += (d.heroina_g || 0)
                drogasStats['Cocaína (g)'] += (d.cocaina_g || 0)
                drogasStats['Liamba (g)'] += (d.cannabis_folhas_g || 0)
                drogasStats['Hashish (g)'] += (d.cannabis_resina_g || 0)
                drogasStats['Sintéticas (g)'] += (d.sinteticas_g || 0)
                drogasStats['Plantas (un)'] += (d.cannabis_plantas_un || 0)
            }
        })

        // 1. Process Stats Breakdown
        if (y + 40 > pageHeight) { doc.addPage(); y = 20; }
        doc.setFontSize(14)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('Detalhe de Processos (Registo Mensal)', 14, y)
        y += 8

        autoTable(doc, {
            startY: y,
            head: [['Total Registados', 'Enviados DIAP', 'Enviados SII', 'Outros/Pendentes']],
            body: [[
                totalRegistados,
                enviadosDIAP,
                enviadosSII,
                totalRegistados - enviadosDIAP - enviadosSII
            ]],
            theme: 'striped',
            headStyles: { fillColor: primaryColor }
        })
        y = (doc as any).lastAutoTable.finalY + 15

        // 2. Detainees Stats
        if (y + 40 > pageHeight) { doc.addPage(); y = 20; }
        doc.setFontSize(14)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('Detidos', 14, y)
        y += 8

        const nacRows = Object.entries(detidosNacionalidade).map(([k, v]) => [k, v])

        autoTable(doc, {
            startY: y,
            head: [['Total', 'Masculinos', 'Femininos']],
            body: [[totalDetidos, detidosM, detidosF]],
            theme: 'striped',
            headStyles: { fillColor: primaryColor },
            tableWidth: 'wrap'
        })

        // Nationalities Table below
        if (nacRows.length > 0) {
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 5,
                head: [['Nacionalidade', 'Qtd']],
                body: nacRows,
                theme: 'grid',
                headStyles: { fillColor: [100, 100, 100] }
            })
        }

        y = (doc as any).lastAutoTable.finalY + 15

        // 3. Seizures Stats
        if (y + 40 > pageHeight) { doc.addPage(); y = 20; }
        doc.setFontSize(14)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('Apreensões e Estupefacientes', 14, y)
        y += 8

        const seizureRows = Object.entries(apreensoesStats)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .map(([k, v]) => [k, v])

        const drugRows = Object.entries(drogasStats)
            .filter(([_, v]) => v > 0)
            .map(([k, v]) => [k, v.toFixed(2)])

        const finalSeizureBody = [...drugRows, ...seizureRows]

        if (finalSeizureBody.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['Tipo / Categoria', 'Quantidade Total']],
                body: finalSeizureBody,
                theme: 'striped',
                headStyles: { fillColor: primaryColor },
                margin: { bottom: 20 }
            })
        } else {
            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text('Sem registo de apreensões neste período.', 14, y + 5)
        }

        addFooter(doc, pageHeight, pageWidth)
        const fileName = `relatorio_mensal_${format(from, 'yyyy_MM')}.pdf`
        doc.save(fileName)
    }

    function addFooter(doc: jsPDF, pageHeight: number, pageWidth: number) {
        const pageCount = (doc as any).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(7)
            doc.setTextColor(100, 100, 100)
            const footerText = 'Subdestacamento Territorial da GNR em Albufeira - Estrada de Vale Pedras - 8201-861 Albufeira - 289 590 790'
            const footerWidth = doc.getTextWidth(footerText)
            doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 5)

            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(
                `Página ${i} de ${pageCount}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            )
        }
    }

    // Helper function to load image as base64 with aspect ratio
    async function loadImageAsBase64(imagePath: string): Promise<{ dataURL: string; aspectRatio: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'Anonymous'
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }
                ctx.drawImage(img, 0, 0)
                const dataURL = canvas.toDataURL('image/png')
                const aspectRatio = img.width / img.height
                resolve({ dataURL, aspectRatio })
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = imagePath
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Mapas e Relatórios</h1>
                <p className="text-muted-foreground">Exportação de dados e listagens estatísticas.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* GENERAL LIST CARD */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Mapa Geral de Processos
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Listagem Geral</div>
                        <p className="text-xs text-muted-foreground mb-4">
                            Listagem completa de todos os processos registados.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleExportPDF}
                            disabled={loadingAll}
                        >
                            {loadingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Exportar Mapa Geral (A4)
                        </Button>
                    </CardContent>
                </Card>

                {/* MONTHLY REPORT CARD */}
                <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Exportação Mensal / Estatística
                        </CardTitle>
                        <CalendarIcon className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <span className="text-2xl font-bold">Relatório Mensal</span>
                            <p className="text-xs text-muted-foreground">
                                Selecione o intervalo. Mostra estatísticas detalhadas.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y", { locale: pt })} -{" "}
                                                    {format(date.to, "LLL dd, y", { locale: pt })}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y", { locale: pt })
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
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleExportMonthly}
                            disabled={loadingMonthly}
                        >
                            {loadingMonthly ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Gerar Relatório Estatístico
                        </Button>
                    </CardContent>
                </Card>

                <ExcelExportCard />
            </div>
        </div>
    )
}
