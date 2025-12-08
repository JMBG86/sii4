import { PDFDocument } from 'pdf-lib'

/**
 * Fills a PDF form template with inquiry data.
 * 
 * @param templatePath Path to the PDF template in the public folder (e.g., '/templates/modelo_inquerito.pdf')
 * @param data Object containing key-value pairs where keys match the PDF Form Field names.
 * @returns Uint8Array containing the filled PDF.
 */
export async function fillPdfTemplate(templatePath: string, data: Record<string, string>): Promise<Uint8Array> {
    try {
        // 1. Fetch the template
        const existingPdfBytes = await fetch(templatePath).then(res => {
            if (!res.ok) throw new Error(`Failed to load template: ${res.statusText}`)
            return res.arrayBuffer()
        })

        // 2. Load the PDFDocument
        const pdfDoc = await PDFDocument.load(existingPdfBytes)

        // 3. Get the form
        const form = pdfDoc.getForm()

        // 4. Fill fields
        Object.entries(data).forEach(([key, value]) => {
            try {
                const field = form.getTextField(key)
                if (field) {
                    field.setText(value)
                }
            } catch (err) {
                console.warn(`Field '${key}' not found in PDF template.`)
            }
        })

        // 5. Flatten the form (make fields uneditable)
        form.flatten()

        // 6. Save the PDF
        const pdfBytes = await pdfDoc.save()
        return pdfBytes

    } catch (error) {
        console.error("Error filling PDF template:", error)
        throw error
    }
}

/**
 * Trigger a browser download for a byte array
 */
export function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
