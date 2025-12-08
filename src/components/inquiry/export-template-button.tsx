'use client'

import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { fillDocxTemplate, downloadDocx } from '@/lib/docx-service'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ExportTemplateButtonProps {
    inquiry: any
}

export function ExportTemplateButton({ inquiry }: ExportTemplateButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            // Data to fill in the DOCX
            // The keys here must match the {tags} inside the DOCX
            const formData = {
                nuipc: inquiry.nuipc || '',
                crime: inquiry.tipo_crime || '',
                // Lists joined by \n for multi-line support in Word (requires linebreaks: true in docxtemplater)
                denunciantes: inquiry.denunciantes?.map((d: any) => d.nome).join('\n') || '',
                denunciados: inquiry.denunciados?.map((d: any) => d.nome).join('\n') || '',

                // Dates
                ocorrencia: inquiry.data_ocorrencia ? format(new Date(inquiry.data_ocorrencia), 'dd/MM/yyyy') : '',
                autuacao: inquiry.data_participacao ? format(new Date(inquiry.data_participacao), 'dd/MM/yyyy') : '',
                registo: inquiry.created_at ? format(new Date(inquiry.created_at), 'dd/MM/yyyy') : '',
                data_atual: format(new Date(), 'dd/MM/yyyy'),
            }

            const docBlob = await fillDocxTemplate('/templates/capa.docx', formData)

            const fileName = `Inquerito_${inquiry.nuipc.replace(/\//g, '-')}.docx`
            downloadDocx(docBlob, fileName)
            toast.success("Documento Word exportado com sucesso!")

        } catch (error) {
            console.error(error)
            toast.error("Erro ao exportar. Verifique se '/templates/capa.docx' existe.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Imprimir capa do processo
        </Button>
    )
}
