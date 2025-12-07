export type InquiryStatus = 'por_iniciar' | 'em_diligencias' | 'tribunal' | 'concluido' | 'aguardando_resposta'
export type InquiryClassification = 'normal' | 'relevo'

export interface Inquiry {
    id: string
    nuipc: string
    data_ocorrencia: string | null
    data_participacao: string | null
    data_inicio_investigacao: string | null
    tipo_crime: string | null
    estado: InquiryStatus
    classificacao: InquiryClassification
    localizacao: string | null
    observacoes: string | null
    numero_oficio: string | null
    data_conclusao: string | null
    created_at: string
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
