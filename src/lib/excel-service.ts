
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

export async function generateMapsExcel(processosData: any[], inqueritosData: any[], correspondenciaData: any[]) {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SII'
    workbook.created = new Date()

    // --- DATA SPLITTING ---
    // Deprecadas are identified by 'DEPRECADA' in observacoes
    const externosData = inqueritosData.filter(i => !i.observacoes?.toUpperCase().includes('DEPRECADA'))
    const precatoriasData = inqueritosData.filter(i => i.observacoes?.toUpperCase().includes('DEPRECADA'))

    // --- SHEET 1: PROCESSOS CRIME ---
    const sheet1 = workbook.addWorksheet('PROCESSOS CRIME')

    sheet1.columns = [
        { header: 'NUIPC', key: 'nuipc', width: 25 },
        { header: 'Data de Registo', key: 'data_registo', width: 15 },
        { header: 'Detidos', key: 'detidos', width: 10 },
        { header: 'Nacionalidade', key: 'nacionalidade', width: 20 },
        { header: 'Localização', key: 'localizacao', width: 20 },
        { header: 'Tipo de Crime', key: 'tipo_crime', width: 30 },
        { header: 'Denunciante / Vítima / Ofendido', key: 'intervenientes_dv', width: 40 },
        { header: 'Arguido / Suspeito', key: 'intervenientes_as', width: 30 },
        { header: 'Data Envio', key: 'data_envio', width: 15 },
        { header: 'Ofício Envio', key: 'oficio_envio', width: 15 },
        { header: 'Entidade Destino', key: 'entidade_destino', width: 25 },
        { header: 'Observações', key: 'observacoes', width: 50 },
    ]

    const headerRow = sheet1.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } }

    processosData.forEach(p => {
        const detidosStr = p.detidos ? 'SIM' : 'NÃO'
        let nacionalidadesStr = '-'
        if (p.sp_detidos_info && p.sp_detidos_info.length > 0) {
            const nacs = p.sp_detidos_info.map((d: any) => d.nacionalidade).filter(Boolean)
            nacionalidadesStr = [...new Set(nacs)].join(', ')
        }

        const denunciante = p.denunciante ? `Denunciante: ${p.denunciante}` : ''
        const vitima = p.vitima ? `Vítima: ${p.vitima}` : ''
        const dvParts = [denunciante, vitima].filter(Boolean)
        const dvStr = dvParts.length > 0 ? dvParts.join('\n') : '-'

        const dataRegisto = p.data_registo ? format(new Date(p.data_registo), 'dd/MM/yyyy') : '-'
        const dataEnvio = p.envio_em ? format(new Date(p.envio_em), 'dd/MM/yyyy') : '-'

        sheet1.addRow({
            nuipc: p.nuipc_completo || '-',
            data_registo: dataRegisto,
            detidos: detidosStr,
            nacionalidade: nacionalidadesStr,
            localizacao: p.localizacao || '-',
            tipo_crime: p.tipo_crime || '-',
            intervenientes_dv: dvStr,
            intervenientes_as: p.arguido || '-',
            data_envio: dataEnvio,
            oficio_envio: p.numero_oficio_envio || '-',
            entidade_destino: p.entidade_destino || '-',
            observacoes: p.observacoes || '-'
        })
    })

    // --- SHEET 2: Processos externos ---
    const sheet2 = workbook.addWorksheet('Processos externos')

    sheet2.columns = [
        { header: 'Data Entrada', key: 'data_entrada', width: 15 },
        { header: 'NUIPC', key: 'nuipc', width: 25 },
        { header: 'Tipo de Crime', key: 'tipo_crime', width: 30 },
        { header: 'Data Distribuição', key: 'data_distribuicao', width: 15 },
        { header: 'Investigador', key: 'investigador', width: 25 },
        { header: 'Lesados / Ofendido', key: 'lesados', width: 40 },
        { header: 'Arguido / Suspeito', key: 'arguidos', width: 30 },
        { header: 'Data Conclusão', key: 'data_conclusao', width: 15 },
        { header: 'Nº Ofício Saída', key: 'numero_oficio', width: 15 },
        { header: 'Data Envio', key: 'data_envio', width: 15 },
        { header: 'Destino', key: 'destino', width: 25 },
    ]

    const headerRow2 = sheet2.getRow(1)
    headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCB4B16' } }

    externosData.forEach(i => {
        const dataEntrada = i.created_at ? format(new Date(i.created_at), 'dd/MM/yyyy') : '-'
        const dataDist = i.data_atribuicao ? format(new Date(i.data_atribuicao), 'dd/MM/yyyy') : '-'
        const dataConclusao = i.data_conclusao ? format(new Date(i.data_conclusao), 'dd/MM/yyyy') : '-'

        let lesadosStr = '-'
        if (i.denunciantes && Array.isArray(i.denunciantes)) { lesadosStr = i.denunciantes.map((d: any) => d.nome).join(', ') }
        let arguidosStr = '-'
        if (i.denunciados && Array.isArray(i.denunciados)) { arguidosStr = i.denunciados.map((d: any) => d.nome).join(', ') }

        sheet2.addRow({
            data_entrada: dataEntrada,
            nuipc: i.nuipc || '-',
            tipo_crime: i.tipo_crime || '-',
            data_distribuicao: dataDist,
            investigador: i.profiles?.full_name || '-',
            lesados: lesadosStr,
            arguidos: arguidosStr,
            data_conclusao: dataConclusao,
            numero_oficio: i.numero_oficio || '-',
            data_envio: dataConclusao,
            destino: i.destino || '-'
        })
    })

    // --- SHEET 3: Precatorias ---
    const sheet3 = workbook.addWorksheet('Precatorias')

    sheet3.columns = [
        { header: 'Data Entrada', key: 'data_entrada', width: 15 },
        { header: 'Origem', key: 'origem', width: 25 }, // NEW COLUMN
        { header: 'NUIPC', key: 'nuipc', width: 25 },
        { header: 'Tipo de Crime', key: 'tipo_crime', width: 30 },
        { header: 'Data Distribuição', key: 'data_distribuicao', width: 15 },
        { header: 'Investigador', key: 'investigador', width: 25 },
        { header: 'Lesados / Ofendido', key: 'lesados', width: 40 },
        { header: 'Arguido / Suspeito', key: 'arguidos', width: 30 },
        { header: 'Data Conclusão', key: 'data_conclusao', width: 15 },
        { header: 'Nº Ofício Saída', key: 'numero_oficio', width: 15 },
        { header: 'Data Envio', key: 'data_envio', width: 15 },
        { header: 'Destino', key: 'destino', width: 25 },
        { header: 'Assunto', key: 'assunto', width: 30 },
        { header: 'Observações', key: 'observacoes', width: 40 },
    ]

    const headerRow3 = sheet3.getRow(1)
    headerRow3.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } } // Blue

    precatoriasData.forEach(i => {
        const dataEntrada = i.created_at ? format(new Date(i.created_at), 'dd/MM/yyyy') : '-'
        const dataDist = i.data_atribuicao ? format(new Date(i.data_atribuicao), 'dd/MM/yyyy') : '-'
        const dataConclusao = i.data_conclusao ? format(new Date(i.data_conclusao), 'dd/MM/yyyy') : '-'

        let lesadosStr = '-'
        if (i.denunciantes && Array.isArray(i.denunciantes)) { lesadosStr = i.denunciantes.map((d: any) => d.nome).join(', ') }
        let arguidosStr = '-'
        if (i.denunciados && Array.isArray(i.denunciados)) { arguidosStr = i.denunciados.map((d: any) => d.nome).join(', ') }

        sheet3.addRow({
            data_entrada: dataEntrada,
            origem: (i as any).origem || '-', // NEW FIELD
            nuipc: i.nuipc || '-',
            tipo_crime: i.tipo_crime || '-',
            data_distribuicao: dataDist,
            investigador: i.profiles?.full_name || '-',
            lesados: lesadosStr,
            arguidos: arguidosStr,
            data_conclusao: dataConclusao,
            numero_oficio: i.numero_oficio || '-',
            data_envio: dataConclusao,
            destino: i.destino || '-',
            assunto: '',
            observacoes: i.observacoes || '-'
        })
    })

    // --- SHEET 4: Apreencoes ---
    const sheet4 = workbook.addWorksheet('Apreencoes')

    sheet4.columns = [
        { header: 'NUIPC', key: 'nuipc', width: 25 },
        { header: 'Data Entrada', key: 'data_entrada', width: 15 },
        { header: 'Itens Apreendidos', key: 'itens', width: 60 },
        { header: 'Data Saída', key: 'data_saida', width: 15 },
        { header: 'Destino', key: 'destino', width: 25 },
    ]

    const headerRow4 = sheet4.getRow(1)
    headerRow4.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } } // Red

    // Filter processes with seizures
    const apreensoesData = processosData.filter(p => {
        const hasGeneric = p.sp_apreensoes_info && p.sp_apreensoes_info.length > 0
        const hasDrugs = p.sp_apreensoes_drogas && (
            (Array.isArray(p.sp_apreensoes_drogas) && p.sp_apreensoes_drogas.length > 0) ||
            (!Array.isArray(p.sp_apreensoes_drogas) && p.sp_apreensoes_drogas) // Single object check?
        )
        // Check if the boolean flag is trusted or if we should rely on data presence.
        // User said "NUIPC que tenha apreensoes".
        return p.apreensoes || hasGeneric || hasDrugs
    })

    apreensoesData.forEach(p => {
        // Format Items
        let itensStr = ''

        // 1. Generic
        if (p.sp_apreensoes_info && p.sp_apreensoes_info.length > 0) {
            itensStr += p.sp_apreensoes_info.map((a: any) => `${a.tipo}: ${a.descricao}`).join('\n')
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
                if (itensStr) itensStr += '\n---\n'
                itensStr += drugLines.join('\n')
            }
        }

        const dataEntrada = p.data_registo ? format(new Date(p.data_registo), 'dd/MM/yyyy') : '-'
        const dataSaida = p.envio_em ? format(new Date(p.envio_em), 'dd/MM/yyyy') : '-'

        sheet4.addRow({
            nuipc: p.nuipc_completo || '-',
            data_entrada: dataEntrada,
            itens: itensStr || 'Sem detalhes registados',
            data_saida: dataSaida,
            destino: p.entidade_destino || '-'
        })
    })

    // --- SHEET 5: CPCJ (Placeholder) ---
    const sheet5 = workbook.addWorksheet('CPCJ')
    sheet5.columns = [{ header: 'A aguardar mapeamento...', key: 'placeholder', width: 30 }]

    // --- SHEET 6: Correspondencia ---
    const sheet6 = workbook.addWorksheet('Correspondencia')

    sheet6.columns = [
        { header: 'Data Entrada', key: 'data_entrada', width: 15 },
        { header: 'SRV', key: 'srv', width: 15 },
        { header: 'Nº Ofício', key: 'numero_oficio', width: 15 },
        { header: 'NUIPC', key: 'nuipc', width: 25 },
        { header: 'Origem', key: 'origem', width: 25 },
        { header: 'Assunto', key: 'assunto', width: 40 },
        { header: 'Destino', key: 'destino', width: 25 },
    ]

    const headerRow6 = sheet6.getRow(1)
    headerRow6.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9333EA' } } // Purple

    if (correspondenciaData) {
        correspondenciaData.forEach(c => {
            const dataEntrada = c.data_entrada ? format(new Date(c.data_entrada), 'dd/MM/yyyy') : '-'

            sheet6.addRow({
                data_entrada: dataEntrada,
                srv: c.srv || '-',
                numero_oficio: c.numero_oficio || '-',
                nuipc: c.nuipc || '-',
                origem: c.origem || '-',
                assunto: c.assunto || '-',
                destino: c.destino || '-'
            })
        })
    }

    // --- OTHER SHEETS ---
    const otherSheets = [
        // 'Correspondencia',
        'Estado da Nacao'
    ]

    otherSheets.forEach(sheetName => {
        workbook.addWorksheet(sheetName)
    })

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Download
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `Mapas_SP_${new Date().toISOString().split('T')[0]}.xlsx`)
}
