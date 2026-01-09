
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function importVeiculos() {
    const filePath = path.join(process.cwd(), 'src/app/sg/apreensoes/veiculos/viaturas.xlsx')

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`)
        process.exit(1)
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)

    const worksheet = workbook.getWorksheet(1)

    if (!worksheet) {
        console.error('First worksheet not found')
        process.exit(1)
    }

    console.log(`Reading file: ${filePath}`)
    console.log(`Row count: ${worksheet.rowCount}`)

    const rows: any[] = []

    // Iterate over all rows that have values in a sheet
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Skip header

        // Map columns (adjust indices based on file structure)
        // "matricula", "Marca/Modelo", "NUIPC", "Data NUIPC", "Chave? SIM/NAO", "Entregue?", "Deposito no SDTER? SIM/Nao"
        // Assuming order: 1, 2, 3, 4, 5, 6, 7

        const matricula = row.getCell(1).text?.trim()
        const marcaModelo = row.getCell(2).text?.trim()
        const nuipc = row.getCell(3).text?.trim()

        // Date parsing
        let dataNuipc: string | null = null
        const dateCell = row.getCell(4).value
        if (dateCell) {
            if (dateCell instanceof Date) {
                dataNuipc = dateCell.toISOString().split('T')[0]
            } else if (typeof dateCell === 'string') {
                const parts = dateCell.split('/') // Expecting DD/MM/YYYY?
                if (parts.length === 3) {
                    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                    if (!isNaN(d.getTime())) dataNuipc = d.toISOString().split('T')[0]
                }
            }
        }

        const chaveVal = row.getCell(5).text?.trim().toUpperCase()
        const entregueVal = row.getCell(6).text?.trim().toUpperCase()
        const depositoVal = row.getCell(7).text?.trim().toUpperCase()

        const chaveExistente = chaveVal === 'SIM'
        const entregue = entregueVal === 'SIM' || entregueVal === 'ENTREGUE'
        const depositoSdk = depositoVal === 'SIM'

        if (matricula || nuipc) {
            rows.push({
                matricula,
                marca_modelo: marcaModelo,
                nuipc,
                data_nuipc: dataNuipc,
                chave_existente: chaveExistente,
                entregue,
                deposito_sdter: depositoSdk
            })
        }
    })

    console.log(`Parsed ${rows.length} rows. Uploading to Supabase...`)

    // Batch insert
    const batchSize = 100
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const { error } = await supabase
            .from('sp_apreensoes_veiculos')
            .insert(batch)

        if (error) {
            console.error('Error inserting batch:', error)
        } else {
            console.log(`Inserted batch ${i / batchSize + 1}`)
        }
    }

    console.log('Import completed.')
}

importVeiculos().catch(console.error)
