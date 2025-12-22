
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('--- sp_processos_crime columns ---')
    const { data: pData, error: pError } = await supabase
        .from('sp_processos_crime')
        .select('*')
        .limit(1)

    if (pError) console.error(pError)
    else if (pData && pData.length > 0) console.log(Object.keys(pData[0]))
    else console.log('No data found in sp_processos_crime')

    console.log('\n--- sp_inqueritos_externos columns ---')
    const { data: eData, error: eError } = await supabase
        .from('sp_inqueritos_externos')
        .select('*')
        .limit(1)

    if (eError) console.error(eError)
    else if (eData && eData.length > 0) console.log(Object.keys(eData[0]))
    else console.log('No data found in sp_inqueritos_externos')
}

checkSchema()
