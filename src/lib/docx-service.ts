import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

/**
 * Fills a DOCX template with data.
 * 
 * @param templatePath Path to the DOCX template in the public folder (e.g., '/templates/capa.docx')
 * @param data Object containing key-value pairs to replace in the template (e.g. { nuipc: '123' })
 * @returns Blob containing the filled DOCX.
 */
export async function fillDocxTemplate(templatePath: string, data: Record<string, any>): Promise<Blob> {
    try {
        // 1. Fetch the template binary
        const response = await fetch(templatePath)
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()

        // 2. Unzip the content
        const zip = new PizZip(arrayBuffer)

        // 3. Parse the template
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        })

        // 4. Render the document (replace variables)
        doc.render(data)

        // 5. Generate output blob
        const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

        return out

    } catch (error) {
        console.error("Error generating DOCX:", error)
        throw error
    }
}

/**
 * Trigger a browser download for a Blob
 */
export function downloadDocx(blob: Blob, fileName: string) {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
