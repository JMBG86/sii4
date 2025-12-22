'use server'

import { createClient } from "@/lib/supabase/server"

export async function checkImageAlertsAction() {
    try {
        const supabase = await createClient()
        const { error } = await supabase.rpc('check_and_insert_image_alerts')

        if (error) {
            console.error('Error triggering image alerts:', error)
            return { success: false, error: error.message }
        }
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in checkImageAlertsAction:', err)
        return { success: false, error: 'Internal Server Error' }
    }
}
