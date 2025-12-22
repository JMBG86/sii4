
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Simple .env parser since dotenv might not be available
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            envConfig[key] = val;
        }
    });
}

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const tables = ['sp_processos_crime', 'sp_inqueritos_externos', 'inqueritos'];

    for (const t of tables) {
        console.log(`\n--- ${t} ---`);
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (error) console.error(error.message);
        else if (data && data.length > 0) console.log(Object.keys(data[0]).join(', '));
        else console.log('No data found');
    }
}

check();
