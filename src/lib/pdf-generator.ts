import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ConcludedInquiry {
    nuipc: string
    data_conclusao: string
    numero_oficio: string | null
    tipo_crime: string | null
    destino?: string | null
}

export async function generateBrandedReport(
    inquiries: ConcludedInquiry[],
    startDate: Date,
    endDate: Date,
    userName: string
) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Load and embed logo
    try {
        const { dataURL, aspectRatio } = await loadImageAsBase64('/LOGO.png')

        // Add logo centered with proper aspect ratio (50% larger than original)
        const maxLogoWidth = 52.5  // 50% larger than original 35mm
        const logoWidth = maxLogoWidth
        const logoHeight = maxLogoWidth / aspectRatio
        const logoX = (pageWidth - logoWidth) / 2
        doc.addImage(dataURL, 'PNG', logoX, 15, logoWidth, logoHeight)
    } catch (error) {
        console.error('Failed to load logo:', error)
    }

    // Organization name
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    const orgText = 'SECÇÃO DE INVESTIGAÇÃO E INQUÉRITOS'
    const orgTextWidth = doc.getTextWidth(orgText)
    doc.text(orgText, (pageWidth - orgTextWidth) / 2, 62)

    // User name
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const userText = `Exportado por: ${userName}`
    const userTextWidth = doc.getTextWidth(userText)
    doc.text(userText, (pageWidth - userTextWidth) / 2, 68)

    // Separator line
    doc.setDrawColor(41, 128, 185)
    doc.setLineWidth(0.5)
    doc.line(20, 73, pageWidth - 20, 73)

    // Title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    const title = 'Relatório de Inquéritos Concluídos'
    const titleWidth = doc.getTextWidth(title)
    doc.text(title, (pageWidth - titleWidth) / 2, 82)

    // Date range
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const dateRange = `Período: ${startDate.toLocaleDateString('pt-PT')} a ${endDate.toLocaleDateString('pt-PT')}`
    const dateRangeWidth = doc.getTextWidth(dateRange)
    doc.text(dateRange, (pageWidth - dateRangeWidth) / 2, 90)

    // Table data
    const tableData = inquiries.map((inq) => [
        inq.nuipc,
        inq.tipo_crime || '-',
        inq.data_conclusao ? new Date(inq.data_conclusao).toLocaleDateString('pt-PT') : '-',
        inq.numero_oficio || '-',
    ])

    // Calculate table width and center it
    const tableWidth = 45 + 60 + 40 + 35 // Sum of column widths
    const horizontalMargin = (pageWidth - tableWidth) / 2

    // Generate modern table
    autoTable(doc, {
        startY: 98,
        head: [['NUIPC', 'Crime', 'Data de Conclusão', 'Nº Ofício']],
        body: tableData,
        styles: {
            fontSize: 9,
            cellPadding: 5,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
        },
        alternateRowStyles: {
            fillColor: [245, 248, 250],
        },
        columnStyles: {
            0: { cellWidth: 45, fontStyle: 'bold' },
            1: { cellWidth: 60 },
            2: { cellWidth: 40, halign: 'center' },
            3: { cellWidth: 35, halign: 'center' },
        },
        margin: { left: horizontalMargin, right: horizontalMargin, top: 20 },
        didDrawPage: (data) => {
            // Header only on first page - already drawn above
        }
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 98
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
        `Total de inquéritos: ${inquiries.length}`,
        20,
        pageHeight - 15
    )

    doc.text(
        `Gerado em: ${new Date().toLocaleString('pt-PT')}`,
        pageWidth - 20,
        pageHeight - 15,
        { align: 'right' }
    )

    // Page numbers and footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Organization footer
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        const footerText = 'Subdestacamento Territorial da GNR em Albufeira - Estrada de Vale Pedras - 8201-861 Albufeira - 289 590 790'
        const footerWidth = doc.getTextWidth(footerText)
        doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 5)

        // Page numbers
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        )
    }

    // Save PDF
    const filename = `relatorio_concluidos_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`
    doc.save(filename)
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

interface UserProductivity {
    userId: string
    userName: string
    inquiries: ConcludedInquiry[]
}

export async function generateWeeklyProductivityReport(
    teamData: UserProductivity[],
    currentStats: any[], // UserStat[]
    startDate: Date,
    endDate: Date,
    userName: string
) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // --- HEADER (Reused) ---
    try {
        const { dataURL, aspectRatio } = await loadImageAsBase64('/LOGO.png')
        const maxLogoWidth = 52.5
        const logoWidth = maxLogoWidth
        const logoHeight = maxLogoWidth / aspectRatio
        const logoX = (pageWidth - logoWidth) / 2
        doc.addImage(dataURL, 'PNG', logoX, 15, logoWidth, logoHeight)
    } catch (error) {
        console.error('Failed to load logo:', error)
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    const orgText = 'SECÇÃO DE INVESTIGAÇÃO E INQUÉRITOS'
    const orgTextWidth = doc.getTextWidth(orgText)
    doc.text(orgText, (pageWidth - orgTextWidth) / 2, 62)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const userText = `Exportado por: ${userName}`
    const userTextWidth = doc.getTextWidth(userText)
    doc.text(userText, (pageWidth - userTextWidth) / 2, 68)

    doc.setDrawColor(41, 128, 185)
    doc.setLineWidth(0.5)
    doc.line(20, 73, pageWidth - 20, 73)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    const title = 'Relatório Semanal de Produtividade'
    const titleWidth = doc.getTextWidth(title)
    doc.text(title, (pageWidth - titleWidth) / 2, 82)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const dateRange = `Período: ${startDate.toLocaleString('pt-PT')} a ${endDate.toLocaleString('pt-PT')}`
    const dateRangeWidth = doc.getTextWidth(dateRange)
    doc.text(dateRange, (pageWidth - dateRangeWidth) / 2, 90)

    let currentY = 100

    // --- CURRENT WORKLOAD SNAPSHOT ---
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Estado Atual (Existentes)', 20, currentY)
    currentY += 5

    const snapshotData = currentStats
        .sort((a, b) => b.activeInquiries - a.activeInquiries)
        .map(u => [u.userName, u.activeInquiries.toString()])

    // Add Total Row
    const totalActive = currentStats.reduce((acc, curr) => acc + curr.activeInquiries, 0)
    snapshotData.push(['TOTAL EQUIPA', totalActive.toString()])

    autoTable(doc, {
        startY: currentY,
        head: [['Militar', 'Processos Existentes (Ativos)']],
        body: snapshotData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [44, 62, 80], halign: 'left' }, // Dark Blue/Grey
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 20 },
    })

    currentY = (doc as any).lastAutoTable.finalY + 15

    // --- SUMMARY TABLE (Concluded in Period) ---
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Resumo de Conclusões no Período', 20, currentY)
    currentY += 5

    const summaryData = teamData
        .sort((a, b) => b.inquiries.length - a.inquiries.length)
        .map(u => [u.userName, u.inquiries.length.toString()])

    const totalConcluded = teamData.reduce((acc, curr) => acc + curr.inquiries.length, 0)
    summaryData.push(['TOTAL', totalConcluded.toString()])

    autoTable(doc, {
        startY: currentY,
        head: [['Militar', 'Processos Concluídos']],
        body: summaryData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], halign: 'left' },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 20 },
    })

    currentY = (doc as any).lastAutoTable.finalY + 15

    // --- DETAILED TABLES PER USER ---
    for (const user of teamData) {
        if (user.inquiries.length === 0) continue

        // Check if we need a new page for the header
        if (currentY + 20 > pageHeight) {
            doc.addPage()
            currentY = 20
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(41, 128, 185) // Blue header
        doc.text(`${user.userName} (${user.inquiries.length})`, 20, currentY)
        currentY += 5

        const userTableData = user.inquiries.map(inq => [
            inq.nuipc,
            inq.tipo_crime || '-',
            inq.data_conclusao ? new Date(inq.data_conclusao).toLocaleDateString('pt-PT') : '-',
            inq.numero_oficio || '-',
            inq.destino || '-'
        ])

        autoTable(doc, {
            startY: currentY,
            head: [['NUIPC', 'Crime', 'Data Conclusão', 'Nº Ofício', 'Destino']],
            body: userTableData,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [100, 100, 100], fontSize: 9 }, // Gray header for sub-tables
            columnStyles: {
                0: { cellWidth: 40, fontStyle: 'bold' },
                1: { cellWidth: 50 },
                2: { cellWidth: 30, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 35, halign: 'center' },
            },
            margin: { left: 20 },
            pageBreak: 'avoid', // Try to keep user table together
        })

        currentY = (doc as any).lastAutoTable.finalY + 10
    }

    // --- FOOTER (Page Numbers) ---
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        const footerText = 'Subdestacamento Territorial da GNR em Albufeira - Produção Semanal'
        const footerWidth = doc.getTextWidth(footerText)
        doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 5)

        doc.setFontSize(8)
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' })
    }

    const filename = `relatorio_semanal_${startDate.toISOString().split('T')[0]}.pdf`
    doc.save(filename)
}

export async function generateDashboardReport(
    analytics: {
        weekly: any[],
        monthly: any[],
        quarterly: any[]
    },
    teamStats: {
        weekly: any[],
        monthly: any[]
    },
    currentStats: any[], // UserStat[]
    userName: string
) {
    const doc = new jsPDF({ orientation: 'landscape' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const dateStr = new Date().toLocaleString('pt-PT')

    const addHeader = (title: string) => {
        doc.setFontSize(16)
        doc.setTextColor(41, 128, 185)
        doc.setFont('helvetica', 'bold')
        doc.text(title, 14, 15)

        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'normal')
        doc.text(`Estado da Nação - Gerado por ${userName} em ${dateStr}`, pageWidth - 14, 15, { align: 'right' })

        doc.setDrawColor(200, 200, 200)
        doc.line(14, 18, pageWidth - 14, 18)
    }

    // PAGE 1: Temporal Analysis (Weekly & Monthly Flow)
    addHeader('Análise Temporal de Fluxo')

    let currentY = 25

    // Weekly Table
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Evolução Semanal (Últimas Semanas)', 14, currentY)
    currentY += 5

    autoTable(doc, {
        startY: currentY,
        head: [['Semana', 'Entrados (Criados)', 'Saídos (Concluídos)', 'Saldo']],
        body: analytics.weekly.map(d => [
            d.period,
            d.created,
            d.concluded,
            d.created - d.concluded
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
    })

    // Monthly Table (Side by Side or Below?) - Below for safely
    currentY = (doc as any).lastAutoTable.finalY + 15

    doc.text('Evolução Mensal (Últimos Meses)', 14, currentY)
    currentY += 5

    autoTable(doc, {
        startY: currentY,
        head: [['Mês', 'Entrados (Criados)', 'Saídos (Concluídos)', 'Saldo']],
        body: analytics.monthly.map(d => [
            d.period,
            d.created,
            d.concluded,
            d.created - d.concluded
        ]),
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96] }, // Greenish
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
    })

    // PAGE 2: Current Workload (Snapshot)
    doc.addPage()
    addHeader('Carga de Trabalho Atual (Existentes)')

    currentY = 25
    doc.setFontSize(12)
    doc.text('Distribuição atual de processos ativos por militar.', 14, currentY)
    currentY += 10

    const totalActive = currentStats.reduce((acc, curr) => acc + curr.activeInquiries, 0)
    const totalClosedAllTime = currentStats.reduce((acc, curr) => acc + curr.closedInquiries, 0)

    const snapshotBody = currentStats
        .sort((a, b) => b.activeInquiries - a.activeInquiries)
        .map(u => [
            u.userName,
            u.activeInquiries.toString(),
            u.closedInquiries.toString(),
            u.totalInquiries.toString()
        ])

    snapshotBody.push(['TOTAL EQUIPA', totalActive.toString(), totalClosedAllTime.toString(), (totalActive + totalClosedAllTime).toString()])

    autoTable(doc, {
        startY: currentY,
        head: [['Militar', 'Existentes (Ativos)', 'Concluídos (Total Histórico)', 'Total Atribuído']],
        body: snapshotBody,
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80], halign: 'center' },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'center', fontStyle: 'bold', textColor: [41, 128, 185] },
            2: { halign: 'center', textColor: [39, 174, 96] },
            3: { halign: 'center' }
        },
        styles: { fontSize: 10, cellPadding: 3 },
        margin: { left: 14, right: 14 }
    })


    // PAGE 3: Team Performance (Weekly)
    doc.addPage()
    addHeader('Performance da Equipa - Semanal')

    currentY = 25
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Detalhe das últimas 8 semanas por militar (Entradas / Saídas / Posse).', 14, currentY)
    currentY += 10

    // Transform Team Stats for Table
    // Structure: User | Week 1 | Week 2 ... | Total
    if (teamStats.weekly.length > 0) {
        const weeks = Object.keys(teamStats.weekly[0].stats).sort()
        const heads = ['Militar', ...weeks.map(w => w.slice(5)), 'Total'] // Slice 'yyyy-' to show 'MM-dd'

        const body = teamStats.weekly.map((u: any) => {
            const row = [u.userName]
            weeks.forEach(w => row.push(`${u.stats[w].created} / ${u.stats[w].concluded} / ${u.stats[w].balance}`))
            row.push(`${u.totals.created} / ${u.totals.concluded}`)
            return row
        })

        autoTable(doc, {
            startY: currentY,
            head: [heads],
            body: body,
            theme: 'striped',
            styles: { fontSize: 7, cellPadding: 2 }, // Reduced font size to fit
            headStyles: { fillColor: [41, 128, 185], halign: 'center' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
            margin: { left: 14, right: 14 }
        })
    }

    // PAGE 4: Team Performance (Monthly)
    doc.addPage()
    addHeader('Performance da Equipa - Mensal')

    currentY = 25
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Detalhe dos últimos 6 meses por militar (Entradas / Saídas / Posse).', 14, currentY)
    currentY += 10

    if (teamStats.monthly.length > 0) {
        const months = Object.keys(teamStats.monthly[0].stats).sort()
        const heads = ['Militar', ...months, 'Total']

        const body = teamStats.monthly.map((u: any) => {
            const row = [u.userName]
            months.forEach(m => row.push(`${u.stats[m].created} / ${u.stats[m].concluded} / ${u.stats[m].balance}`))
            row.push(`${u.totals.created} / ${u.totals.concluded}`)
            return row
        })

        autoTable(doc, {
            startY: currentY,
            head: [heads],
            body: body,
            theme: 'striped',
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [39, 174, 96], halign: 'center' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
            margin: { left: 14, right: 14 }
        })
    }

    doc.save(`dashboard_edn_${new Date().toISOString().slice(0, 10)}.pdf`)
}
