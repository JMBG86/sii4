'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnassignedInquiries() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('inqueritos')
        .select('*')
        .is('user_id', null)
        .eq('estado', 'por_iniciar') // Likely pending start
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getUsers() {
    const supabase = await createClient()

    // Get profiles with roles or just all users? Usually admin assigns to investigators.
    // For now, get all profiles
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')

    if (error) {
        return []
    }

    return data
}

export async function assignInquiry(inquiryId: string, userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('inqueritos')
        .update({
            user_id: userId,
            data_atribuicao: new Date().toISOString()
        })
        .eq('id', inquiryId)
        .select()

    if (error) {
        return { error: error.message }
    }

    if (!data || data.length === 0) {
        return { error: 'Inquérito não encontrado ou sem permissão (RLS).' }
    }

    revalidatePath('/admin/distribuicao')
    revalidatePath('/inqueritos')
    return { success: true }
}

export async function getSuggestedAssignments(inquiryIds: string[]) {
    const supabase = await createClient()

    if (!inquiryIds || inquiryIds.length === 0) return {}

    // 1. Get NUIPCs and Observations for these inquiries
    const { data: currentInqs } = await supabase
        .from('inqueritos')
        .select('id, nuipc, observacoes')
        .in('id', inquiryIds)

    if (!currentInqs || currentInqs.length === 0) return {}

    const suggestions: Record<string, string> = {}
    const nuipcsToSearch: string[] = []

    // 2. First pass: Check observations for "[Anterior Responsável: UUID]" tag
    currentInqs.forEach(inq => {
        if (inq.observacoes) {
            const match = inq.observacoes.match(/\[Anterior Responsável: ([0-9a-fA-F-]+)\]/)
            if (match && match[1]) {
                suggestions[inq.id] = match[1]
            } else {
                if (inq.nuipc) nuipcsToSearch.push(inq.nuipc)
            }
        } else {
            if (inq.nuipc) nuipcsToSearch.push(inq.nuipc)
        }
    })

    // 3. Second pass: For remaining NUIPCs, find the most recent PREVIOUS owner in history
    if (nuipcsToSearch.length > 0) {
        const { data: historical } = await supabase
            .from('inqueritos')
            .select('nuipc, user_id, created_at')
            .in('nuipc', nuipcsToSearch)
            .not('user_id', 'is', null)
            .order('created_at', { ascending: false })

        if (historical) {
            currentInqs.forEach(curr => {
                // Skip if already found via observations
                if (suggestions[curr.id]) return

                const match = historical.find(h => h.nuipc === curr.nuipc && h.user_id)
                if (match) {
                    suggestions[curr.id] = match.user_id
                }
            })
        }
    }

    return suggestions
}
