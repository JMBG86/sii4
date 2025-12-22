'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getContacts(searchTerm = '') {
    const supabase = await createClient()

    let query = supabase
        .from('phonebook_entries')
        .select('*')
        .order('department', { ascending: true }) // Sort by Department first
        .order('name', { ascending: true })       // Then by Name

    if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching contacts:', error)
        return []
    }
    return data
}

export async function getDepartments() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('phonebook_entries')
        .select('department')
        .not('department', 'is', null)
        .order('department')

    if (error) {
        console.error('Error fetching departments:', error)
        return []
    }

    // Return unique departments
    const unique = Array.from(new Set(data?.map(d => d.department).filter(Boolean) as string[]))
    return unique
}

export async function addContact(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const department = formData.get('department') as string
    const phone = formData.get('phone') as string
    const mobile = formData.get('mobile') as string
    const email = formData.get('email') as string

    if (!name) return { error: 'Name is required' }

    const { error } = await supabase
        .from('phonebook_entries')
        .insert({
            name,
            department,
            phone,
            mobile,
            email,
            user_id: user.id
        })

    if (error) {
        console.error('Error adding contact:', error)
        return { error: error.message }
    }

    revalidatePath('/lista-telefonica')
    return { success: true }
}

export async function updateContact(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const name = formData.get('name') as string
    // Department can be new or existing, just save it as string
    const department = formData.get('department') as string
    const phone = formData.get('phone') as string
    const mobile = formData.get('mobile') as string
    const email = formData.get('email') as string

    if (!name) return { error: 'Name is required' }

    const { error } = await supabase
        .from('phonebook_entries')
        .update({
            name,
            department,
            phone,
            mobile,
            email
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating contact:', error)
        return { error: error.message }
    }

    revalidatePath('/lista-telefonica')
    return { success: true }
}

export async function deleteContact(id: string) {
    const supabase = await createClient()

    // Optional: Check ownership or admin role? 
    // For now allow any auth user to delete for simplicity or restrict later.
    const { error } = await supabase.from('phonebook_entries').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/lista-telefonica')
    return { success: true }
}

export async function seedContacts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const contacts = [
        { name: 'Centro Distrital de Solidariedade e Segurança Social Faro', phone: '300 519 000', email: 'cdssfaro.tb@seg-social.pt', department: 'Segurança Social' },
        { name: 'Direcção de Finanças de Faro - Apoio Técnico à Acção Criminal', phone: '289880400', email: 'dffaro@at.gov.pt', department: 'Finanças' },
        { name: 'UNCTE - Unidade Nacional de Combate ao Tráfico de Estupefacientes', phone: '211967000', email: 'dcite@pj.pt', department: 'Polícia Judiciária' },
        { name: 'Polícia Judiciária de Faro', phone: '289884500', email: 'Diretoria.faro@pj.pt', department: 'Polícia Judiciária' },
        { name: 'MP Loulé', phone: '289401432', email: 'mp.loule.tc@tribunais.org.pt', department: 'Ministério Público' },
        { name: 'SEF - Investigação Faro', phone: '289800309', email: 'dralg.analise@sef.pt', department: 'SEF' },
        { name: 'Operadora NOWO', phone: '210801080', email: 'Info@nowo.pt', department: 'Telecomunicações' },
        { name: 'MEO - Susana Coelho', mobile: '962503563', email: 'susana-coelho@telecom.pt', department: 'Telecomunicações' },
        { name: 'Vodafone - Margarida Vilão', mobile: '919555225', email: 'maria.vilao@vodafone.com', department: 'Telecomunicações' },
        { name: 'Apple - Law Enforcement Compliance', email: 'law.enf.emeia@apple.com', department: 'Tecnologia' },
        { name: 'Millennium BCP - Informações Judiciais', phone: '211130773', email: 'Info.judiciais@millenniumbcp.pt', department: 'Banca' },
        { name: 'Santander Totta - Filipe Pires (Diretor)', phone: '289420220', mobile: '938881121', email: 'filipe.pires@santander.pt', department: 'Banca' },
        { name: 'Unicâmbio - Compliance', mobile: '966982185', email: 'compliance@unicambio.pt', department: 'Pagamentos' },
        { name: 'SIBS - Fraude', phone: '217813000', email: 'investigations.fraud@sibs.com', department: 'Banca' },
        { name: 'CTT - Segurança', phone: '210471136', email: 'seguranca.correios@ctt.pt', department: 'Logística' },
        { name: 'Worten Loulé - Ricardo (Gerente)', mobile: '936823569', department: 'Retalho' }
    ]

    const toInsert = contacts.map(c => ({
        ...c,
        user_id: user.id
    }))

    const { error } = await supabase.from('phonebook_entries').insert(toInsert)

    if (error) {
        console.error('Error seeding contacts:', error)
        return { error: error.message }
    }

    revalidatePath('/lista-telefonica')
    return { success: true }
}
