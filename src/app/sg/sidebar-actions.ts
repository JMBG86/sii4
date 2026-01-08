'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSidebarCounts() {
    const supabase = await createClient()

    // 1. Drugs: Count where delivered to LPC is false
    const { count: drugsCount } = await supabase
        .from('sp_apreensoes_drogas')
        .select('*', { count: 'exact', head: true })
        .eq('entregue_lpc', false)

    // 2. Numerário: Count where 'remetido' is false
    const { count: cashCount } = await supabase
        .from('sp_apreensoes_info')
        .select('*', { count: 'exact', head: true })
        .ilike('tipo', '%Numerário%')
        .eq('remetido', false)

    // 3. Telemóveis: Count where 'remetido' is false
    const { count: phonesCount } = await supabase
        .from('sp_apreensoes_info')
        .select('*', { count: 'exact', head: true })
        .ilike('tipo', '%Telemoveis%') // Matches "Material Informático: Telemoveis"
        .eq('remetido', false)

    // 4. Armas: Count where 'remetido' is false
    const { count: weaponsCount } = await supabase
        .from('sp_apreensoes_info')
        .select('*', { count: 'exact', head: true })
        .ilike('tipo', '%Armas%') // Matches "Armas: ..."
        .eq('remetido', false)

    return {
        drugs: drugsCount || 0,
        cash: cashCount || 0,
        phones: phonesCount || 0,
        weapons: weaponsCount || 0
    }
}
