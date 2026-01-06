
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Config')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log('Updating 2025 Precatorias Stock to 92...')

    // Check if 2025 exists
    const { data: existing } = await supabase.from('sp_config_years').select('*').eq('year', 2025).single()

    let error
    if (existing) {
        const { error: err } = await supabase
            .from('sp_config_years')
            .update({ stock_precatorias_start: 92 })
            .eq('year', 2025)
        error = err
    } else {
        const { error: err } = await supabase
            .from('sp_config_years')
            .insert({
                year: 2025,
                stock_processos_start: 539, // Keep existing check
                stock_precatorias_start: 92,
                is_active: false
            })
        error = err
    }

    if (error) {
        console.error('Error updating stock:', error)
    } else {
        console.log('Success! 2025 Precatorias Stock set to 92.')
    }
}

run()
