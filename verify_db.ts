import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log('Checking sp_processos_crime schema...')
    const { data, error } = await supabase.from('sp_processos_crime').select('total_detidos').limit(1)
    if (error) {
        console.error('Error selecting total_detidos:', error.message)
    } else {
        console.log('Success! Column total_detidos exists. Example data:', data)
    }
}

check()
