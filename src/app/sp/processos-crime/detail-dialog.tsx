'use client'

import { useState, useEffect } from 'react'
import { SPProcessoCrime, SPEntidade, SPDetidoInfo } from '@/types/database'
import { updateProcesso, getEntidades, createEntidade, getDetidos, deleteProcesso, getCrimeTypes, createCrimeType } from './actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { COUNTRIES } from '@/constants/countries'
import { CrimeTypeSelect } from '../components/crime-type-select'
import { LocationPickerModal } from '@/components/maps/location-picker-modal'

const WEAPON_CONFIG: Record<string, string[]> = {
    'Armas de fogo': [
        'Pistola', 'Revolver', 'Semi-automatica (excepto pistola)', 'Automatica',
        'Carabinas', 'Espingardas (Caça)', 'Modificadas (Ex. canos serrados)',
        'Transformadas (ex. gás para real)', 'Inutilizada ou desativada',
        'Obsoleta', 'Replica', 'Outra'
    ],
    'Armas de alarme ou salva': [
        'Pistola de alarme ou salva', 'Espingarda de Alarme ou salva', 'Outra'
    ],
    'Armas de ar comprimido': [
        'Espingarda ar comprimido até 5.5', 'Espingarda ar comprimido + 5.5',
        'Pistola ar comprimido até 5.5', 'Pistola + 5.5', 'Marcador de Paintball'
    ],
    'Armas brancas': [
        'Arco', 'Besta', 'Arpão', 'Lanca', 'Machado', 'Espada', 'Sabre', 'Florete',
        'Catana', 'Cutelo', 'Punhal', 'Faca', 'Abertura automatica', 'Navalha',
        'X Acto', 'Outra'
    ],
    'Outros tipos de armas e objectos': [
        'Aerossol de defesa (spray)', 'Arma lancadora de gases', 'Armas electricas',
        'Soqueira', 'Bastao extensivel', 'Bastao', 'Moca', 'Pau', 'Pedra', 'Seringa'
    ],
    'Instrumentos de trabalho': [
        'Pe de Cabra', 'Picareta', 'Chave de Fendas', 'Martelo', 'Marreta', 'Enxada', 'Outra'
    ],
    'Artigos Desportivos': [
        'Taco de baseball', 'Taco de Golf', 'Matracas', 'Outra'
    ],
    'Outras': [
        'Outra'
    ]
}

const AMMO_CONFIG: Record<string, string[]> = {
    'De armas de Fogo': [
        '6.35mm', '7.62mm', '7.65mm', '9mm', 'Ponto 22', 'Ponto 32', 'Ponto 38', 'Ponto 44',
        'Calibre 9 Caça', 'Calibre 12 Caça', 'Calibre 20 Caça', 'Outros', 'Outros Caça'
    ],
    'De outras armas': [
        'Sinalizacao (pirotecnicos)', 'Gás', '7.62mm Salva', '8mm salva', '9mm salva',
        'Alarme (qualquer cal)', 'Outras', 'Esfera Paintball', 'Chumbos até 5.5',
        'Chumbos superior a 5.5mm'
    ]
}

const EXPLOSIVES_CONFIG: Record<string, string[]> = {
    'Engenhos explosivos convencionais': [
        'Granda de mão', 'Granada de espingarda', 'Granada de morteiro', 'Projeteis de artilharia',
        'Rockets', 'Bombas de avião', 'Cartuchos iluminados/sinalizacao', 'Espoletas', 'Outros'
    ],
    'Artigos de Pirotecnica': [
        'Foguetes', 'Bateria de foguete', 'Balonas', 'Tubos propulsores',
        'Petardos/Bombas/Bomboletas', 'Massa de tiro/Polvora pirotecnica(kg)', 'Outros'
    ],
    'Substancias e acessorios explosivos': [
        'TNT (kg)', 'Outros explosivos militares (KG)', 'Cordão detonante (m)', 'Cordao rapido (m)',
        'Cordao lento (m)', 'Dinamite (kg)', 'Hidrogel/emulsao (kg)', 'ANFO (kg)', 'Polvora (kg)',
        'Outros explosivos industriais (kg)', 'Fulminantes (kg)', 'Outros'
    ]
}

const IT_COMMS_TYPES = [
    'Telemoveis', 'Computadores', 'Radios (ER)', 'Disco Externo',
    'Pen Drive', 'Monitores', 'Cartoes de Memoria',
    'Consolas de jogo', 'CD', 'DVD', 'Ipad', 'Tablet', 'Outros'
]

const DOC_TYPES = [
    'Identidade (BI, CC, Passp, At. Resid, C. Cond, etc)',
    'Veiculos (Livrete, DU, Seguro, Inspecao, etc)',
    'Outros'
]

const VEHICLE_TYPES = [
    'Ligeiro Passageiros', 'Ligeiro de Mercadorias', 'Pesado de Passageiros', 'Pesado de mercadorias',
    'Motociclo', 'Ciclomotor', 'Velocipede', 'Triciclo', 'Trator', 'Moto 4', 'Microcar',
    'Trotineta a motor', 'Maquina industrial', 'Maquina agricola', 'Semi-reboque', 'Reboque',
    'Veiculo tracao animal', 'Indeterminado'
]

const CURRENCIES = ['Euros', 'Dolares', 'Libras', 'Outros']

// Custom "Creatable" Select for Entities
// Custom "Creatable" Select for Entities
function EntitySelect({ value, onChange, readOnly }: { value: string, onChange: (val: string) => void, readOnly?: boolean }) {
    const [entidades, setEntidades] = useState<SPEntidade[]>([])
    const [loading, setLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newEntidadeName, setNewEntidadeName] = useState('')

    useEffect(() => {
        getEntidades().then(setEntidades).catch(console.error)
    }, [])

    async function handleCreate() {
        if (!newEntidadeName) return
        setLoading(true)
        const res = await createEntidade(newEntidadeName)
        if (res.data) {
            setEntidades(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)))
            onChange(res.data.nome)
            setIsCreating(false)
        }
        setLoading(false)
    }

    if (isCreating) {
        return (
            <div className="flex gap-2">
                <Input
                    value={newEntidadeName}
                    onChange={e => setNewEntidadeName(e.target.value)}
                    placeholder="Nova Entidade..."
                    autoFocus
                />
                <Button type="button" size="icon" onClick={handleCreate} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
            </div>
        )
    }

    return (
        <Select value={value} onValueChange={(val) => {
            if (val === 'NEW_ENTRY') setIsCreating(true)
            else onChange(val)
        }} disabled={readOnly}>
            <SelectTrigger>
                <SelectValue placeholder="Selecione entidade" />
            </SelectTrigger>
            <SelectContent>
                {/* Always show SII ALBUFEIRA as an option */}
                <SelectItem value="SII ALBUFEIRA" className="font-semibold text-blue-600">SII ALBUFEIRA (Integração)</SelectItem>
                {entidades
                    .filter(e => e.nome !== 'SII ALBUFEIRA')
                    .map(e => (
                        <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>
                    ))}
                {!readOnly && <SelectItem value="NEW_ENTRY" className="text-blue-600 font-medium">+ Adicionar Nova</SelectItem>}
            </SelectContent>
        </Select>
    )
}

// Custom "Creatable" Select for Crime Types
// Custom "Creatable" Select for Crime Types
// Shared component used here

export function ProcessoDetailDialog({
    processo,
    open,
    onOpenChange,
    readOnly = false
}: {
    processo: SPProcessoCrime
    open: boolean
    onOpenChange: (open: boolean) => void
    readOnly?: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [detidos, setDetidos] = useState(processo.detidos || false)
    const [entidade, setEntidade] = useState(processo.entidade_destino || '')
    const [tipoCrime, setTipoCrime] = useState(processo.tipo_crime || '')

    // Location Logic
    const [locationModalOpen, setLocationModalOpen] = useState(false)
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(
        processo.latitude && processo.longitude ? { lat: processo.latitude, lng: processo.longitude } : null
    )

    // New Flags
    const [criancas, setCriancas] = useState(processo.criancas_sinalizadas || false)
    const [apreensoes, setApreensoes] = useState(processo.apreensoes || false)
    const [imagens, setImagens] = useState(processo.imagens_associadas || false)
    const [notificacao, setNotificacao] = useState(processo.notificacao_imagens || false)

    // UI State
    const [showArmas, setShowArmas] = useState(false)
    const [showAmmo, setShowAmmo] = useState(false)
    const [showExplosives, setShowExplosives] = useState(false)
    const [showVehicles, setShowVehicles] = useState(false)
    const [showIt, setShowIt] = useState(false)
    const [showDocs, setShowDocs] = useState(false)

    // Lists
    const [detaineesList, setDetaineesList] = useState<{ nacionalidade: string, quantidade: number, sexo: string }[]>([])
    const [childrenList, setChildrenList] = useState<{ nome: string, idade: number }[]>([])
    const [seizuresList, setSeizuresList] = useState<{ tipo: string, descricao: string }[]>([])

    // Drugs Object
    const [drugs, setDrugs] = useState<Partial<import('@/types/database').SPApreensaoDroga>>({})

    // Reset and Fetch
    useEffect(() => {
        setDetidos(processo.detidos || false)
        setCriancas(processo.criancas_sinalizadas || false)
        setApreensoes(processo.apreensoes || false)
        setImagens(processo.imagens_associadas || false)
        setNotificacao(processo.notificacao_imagens || false)
        setEntidade(processo.entidade_destino || '')
        setEntidade(processo.entidade_destino || '')
        setTipoCrime(processo.tipo_crime || '')
        setCoords(processo.latitude && processo.longitude ? { lat: processo.latitude, lng: processo.longitude } : null)
        setShowArmas(false)
        setShowAmmo(false)
        setShowExplosives(false)
        setShowVehicles(false)
        setShowIt(false)
        setShowDocs(false)

        if (open) {
            import('./actions').then(({ getDetidos, getCriancas, getApreensoes, getDrogas }) => {
                getDetidos(processo.id).then(data => {
                    setDetaineesList(data?.map((d: any) => ({ nacionalidade: d.nacionalidade, quantidade: d.quantidade, sexo: d.sexo || 'M' })) || [])
                })
                getCriancas(processo.id).then(data => {
                    setChildrenList(data?.map((d: any) => ({ nome: d.nome, idade: d.idade || 0 })) || [])
                })
                getApreensoes(processo.id).then(data => {
                    const list = data?.map((d: any) => ({ tipo: d.tipo, descricao: d.descricao })) || []
                    setSeizuresList(list)
                    // Auto-open sections if items exist
                    if (list.some((i: any) => i.tipo.startsWith('Armas:'))) setShowArmas(true)
                    if (list.some((i: any) => i.tipo.startsWith('Munições:'))) setShowAmmo(true)
                    if (list.some((i: any) => i.tipo.startsWith('Explosivos:'))) setShowExplosives(true)
                    if (list.some((i: any) => i.tipo.startsWith('Material Informático:'))) setShowIt(true)
                    if (list.some((i: any) => i.tipo.startsWith('Comunicações:'))) setShowIt(true) // handle both just in case
                    if (list.some((i: any) => i.tipo.startsWith('Veículos:'))) setShowVehicles(true)
                    if (list.some((i: any) => i.tipo.startsWith('Documentos:'))) setShowDocs(true)
                })
                getDrogas(processo.id).then(data => {
                    setDrugs(data || {})
                })
            })
        }
    }, [processo, open])

    // --- Detainees Handlers ---
    function addDetaineeRow() {
        setDetaineesList(prev => [...prev, { nacionalidade: 'Portuguesa', quantidade: 1, sexo: 'M' }])
    }
    function removeDetaineeRow(index: number) {
        setDetaineesList(prev => prev.filter((_, i) => i !== index))
    }
    function updateDetaineeRow(index: number, field: string, value: any) {
        setDetaineesList(prev => {
            const copy = [...prev]
            copy[index] = { ...copy[index], [field]: value }
            return copy
        })
    }

    // --- Children Handlers ---
    function addChildRow() {
        setChildrenList(prev => [...prev, { nome: '', idade: 0 }])
    }
    function removeChildRow(index: number) {
        setChildrenList(prev => prev.filter((_, i) => i !== index))
    }
    function updateChildRow(index: number, field: string, value: any) {
        setChildrenList(prev => {
            const copy = [...prev]
            copy[index] = { ...copy[index], [field]: value }
            return copy
        })
    }

    // --- Seizures Handlers ---
    function removeSeizureRow(index: number) {
        setSeizuresList(prev => prev.filter((_, i) => i !== index))
    }
    function updateSeizureRow(index: number, field: string, value: any) {
        setSeizuresList(prev => {
            const copy = [...prev]
            copy[index] = { ...copy[index], [field]: value }
            return copy
        })
    }
    function updateSeizureType(index: number, value: string) {
        setSeizuresList(prev => {
            const copy = [...prev]
            copy[index] = { ...copy[index], tipo: value }
            return copy
        })
    }

    // --- Drugs Handler ---
    function updateDrugField(field: keyof import('@/types/database').SPApreensaoDroga, value: number) {
        setDrugs(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.set('entidade_destino', entidade)
        formData.set('tipo_crime', tipoCrime)

        // Coordinates
        if (coords) {
            formData.set('latitude', coords.lat.toString())
            formData.set('longitude', coords.lng.toString())
        }

        // Booleans
        formData.set('detidos', detidos ? 'on' : 'off')
        formData.set('criancas_sinalizadas', criancas ? 'on' : 'off')
        formData.set('apreensoes', apreensoes ? 'on' : 'off')
        formData.set('imagens_associadas', imagens ? 'on' : 'off')
        formData.set('notificacao_imagens', notificacao ? 'on' : 'off')

        // Serialize Lists
        formData.set('detidos_info_json', detidos ? JSON.stringify(detaineesList) : '[]')
        formData.set('criancas_info_json', criancas ? JSON.stringify(childrenList) : '[]')

        // Serialize Generic Seizures
        formData.set('apreensoes_info_json', apreensoes ? JSON.stringify(seizuresList) : '[]')

        // Serialize Drugs
        formData.set('drogas_info_json', apreensoes ? JSON.stringify(drugs) : '{}')

        const result = await updateProcesso(processo.id, formData)
        setLoading(false)

        if (result?.error) {
            alert(result.error)
        } else {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[95vw] h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {readOnly ? 'Visualizar Processo' : (processo.nuipc_completo ? 'Editar Processo' : `Registar Processo - Sequencial #${processo.numero_sequencial}`)}
                    </DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <fieldset disabled={readOnly} className="grid grid-cols-2 gap-6 py-4 border-0 p-0 m-0 min-w-0 disabled:opacity-100">
                        {/* Column 1: Core Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nuipc_completo">NUIPC Completo</Label>
                                <Input id="nuipc_completo" name="nuipc_completo" defaultValue={processo.nuipc_completo || ''} placeholder="Ex: 500/25.3GBABF" required readOnly={readOnly} />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="data_registo">Data Registo</Label>
                                    <Input id="data_registo" name="data_registo" type="date" defaultValue={processo.data_registo?.split('T')[0] || new Date().toISOString().split('T')[0]} readOnly={readOnly} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="data_factos">Data Factos</Label>
                                    <Input id="data_factos" name="data_factos" type="date" defaultValue={processo.data_factos?.split('T')[0]} readOnly={readOnly} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="data_conhecimento">Data Conhec.</Label>
                                    <Input id="data_conhecimento" name="data_conhecimento" type="date" defaultValue={processo.data_conhecimento?.split('T')[0]} readOnly={readOnly} />
                                </div>
                            </div>

                            <div className="space-y-4 border p-3 rounded-md bg-slate-50 dark:bg-zinc-900/50">
                                {/* Detainees Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="detidos" name="detidos" checked={detidos} onCheckedChange={setDetidos} disabled={readOnly} />
                                        <Label htmlFor="detidos" className="font-semibold text-red-600">Existem Detidos?</Label>
                                    </div>

                                    {detidos && (
                                        <div className="space-y-3 mt-3 animate-in fade-in pl-2 border-l-2 border-red-200">
                                            {detaineesList.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <Input
                                                        type="number"
                                                        className="w-16"
                                                        min={1}
                                                        value={item.quantidade}
                                                        onChange={(e) => updateDetaineeRow(idx, 'quantidade', parseInt(e.target.value))}
                                                        readOnly={readOnly}
                                                    />
                                                    <Select value={item.sexo} onValueChange={(val) => updateDetaineeRow(idx, 'sexo', val)} disabled={readOnly}>
                                                        <SelectTrigger className="w-20">
                                                            <SelectValue placeholder="SX" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="M">M</SelectItem>
                                                            <SelectItem value="F">F</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Select value={item.nacionalidade} onValueChange={(val) => updateDetaineeRow(idx, 'nacionalidade', val)} disabled={readOnly}>
                                                        <SelectTrigger className="flex-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    {!readOnly && (
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDetaineeRow(idx)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            {!readOnly && (
                                                <Button type="button" variant="outline" size="sm" onClick={addDetaineeRow} className="w-full border-dashed text-muted-foreground border-red-200 hover:border-red-400 hover:text-red-600">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Adicionar Detidos
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Children Section */}
                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="criancas" checked={criancas} onCheckedChange={setCriancas} disabled={readOnly} />
                                        <Label htmlFor="criancas" className="font-semibold text-orange-600">Crianças Sinalizadas/Em Perigo?</Label>
                                    </div>

                                    {criancas && (
                                        <div className="space-y-3 mt-3 animate-in fade-in pl-2 border-l-2 border-orange-200">
                                            {childrenList.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <Input
                                                        placeholder="Nome da Criança"
                                                        className="flex-1"
                                                        value={item.nome}
                                                        onChange={(e) => updateChildRow(idx, 'nome', e.target.value)}
                                                        readOnly={readOnly}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Idade"
                                                        className="w-20"
                                                        min={0}
                                                        max={18}
                                                        value={item.idade}
                                                        onChange={(e) => updateChildRow(idx, 'idade', parseInt(e.target.value))}
                                                        readOnly={readOnly}
                                                    />
                                                    {!readOnly && (
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeChildRow(idx)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            {!readOnly && (
                                                <Button type="button" variant="outline" size="sm" onClick={addChildRow} className="w-full border-dashed text-muted-foreground border-orange-200 hover:border-orange-400 hover:text-orange-600">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Adicionar Crianças
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Seizures Section */}
                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="apreensoes" checked={apreensoes} onCheckedChange={setApreensoes} disabled={readOnly} />
                                        <Label htmlFor="apreensoes" className="font-semibold text-purple-600 text-base">Existem Apreensões?</Label>
                                    </div>

                                    {apreensoes && (
                                        <div className="space-y-6 mt-3 animate-in fade-in pl-4 border-l-2 border-purple-200">

                                            {/* Sub-Category: Estupefacientes */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="cat_drugs"
                                                            checked={Object.keys(drugs).length > 0}
                                                            onCheckedChange={(checked) => {
                                                                if (!checked) setDrugs({})
                                                                else setDrugs({ heroina_g: 0 }) // init with dummy to toggle on
                                                            }}
                                                            disabled={readOnly}
                                                        />
                                                        <Label htmlFor="cat_drugs" className="font-medium">Estupefacientes</Label>
                                                    </div>
                                                </div>

                                                {Object.keys(drugs).length > 0 && (
                                                    <div className="bg-purple-50 dark:bg-zinc-900/50 p-4 rounded-md grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Cocaína (g)</Label>
                                                            <Input type="number" step="0.01" value={drugs?.cocaina_g || ''} onChange={e => updateDrugField('cocaina_g', parseFloat(e.target.value))} className="h-8" readOnly={readOnly} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Heroína (g)</Label>
                                                            <Input type="number" step="0.01" value={drugs?.heroina_g || ''} onChange={e => updateDrugField('heroina_g', parseFloat(e.target.value))} className="h-8" readOnly={readOnly} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Haxixe/Resina (g)</Label>
                                                            <Input type="number" step="0.01" value={drugs?.cannabis_resina_g || ''} onChange={e => updateDrugField('cannabis_resina_g', parseFloat(e.target.value))} className="h-8" readOnly={readOnly} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Liamba/Folhas (g)</Label>
                                                            <Input type="number" step="0.01" value={drugs?.cannabis_folhas_g || ''} onChange={e => updateDrugField('cannabis_folhas_g', parseFloat(e.target.value))} className="h-8" readOnly={readOnly} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Óleo Cannabis (g)</Label>
                                                            <Input type="number" step="0.01" value={drugs?.cannabis_oleo_g || ''} onChange={e => updateDrugField('cannabis_oleo_g', parseFloat(e.target.value))} className="h-8" readOnly={readOnly} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Sintéticas (g)</Label>
                                                            <Input type="number" step="0.01" value={drugs?.sinteticas_g || ''} onChange={e => updateDrugField('sinteticas_g', parseFloat(e.target.value))} className="h-8" readOnly={readOnly} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Plantas (Un)</Label>
                                                            <Input type="number" value={drugs?.cannabis_plantas_un || ''} onChange={e => updateDrugField('cannabis_plantas_un', parseInt(e.target.value))} className="h-8" readOnly={readOnly} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Subst. Psicoativas (Un)</Label>
                                                            <Input type="number" value={drugs?.substancias_psicoativas_un || ''} onChange={e => updateDrugField('substancias_psicoativas_un', parseInt(e.target.value))} className="h-8" readOnly={readOnly} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-Category: Material Informático e Comunicações (NEW) */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="cat_it"
                                                        checked={showIt}
                                                        onCheckedChange={(checked) => {
                                                            setShowIt(checked)
                                                            if (!checked) {
                                                                setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Material Informático:')))
                                                            }
                                                        }}
                                                        disabled={readOnly}
                                                    />
                                                    <Label htmlFor="cat_it" className="font-medium">Material Informático e Comunicações</Label>
                                                </div>

                                                {showIt && (
                                                    <div className="pl-4 border-l-2 border-slate-200 dark:border-zinc-700 ml-2 space-y-3 mt-2">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Switch
                                                                    checked={seizuresList.some(s => s.tipo.startsWith('Material Informático:'))}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setSeizuresList(prev => [...prev, { tipo: `Material Informático: ${IT_COMMS_TYPES[0]}`, descricao: '1' }])
                                                                        } else {
                                                                            setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Material Informático:')))
                                                                        }
                                                                    }}
                                                                />
                                                                <Label className="text-sm">Equipamentos</Label>
                                                            </div>

                                                            {seizuresList.some(s => s.tipo.startsWith('Material Informático:')) && (
                                                                <div className="pl-4 animate-in slide-in-from-top-2 space-y-2">
                                                                    {seizuresList.filter(s => s.tipo.startsWith('Material Informático:')).map((item, idx) => {
                                                                        const realIdx = seizuresList.findIndex(s => s === item)
                                                                        const currentType = item.tipo.split(':')[1]?.trim() || IT_COMMS_TYPES[0]

                                                                        return (
                                                                            <div key={idx} className="flex gap-2 items-center">
                                                                                <Select
                                                                                    value={currentType}
                                                                                    onValueChange={(val) => updateSeizureType(realIdx, `Material Informático: ${val}`)}
                                                                                >
                                                                                    <SelectTrigger className="flex-1 h-8 text-sm">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {IT_COMMS_TYPES.map(vt => (
                                                                                            <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    placeholder="Qtd"
                                                                                    className="w-20 h-8 text-sm"
                                                                                    value={item.descricao}
                                                                                    onChange={(e) => updateSeizureRow(realIdx, 'descricao', e.target.value)}
                                                                                />
                                                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(realIdx)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-xs text-slate-500"
                                                                        onClick={() => setSeizuresList(prev => [...prev, { tipo: `Material Informático: ${IT_COMMS_TYPES[0]}`, descricao: '1' }])}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" /> Adicionar Equipamento
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-Category: Armas (Detailed) */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="cat_weapons"
                                                        checked={showArmas}
                                                        onCheckedChange={(checked) => {
                                                            setShowArmas(checked)
                                                            if (!checked) {
                                                                // Remove all Armas related items
                                                                setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Armas:')))
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="cat_weapons" className="font-medium">Armas</Label>
                                                </div>

                                                {/* Only show sub-options if showArmas is true */}
                                                {showArmas && (
                                                    <div className="pl-4 border-l-2 border-slate-200 dark:border-zinc-700 ml-2 space-y-3 mt-2">
                                                        {Object.entries(WEAPON_CONFIG).map(([weaponCategory, options]) => {
                                                            const fullTypePrefix = `Armas: ${weaponCategory}`
                                                            // Check if any item of this category exists
                                                            const existingItems = seizuresList.filter(s => s.tipo.startsWith(fullTypePrefix))
                                                            const hasAnyItem = existingItems.length > 0

                                                            return (
                                                                <div key={weaponCategory} className="space-y-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Switch
                                                                            checked={hasAnyItem}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) {
                                                                                    // Add default first option
                                                                                    setSeizuresList(prev => [...prev, { tipo: `${fullTypePrefix}: ${options[0]}`, descricao: '1' }])
                                                                                } else {
                                                                                    // Remove all items of this category
                                                                                    setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith(fullTypePrefix)))
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Label className="text-sm">{weaponCategory}</Label>
                                                                    </div>

                                                                    {hasAnyItem && (
                                                                        <div className="pl-4 animate-in slide-in-from-top-2 space-y-2">
                                                                            {existingItems.map((item, idx) => {
                                                                                const realIdx = seizuresList.findIndex(s => s === item)
                                                                                // Extract specific subtype from "Armas: Category: Subtype"
                                                                                const currentSubtype = item.tipo.split(':')[2]?.trim() || options[0]

                                                                                return (
                                                                                    <div key={idx} className="flex gap-2 items-center">
                                                                                        {weaponCategory === 'Outras' ? (
                                                                                            <Input
                                                                                                value={currentSubtype === 'Outra' ? '' : currentSubtype}
                                                                                                placeholder="Especificar..."
                                                                                                className="flex-1 h-8 text-sm"
                                                                                                onChange={(e) => updateSeizureType(realIdx, `${fullTypePrefix}: ${e.target.value}`)}
                                                                                            />
                                                                                        ) : (
                                                                                            <Select
                                                                                                value={currentSubtype}
                                                                                                onValueChange={(val) => updateSeizureType(realIdx, `${fullTypePrefix}: ${val}`)}
                                                                                            >
                                                                                                <SelectTrigger className="flex-1 h-8 text-sm">
                                                                                                    <SelectValue />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {options.map(opt => (
                                                                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                                                    ))}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        )}
                                                                                        <Input
                                                                                            type="number"
                                                                                            min="1"
                                                                                            placeholder="Qtd"
                                                                                            className="w-20 h-8 text-sm"
                                                                                            value={item.descricao}
                                                                                            onChange={(e) => updateSeizureRow(realIdx, 'descricao', e.target.value)}
                                                                                        />
                                                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(realIdx)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                                                                            <Trash2 className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-xs text-slate-500"
                                                                                onClick={() => setSeizuresList(prev => [...prev, { tipo: `${fullTypePrefix}: ${options[0]}`, descricao: '1' }])}
                                                                            >
                                                                                <Plus className="h-3 w-3 mr-1" /> Adicionar
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-Category: Munições */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="cat_ammo"
                                                        checked={showAmmo}
                                                        onCheckedChange={(checked) => {
                                                            setShowAmmo(checked)
                                                            if (!checked) {
                                                                setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Munições:')))
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="cat_ammo" className="font-medium">Munições</Label>
                                                </div>

                                                {showAmmo && (
                                                    <div className="pl-4 border-l-2 border-slate-200 dark:border-zinc-700 ml-2 space-y-3 mt-2">
                                                        {Object.entries(AMMO_CONFIG).map(([ammoCategory, options]) => {
                                                            const fullTypePrefix = `Munições: ${ammoCategory}`
                                                            const existingItems = seizuresList.filter(s => s.tipo.startsWith(fullTypePrefix))
                                                            const hasAnyItem = existingItems.length > 0

                                                            return (
                                                                <div key={ammoCategory} className="space-y-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Switch
                                                                            checked={hasAnyItem}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) {
                                                                                    setSeizuresList(prev => [...prev, { tipo: `${fullTypePrefix}: ${options[0]}`, descricao: '1' }])
                                                                                } else {
                                                                                    setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith(fullTypePrefix)))
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Label className="text-sm">{ammoCategory}</Label>
                                                                    </div>

                                                                    {hasAnyItem && (
                                                                        <div className="pl-4 animate-in slide-in-from-top-2 space-y-2">
                                                                            {existingItems.map((item, idx) => {
                                                                                const realIdx = seizuresList.findIndex(s => s === item)
                                                                                const currentSubtype = item.tipo.split(':')[2]?.trim() || options[0]

                                                                                return (
                                                                                    <div key={idx} className="flex gap-2 items-center">
                                                                                        <Select
                                                                                            value={currentSubtype}
                                                                                            onValueChange={(val) => updateSeizureType(realIdx, `${fullTypePrefix}: ${val}`)}
                                                                                        >
                                                                                            <SelectTrigger className="flex-1 h-8 text-sm">
                                                                                                <SelectValue />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {options.map(opt => (
                                                                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                        <Input
                                                                                            type="number"
                                                                                            min="1"
                                                                                            placeholder="Qtd"
                                                                                            className="w-20 h-8 text-sm"
                                                                                            value={item.descricao}
                                                                                            onChange={(e) => updateSeizureRow(realIdx, 'descricao', e.target.value)}
                                                                                        />
                                                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(realIdx)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                                                                            <Trash2 className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-xs text-slate-500"
                                                                                onClick={() => setSeizuresList(prev => [...prev, { tipo: `${fullTypePrefix}: ${options[0]}`, descricao: '1' }])}
                                                                            >
                                                                                <Plus className="h-3 w-3 mr-1" /> Adicionar
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-Category: Explosivos */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="cat_explosives"
                                                        checked={showExplosives}
                                                        onCheckedChange={(checked) => {
                                                            setShowExplosives(checked)
                                                            if (!checked) {
                                                                setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Explosivos:')))
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="cat_explosives" className="font-medium">Explosivos</Label>
                                                </div>

                                                {showExplosives && (
                                                    <div className="pl-4 border-l-2 border-slate-200 dark:border-zinc-700 ml-2 space-y-3 mt-2">
                                                        {Object.entries(EXPLOSIVES_CONFIG).map(([explosiveCategory, options]) => {
                                                            const fullTypePrefix = `Explosivos: ${explosiveCategory}`
                                                            const existingItems = seizuresList.filter(s => s.tipo.startsWith(fullTypePrefix))
                                                            const hasAnyItem = existingItems.length > 0

                                                            return (
                                                                <div key={explosiveCategory} className="space-y-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Switch
                                                                            checked={hasAnyItem}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) {
                                                                                    setSeizuresList(prev => [...prev, { tipo: `${fullTypePrefix}: ${options[0]}`, descricao: '1' }])
                                                                                } else {
                                                                                    setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith(fullTypePrefix)))
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Label className="text-sm">{explosiveCategory}</Label>
                                                                    </div>

                                                                    {hasAnyItem && (
                                                                        <div className="pl-4 animate-in slide-in-from-top-2 space-y-2">
                                                                            {existingItems.map((item, idx) => {
                                                                                const realIdx = seizuresList.findIndex(s => s === item)
                                                                                const currentSubtype = item.tipo.split(':')[2]?.trim() || options[0]

                                                                                return (
                                                                                    <div key={idx} className="flex gap-2 items-center">
                                                                                        <Select
                                                                                            value={currentSubtype}
                                                                                            onValueChange={(val) => updateSeizureType(realIdx, `${fullTypePrefix}: ${val}`)}
                                                                                        >
                                                                                            <SelectTrigger className="flex-1 h-8 text-sm">
                                                                                                <SelectValue />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {options.map(opt => (
                                                                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                        <Input
                                                                                            type="number"
                                                                                            min="1"
                                                                                            placeholder="Qtd"
                                                                                            className="w-20 h-8 text-sm"
                                                                                            value={item.descricao}
                                                                                            onChange={(e) => updateSeizureRow(realIdx, 'descricao', e.target.value)}
                                                                                        />
                                                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(realIdx)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                                                                            <Trash2 className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-xs text-slate-500"
                                                                                onClick={() => setSeizuresList(prev => [...prev, { tipo: `${fullTypePrefix}: ${options[0]}`, descricao: '1' }])}
                                                                            >
                                                                                <Plus className="h-3 w-3 mr-1" /> Adicionar
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-Category: Numerário */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="cat_cash"
                                                        checked={seizuresList.some(s => s.tipo.startsWith('Numerário:'))}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSeizuresList(prev => [...prev, { tipo: 'Numerário: Euros', descricao: '' }])
                                                            } else {
                                                                setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Numerário:')))
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="cat_cash" className="font-medium">Numerário</Label>
                                                </div>

                                                {seizuresList.some(s => s.tipo.startsWith('Numerário:')) && (
                                                    <div className="pl-4 animate-in slide-in-from-top-2 space-y-2">
                                                        {seizuresList.filter(s => s.tipo.startsWith('Numerário:')).map((item, idx) => {
                                                            const realIdx = seizuresList.findIndex(s => s === item)
                                                            const currentCurrency = item.tipo.split(':')[1]?.trim() || 'Euros'
                                                            return (
                                                                <div key={idx} className="flex gap-2 items-center">
                                                                    <Select
                                                                        value={currentCurrency}
                                                                        onValueChange={(val) => updateSeizureType(realIdx, `Numerário: ${val}`)}
                                                                    >
                                                                        <SelectTrigger className="w-40 h-8 text-sm">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Valor (0.00)"
                                                                        className="w-32 h-8 text-sm"
                                                                        value={item.descricao}
                                                                        onChange={(e) => updateSeizureRow(realIdx, 'descricao', e.target.value)}
                                                                    />
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(realIdx)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )
                                                        })}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-xs text-green-600 hover:text-green-700"
                                                            onClick={() => setSeizuresList(prev => [...prev, { tipo: 'Numerário: Euros', descricao: '' }])}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" /> Adicionar Numerário
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-Category: Veículos */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="cat_vehicles"
                                                        checked={showVehicles}
                                                        onCheckedChange={(checked) => {
                                                            setShowVehicles(checked)
                                                            if (!checked) {
                                                                setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Veículos:')))
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="cat_vehicles" className="font-medium">Veículos</Label>
                                                </div>

                                                {showVehicles && (
                                                    <div className="pl-4 border-l-2 border-slate-200 dark:border-zinc-700 ml-2 space-y-3 mt-2">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Switch
                                                                    checked={seizuresList.some(s => s.tipo.startsWith('Veículos:'))}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setSeizuresList(prev => [...prev, { tipo: `Veículos: ${VEHICLE_TYPES[0]}`, descricao: '1' }])
                                                                        } else {
                                                                            setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Veículos:')))
                                                                        }
                                                                    }}
                                                                />
                                                                <Label className="text-sm">Lista de Veículos</Label>
                                                            </div>

                                                            {seizuresList.some(s => s.tipo.startsWith('Veículos:')) && (
                                                                <div className="pl-4 animate-in slide-in-from-top-2 space-y-2">
                                                                    {seizuresList.filter(s => s.tipo.startsWith('Veículos:')).map((item, idx) => {
                                                                        const realIdx = seizuresList.findIndex(s => s === item)
                                                                        const currentType = item.tipo.split(':')[1]?.trim() || VEHICLE_TYPES[0]

                                                                        return (
                                                                            <div key={idx} className="flex gap-2 items-center">
                                                                                <Select
                                                                                    value={currentType}
                                                                                    onValueChange={(val) => updateSeizureType(realIdx, `Veículos: ${val}`)}
                                                                                >
                                                                                    <SelectTrigger className="flex-1 h-8 text-sm">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {VEHICLE_TYPES.map(vt => (
                                                                                            <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    placeholder="Qtd"
                                                                                    className="w-20 h-8 text-sm"
                                                                                    value={item.descricao}
                                                                                    onChange={(e) => updateSeizureRow(realIdx, 'descricao', e.target.value)}
                                                                                />
                                                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(realIdx)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-xs text-slate-500"
                                                                        onClick={() => setSeizuresList(prev => [...prev, { tipo: `Veículos: ${VEHICLE_TYPES[0]}`, descricao: '1' }])}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" /> Adicionar Veículo
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-Category: Documentos (NEW) */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="cat_docs"
                                                        checked={showDocs}
                                                        onCheckedChange={(checked) => {
                                                            setShowDocs(checked)
                                                            if (!checked) {
                                                                setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Documentos:')))
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="cat_docs" className="font-medium">Documentos</Label>
                                                </div>

                                                {showDocs && (
                                                    <div className="pl-4 border-l-2 border-slate-200 dark:border-zinc-700 ml-2 space-y-3 mt-2">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Switch
                                                                    checked={seizuresList.some(s => s.tipo.startsWith('Documentos:'))}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setSeizuresList(prev => [...prev, { tipo: `Documentos: ${DOC_TYPES[0]}`, descricao: '1' }])
                                                                        } else {
                                                                            setSeizuresList(prev => prev.filter(s => !s.tipo.startsWith('Documentos:')))
                                                                        }
                                                                    }}
                                                                />
                                                                <Label className="text-sm">Lista de Documentos</Label>
                                                            </div>

                                                            {seizuresList.some(s => s.tipo.startsWith('Documentos:')) && (
                                                                <div className="pl-4 animate-in slide-in-from-top-2 space-y-2">
                                                                    {seizuresList.filter(s => s.tipo.startsWith('Documentos:')).map((item, idx) => {
                                                                        const realIdx = seizuresList.findIndex(s => s === item)
                                                                        const currentType = item.tipo.split(':')[1]?.trim() || DOC_TYPES[0]

                                                                        return (
                                                                            <div key={idx} className="flex gap-2 items-center">
                                                                                <Select
                                                                                    value={currentType}
                                                                                    onValueChange={(val) => updateSeizureType(realIdx, `Documentos: ${val}`)}
                                                                                >
                                                                                    <SelectTrigger className="flex-1 h-8 text-sm">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {DOC_TYPES.map(dt => (
                                                                                            <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    placeholder="Qtd"
                                                                                    className="w-20 h-8 text-sm"
                                                                                    value={item.descricao}
                                                                                    onChange={(e) => updateSeizureRow(realIdx, 'descricao', e.target.value)}
                                                                                />
                                                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(realIdx)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-xs text-slate-500"
                                                                        onClick={() => setSeizuresList(prev => [...prev, { tipo: `Documentos: ${DOC_TYPES[0]}`, descricao: '1' }])}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" /> Adicionar Documento
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Generic Categories Handler */}
                                            {['Outros'].map((cat) => {
                                                const hasItems = seizuresList.some(s => s.tipo === cat)
                                                return (
                                                    <div key={cat} className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Switch
                                                                checked={hasItems}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSeizuresList(prev => [...prev, { tipo: cat, descricao: '' }])
                                                                    } else {
                                                                        setSeizuresList(prev => prev.filter(s => s.tipo !== cat))
                                                                    }
                                                                }}
                                                            />
                                                            <Label className="font-medium">{cat}</Label>
                                                        </div>

                                                        {hasItems && (
                                                            <div className="space-y-2 pl-4 animate-in slide-in-from-top-2">
                                                                {seizuresList.filter(s => s.tipo === cat).map((item, idx) => {
                                                                    // We need to find the real index in the main list to update correctly
                                                                    const realIdx = seizuresList.findIndex(s => s === item)
                                                                    return (
                                                                        <div key={idx} className="flex gap-2 items-center">
                                                                            <Input
                                                                                placeholder={`Descrição de ${cat}...`}
                                                                                className="flex-1"
                                                                                value={item.descricao}
                                                                                onChange={(e) => updateSeizureRow(realIdx, 'descricao', e.target.value)}
                                                                            />
                                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(realIdx)} className="text-red-500 hover:text-red-600">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    )
                                                                })}
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-xs text-purple-600 hover:text-purple-700"
                                                                    onClick={() => setSeizuresList(prev => [...prev, { tipo: cat, descricao: '' }])}
                                                                >
                                                                    <Plus className="h-3 w-3 mr-1" /> Adicionar mais {cat}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}

                                        </div>
                                    )}
                                </div>

                                {/* Imagens Section */}
                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="imagens" checked={imagens} onCheckedChange={setImagens} disabled={readOnly} />
                                        <Label htmlFor="imagens" className="font-semibold text-pink-600 text-base">Tem Imagens?</Label>
                                    </div>

                                    {imagens && (
                                        <div className="space-y-3 mt-3 animate-in fade-in pl-4 border-l-2 border-pink-200">
                                            <div className="flex items-center space-x-2">
                                                <Switch id="notificacao" checked={notificacao} onCheckedChange={setNotificacao} disabled={readOnly} />
                                                <Label htmlFor="notificacao" className="font-medium">Foi feita a Notificação?</Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Sim + Sim = <span className="text-emerald-600 font-bold">Verde</span> | Sim + Não = <span className="text-red-600 font-bold">Vermelho</span> no separador Imagens.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Crime</Label>
                                <CrimeTypeSelect value={tipoCrime} onChange={setTipoCrime} readOnly={readOnly} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="localizacao">Localização</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="localizacao"
                                        name="localizacao"
                                        defaultValue={processo.localizacao || ''}
                                        readOnly={readOnly}
                                        placeholder="Morada ou local..."
                                    />
                                    {!readOnly && (
                                        <Button
                                            type="button"
                                            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                            onClick={() => setLocationModalOpen(true)}
                                        >
                                            CRIAR LOCALIZAÇÃO
                                        </Button>
                                    )}
                                </div>
                                {coords && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Coordenadas associadas: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                                    </p>
                                )}
                            </div>

                            <LocationPickerModal
                                open={locationModalOpen}
                                onOpenChange={setLocationModalOpen}
                                initialLat={coords?.lat}
                                initialLng={coords?.lng}
                                onSave={(lat, lng) => {
                                    setCoords({ lat, lng })
                                    // Optional: Auto-fill text if empty? Or just confirm
                                    // Let's just track coords. The user can type address manually or drag map to see it.
                                }}
                            />
                        </div>

                        {/* Column 2: Persons & Destination */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="denunciante">Denunciante</Label>
                                <Input id="denunciante" name="denunciante" defaultValue={processo.denunciante || ''} readOnly={readOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vitima">Vítima / Lesado</Label>
                                <Input id="vitima" name="vitima" defaultValue={processo.vitima || ''} readOnly={readOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="arguido">Arguido / Suspeito</Label>
                                <Textarea id="arguido" name="arguido" defaultValue={processo.arguido || ''} className="h-20" readOnly={readOnly} />
                            </div>
                        </div>

                        {/* Full Width: Envio / Obs */}
                        <div className="col-span-2 grid grid-cols-2 gap-6 border-t pt-4">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Dados de Envio</h3>
                                <div className="space-y-2">
                                    <Label>Entidade Destino</Label>
                                    <EntitySelect value={entidade} onChange={setEntidade} readOnly={readOnly} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="envio_em">Data Envio</Label>
                                        <Input id="envio_em" name="envio_em" type="date" defaultValue={processo.envio_em?.split('T')[0]} readOnly={readOnly} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="numero_oficio_envio">Nº Ofício Envio</Label>
                                        <Input id="numero_oficio_envio" name="numero_oficio_envio" defaultValue={processo.numero_oficio_envio || ''} readOnly={readOnly} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="observacoes">Observações / Apreensões</Label>
                                <Textarea id="observacoes" name="observacoes" defaultValue={processo.observacoes || ''} className="h-[150px]" readOnly={readOnly} />
                            </div>
                        </div>
                    </fieldset>

                    <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                        {!readOnly && processo.nuipc_completo && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={async () => {
                                    if (confirm('Tem a certeza que deseja apagar este processo? Esta ação irá limpar todos os dados do slot.')) {
                                        setLoading(true)
                                        const res = await deleteProcesso(processo.id)
                                        setLoading(false) // Just in case
                                        if (res?.error) {
                                            alert(res.error)
                                        } else {
                                            onOpenChange(false)
                                        }
                                    }
                                }}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Apagar
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                {readOnly ? 'Fechar' : 'Cancelar'}
                            </Button>
                            {!readOnly && (
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Gravar Processo
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

