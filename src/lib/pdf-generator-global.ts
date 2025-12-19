import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface GlobalInquiry {
    nuipc: string
    tipo_crime: string | null
    estado: string
    classificacao: string
    data_ocorrencia: string | null
    created_at: string
    numero_oficio: string | null
    destino: string | null
}

export async function generateGlobalReport(
    inquiries: GlobalInquiry[],
    startDate: Date,
    endDate: Date,
    userName: string,
    selectedStates: string[]
) {
    const doc = new jsPDF('landscape') // Landscape for more columns
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Load and embed logo
    let logoBottomY = 40 // Default backup if logo fails
    try {
        const { dataURL, aspectRatio } = await loadImageAsBase64('/LOGO.png')
        // Resize logo to be smaller for the header side-by-side layout
        const logoWidth = 25
        const logoHeight = logoWidth / aspectRatio
        const logoX = 14 // Left margin
        const logoY = 10 // Top margin

        doc.addImage(dataURL, 'PNG', logoX, logoY, logoWidth, logoHeight)

        logoBottomY = logoY + logoHeight + 5

        // Header Text block next to Logo
        const textX = logoX + logoWidth + 5
        const textCenterY = logoY + (logoHeight / 2)

        // Organization name
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        const orgText = 'SECÇÃO DE INVESTIGAÇÃO E INQUÉRITOS'
        doc.text(orgText, textX, textCenterY - 2)

        // User name
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        const userText = `Exportado por: ${userName}`
        doc.text(userText, textX, textCenterY + 4)

    } catch (error) {
        console.error('Failed to load logo:', error)
        // Fallback text positioning if logo fails
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('SECÇÃO DE INVESTIGAÇÃO E INQUÉRITOS', 14, 15)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Exportado por: ${userName}`, 14, 22)
    }

    // Adjust content start Y
    const startY = 35 // Moved up to valid space below header

    // Separator line
    doc.setDrawColor(41, 128, 185)
    doc.setLineWidth(0.5)
    doc.line(14, startY, pageWidth - 14, startY)

    // Title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    const title = 'Relatório Global de Inquéritos'
    const titleWidth = doc.getTextWidth(title)
    doc.text(title, (pageWidth - titleWidth) / 2, startY + 8) // Reduced gap

    // Date range and filters
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const dateRange = `Período: ${startDate.toLocaleDateString('pt-PT')} a ${endDate.toLocaleDateString('pt-PT')}`
    const dateRangeWidth = doc.getTextWidth(dateRange)
    doc.text(dateRange, (pageWidth - dateRangeWidth) / 2, startY + 14) // Reduced gap

    const statesText = `Estados: ${selectedStates.join(', ')}`
    const statesTextWidth = doc.getTextWidth(statesText)
    doc.text(statesText, (pageWidth - statesTextWidth) / 2, startY + 19) // Reduced gap

    // Table data
    const tableData = inquiries.map((inq) => [
        inq.nuipc,
        inq.tipo_crime || '-',
        translateState(inq.estado),
        inq.numero_oficio || '-',
        inq.destino || '-',
        inq.data_ocorrencia ? new Date(inq.data_ocorrencia).toLocaleDateString('pt-PT') : '-',
        new Date(inq.created_at).toLocaleDateString('pt-PT'),
    ])

    // Calculate table width and center it
    const tableWidth = 40 + 50 + 30 + 30 + 40 + 25 + 25 // Sum of column widths
    const horizontalMargin = (pageWidth - tableWidth) / 2

    // Generate modern table
    autoTable(doc, {
        startY: startY + 25, // Reduced gap
        head: [['NUIPC', 'Crime', 'Estado', 'Nº Ofício', 'Destino', 'Dt. Ocorrência', 'Dt. Criação']],
        body: tableData,
        styles: {
            fontSize: 7, // Slightly smaller font to fit more columns
            cellPadding: 2,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center',
        },
        alternateRowStyles: {
            fillColor: [245, 248, 250],
        },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold' },
            1: { cellWidth: 50 },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 30, halign: 'center' },
            4: { cellWidth: 40 }, // Destino can be long
            5: { cellWidth: 25, halign: 'center' },
            6: { cellWidth: 25, halign: 'center' },
        },
        margin: { left: horizontalMargin, right: horizontalMargin, top: 20, bottom: 20 }, // Added bottom margin to avoid footer collision
        didDrawPage: (data) => {
            // Only draw header on first page
            if (data.pageNumber === 1) {
                // Header is already drawn above, do nothing
            } else {
                // For subsequent pages, start table higher (no header)
                // The table will automatically continue from previous page
            }
        }
    })

    // Footer
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
    const filename = `relatorio_global_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`
    doc.save(filename)
}

function translateState(state: string): string {
    const translations: Record<string, string> = {
        'por_iniciar': 'Por Iniciar',
        'em_diligencias': 'Em Diligências',
        'aguardando_resposta': 'Aguardando Resposta',
        'tribunal': 'Tribunal',
        'concluido': 'Concluído',
    }
    return translations[state] || state
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
