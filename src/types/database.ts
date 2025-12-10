export type InquiryStatus = 'por_iniciar' | 'em_diligencias' | 'tribunal' | 'concluido' | 'aguardando_resposta'
export type InquiryClassification = 'normal' | 'relevo'

export interface Inquiry {
    id: string
    nuipc: string
    data_ocorrencia: string | null
    data_participacao: string | null
    data_atribuicao: string | null
    data_inicio_investigacao: string | null
    tipo_crime: string | null
    estado: InquiryStatus
    classificacao: InquiryClassification
    observacoes: string | null
    numero_oficio: string | null
    denunciantes: { nome: string }[] | null // New JSONB field
    denunciados: { nome: string }[] | null  // New JSONB field
    // localizacao: string | null // Removed
    data_conclusao: string | null
    created_at: string
    user_id: string
}

export interface Diligence {
    id: string
    inquerito_id: string
    descricao: string
    entidade: string | null
    data_solicitacao: string | null
    data_enviado: string | null  // renamed from data_prevista
    status: 'a_realizar' | 'realizado' | 'enviado_aguardar'  // new field
    estado: 'pendente' | 'respondida' | 'recusada'
    tipo: string | null
    created_at: string
    // Joined fields
    inqueritos?: Inquiry
}

export interface Link {
    id: string
    inquerito_a: string
    inquerito_b: string
    razao: string | null
    created_at: string
}

export interface Profile {
    id: string
    email: string | null
    full_name: string | null
    role: 'user' | 'admin'
    created_at: string
}

export interface OficioCategory {
    id: string
    name: string
    icon: string | null
    created_at: string
}

export interface OficioTemplate {
    id: string
    category_id: string
    title: string
    recipient?: string | null // Displayed as "Destinatário" (Default/Legacy)
    recipients?: { label: string; content: string }[] | null // Multiple destinations
    subject?: string | null // Displayed as "Assunto"
    content: string
    created_at: string
}

export interface Notification {
    id: string
    user_id: string
    type: string
    title: string
    message: string
    link: string | null
    read: boolean
    created_at: string
}

export type SuggestionStatus = 'enviada' | 'aberta' | 'em_tratamento' | 'implementado'
export type SuggestionType = 'bug' | 'sugestao'

export interface Suggestion {
    id: string
    user_id: string | null
    titulo: string
    descricao: string
    tipo: SuggestionType
    status: SuggestionStatus
    created_at: string
    // Joined
    profiles?: Profile
}
