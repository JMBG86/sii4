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
    destino: string | null
    created_at: string
    user_id: string | null
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
    access_sp?: boolean
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


export interface Correspondence {
    id: string
    srv: string
    numero_oficio: string
    nuipc?: string
    origem: string
    assunto: string
    destino: string
    data_entrada: string
    created_at: string
    updated_at: string
}

export interface SPEntidade {
    id: string
    nome: string
    created_at: string
}

export interface SPProcessoCrime {
    id: string
    numero_sequencial: number
    nuipc_completo?: string
    data_registo?: string
    data_factos?: string
    data_conhecimento?: string
    detidos: boolean
    // nacionalidade removed
    total_detidos?: number // New field
    localizacao?: string
    tipo_crime?: string
    denunciante?: string
    vitima?: string
    arguido?: string
    envio_em?: string
    numero_oficio_envio?: string
    entidade_destino?: string
    observacoes?: string
    // New Flags
    criancas_sinalizadas?: boolean
    apreensoes?: boolean
    imagens_associadas?: boolean // New Flag
    notificacao_imagens?: boolean // New Flag: Notification sent?
    // Joined
    sp_apreensoes_info?: { tipo: string }[]
    sp_apreensoes_drogas?: { id: string }[] | any
    created_at: string
    updated_at: string
}

export interface SPDetidoInfo {
    id: string
    processo_id: string
    nacionalidade: string
    quantidade: number
    sexo?: string // New
    created_at: string
}

export interface SPCriancaInfo {
    id: string
    processo_id: string
    nome: string    // Changed from nacionalidade/qtd
    idade: number   // Changed from nacionalidade/qtd
    created_at: string
}

export interface SPApreensaoInfo {
    id: string
    processo_id: string
    tipo: string
    descricao: string
    created_at: string
}

export interface SPApreensaoDroga {
    id: string
    processo_id: string
    heroina_g: number
    cocaina_g: number
    cannabis_folhas_g: number
    cannabis_resina_g: number
    cannabis_oleo_g: number
    sinteticas_g: number
    cannabis_plantas_un: number
    substancias_psicoativas_un: number
    created_at: string
}

export interface SPInqueritoExterno {
    id: string
    srv?: string
    numero_oficio?: string
    nuipc: string // Mandatory per user request
    origem?: string
    assunto?: string
    destino?: string
    data_entrada?: string
    observacoes?: string
    created_at: string
}
