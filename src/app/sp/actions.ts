import { createClient } from "@/lib/supabase/client"

export async function checkImageAlertsAction() {
    try {
        const supabase = createClient()
        // Client side RPC call
        // Ensure RLS allows the user to execute this or the function security definer handles it
        const { error } = await supabase.rpc('check_and_insert_image_alerts')

        if (error) {
            console.error('Error triggering image alerts:', error)
            return { success: false, error: error.message }
        }
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in checkImageAlertsAction:', err)
        return { success: false, error: 'Internal Client Error' }
    }
}
