'use client'

import { useState, useEffect } from 'react'
import { SPProcessoCrime, SPEntidade, SPDetidoInfo } from '@/types/database'
import { updateProcesso, getEntidades, createEntidade, getDetidos, deleteProcesso } from './actions'
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

// Custom "Creatable" Select for Entities
function EntitySelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
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
        }}>
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
                <SelectItem value="NEW_ENTRY" className="text-blue-600 font-medium">+ Adicionar Nova</SelectItem>
            </SelectContent>
        </Select>
    )
}

export function ProcessoDetailDialog({
    processo,
    open,
    onOpenChange
}: {
    processo: SPProcessoCrime
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [loading, setLoading] = useState(false)
    const [detidos, setDetidos] = useState(processo.detidos || false)
    const [entidade, setEntidade] = useState(processo.entidade_destino || '')

    // New Flags
    const [criancas, setCriancas] = useState(processo.criancas_sinalizadas || false)
    const [apreensoes, setApreensoes] = useState(processo.apreensoes || false)

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
        setEntidade(processo.entidade_destino || '')

        if (open) {
            import('./actions').then(({ getDetidos, getCriancas, getApreensoes, getDrogas }) => {
                getDetidos(processo.id).then(data => {
                    setDetaineesList(data?.map((d: any) => ({ nacionalidade: d.nacionalidade, quantidade: d.quantidade, sexo: d.sexo || 'M' })) || [])
                })
                getCriancas(processo.id).then(data => {
                    setChildrenList(data?.map((d: any) => ({ nome: d.nome, idade: d.idade || 0 })) || [])
                })
                getApreensoes(processo.id).then(data => {
                    setSeizuresList(data?.map((d: any) => ({ tipo: d.tipo, descricao: d.descricao })) || [])
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
    function addSeizureRow() {
        setSeizuresList(prev => [...prev, { tipo: 'Armas', descricao: '' }])
    }
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

    // --- Drugs Handler ---
    function updateDrugField(field: keyof import('@/types/database').SPApreensaoDroga, value: number) {
        setDrugs(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.set('entidade_destino', entidade)

        // Booleans
        formData.set('detidos', detidos ? 'on' : 'off')
        formData.set('criancas_sinalizadas', criancas ? 'on' : 'off')
        formData.set('apreensoes', apreensoes ? 'on' : 'off')

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
            <DialogContent className="sm:max-w-[900px] h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {processo.nuipc_completo ? 'Editar Processo' : `Registar Processo - Sequencial #${processo.numero_sequencial}`}
                    </DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid grid-cols-2 gap-6 py-4">
                        {/* Column 1: Core Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nuipc_completo">NUIPC Completo</Label>
                                <Input id="nuipc_completo" name="nuipc_completo" defaultValue={processo.nuipc_completo || ''} placeholder="Ex: 500/25.3GBABF" required />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="data_registo">Data Registo</Label>
                                    <Input id="data_registo" name="data_registo" type="date" defaultValue={processo.data_registo?.split('T')[0] || new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="data_factos">Data Factos</Label>
                                    <Input id="data_factos" name="data_factos" type="date" defaultValue={processo.data_factos?.split('T')[0]} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="data_conhecimento">Data Conhec.</Label>
                                    <Input id="data_conhecimento" name="data_conhecimento" type="date" defaultValue={processo.data_conhecimento?.split('T')[0]} />
                                </div>
                            </div>

                            <div className="space-y-4 border p-3 rounded-md bg-slate-50 dark:bg-zinc-900/50">
                                {/* Detainees Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="detidos" name="detidos" checked={detidos} onCheckedChange={setDetidos} />
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
                                                    />
                                                    <Select value={item.sexo} onValueChange={(val) => updateDetaineeRow(idx, 'sexo', val)}>
                                                        <SelectTrigger className="w-20">
                                                            <SelectValue placeholder="SX" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="M">M</SelectItem>
                                                            <SelectItem value="F">F</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Select value={item.nacionalidade} onValueChange={(val) => updateDetaineeRow(idx, 'nacionalidade', val)}>
                                                        <SelectTrigger className="flex-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDetaineeRow(idx)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={addDetaineeRow} className="w-full border-dashed text-muted-foreground border-red-200 hover:border-red-400 hover:text-red-600">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Detidos
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Children Section */}
                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="criancas" checked={criancas} onCheckedChange={setCriancas} />
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
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Idade"
                                                        className="w-20"
                                                        min={0}
                                                        max={18}
                                                        value={item.idade}
                                                        onChange={(e) => updateChildRow(idx, 'idade', parseInt(e.target.value))}
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeChildRow(idx)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={addChildRow} className="w-full border-dashed text-muted-foreground border-orange-200 hover:border-orange-400 hover:text-orange-600">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Crianças
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Seizures Section */}
                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="apreensoes" checked={apreensoes} onCheckedChange={setApreensoes} />
                                        <Label htmlFor="apreensoes" className="font-semibold text-purple-600">Existem Apreensões?</Label>
                                    </div>

                                    {apreensoes && (
                                        <div className="space-y-4 mt-3 animate-in fade-in pl-2 border-l-2 border-purple-200">
                                            {/* Drug Seizures Sub-Section */}
                                            <div className="bg-purple-50 dark:bg-zinc-900/50 p-3 rounded-md space-y-3">
                                                <h4 className="font-semibold text-sm text-purple-800 dark:text-purple-400">Estupefacientes</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Cocaína (g)</Label>
                                                        <Input type="number" step="0.01" value={drugs?.cocaina_g || ''} onChange={e => updateDrugField('cocaina_g', parseFloat(e.target.value))} className="h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Heroína (g)</Label>
                                                        <Input type="number" step="0.01" value={drugs?.heroina_g || ''} onChange={e => updateDrugField('heroina_g', parseFloat(e.target.value))} className="h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Cannabis Folhas (g)</Label>
                                                        <Input type="number" step="0.01" value={drugs?.cannabis_folhas_g || ''} onChange={e => updateDrugField('cannabis_folhas_g', parseFloat(e.target.value))} className="h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Cannabis Resina (g)</Label>
                                                        <Input type="number" step="0.01" value={drugs?.cannabis_resina_g || ''} onChange={e => updateDrugField('cannabis_resina_g', parseFloat(e.target.value))} className="h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Cannabis Óleo (g)</Label>
                                                        <Input type="number" step="0.01" value={drugs?.cannabis_oleo_g || ''} onChange={e => updateDrugField('cannabis_oleo_g', parseFloat(e.target.value))} className="h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Sintéticas (g)</Label>
                                                        <Input type="number" step="0.01" value={drugs?.sinteticas_g || ''} onChange={e => updateDrugField('sinteticas_g', parseFloat(e.target.value))} className="h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Cannabis Plantas (Un)</Label>
                                                        <Input type="number" value={drugs?.cannabis_plantas_un || ''} onChange={e => updateDrugField('cannabis_plantas_un', parseInt(e.target.value))} className="h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Subst. Psicoativas (Un)</Label>
                                                        <Input type="number" value={drugs?.substancias_psicoativas_un || ''} onChange={e => updateDrugField('substancias_psicoativas_un', parseInt(e.target.value))} className="h-8" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Generic Seizures List */}
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm text-muted-foreground">Outras Apreensões (Generic)</h4>
                                                {seizuresList.map((item, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center">
                                                        <Select value={item.tipo} onValueChange={(val) => updateSeizureRow(idx, 'tipo', val)}>
                                                            <SelectTrigger className="w-1/3">
                                                                <SelectValue placeholder="Tipo" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Armas">Armas</SelectItem>
                                                                <SelectItem value="Numerário">Numerário</SelectItem>
                                                                <SelectItem value="Veículos">Veículos</SelectItem>
                                                                <SelectItem value="Outros">Outros</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            placeholder="Descrição"
                                                            className="flex-1"
                                                            value={item.descricao}
                                                            onChange={(e) => updateSeizureRow(idx, 'descricao', e.target.value)}
                                                        />
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSeizureRow(idx)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="outline" size="sm" onClick={addSeizureRow} className="w-full border-dashed text-muted-foreground border-purple-200 hover:border-purple-400 hover:text-purple-600">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Adicionar Outra (Armas/Veículos/Etc)
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tipo_crime">Tipo de Crime</Label>
                                <Input id="tipo_crime" name="tipo_crime" defaultValue={processo.tipo_crime || ''} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="localizacao">Localização</Label>
                                <Input id="localizacao" name="localizacao" defaultValue={processo.localizacao || ''} />
                            </div>
                        </div>

                        {/* Column 2: Persons & Destination */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="arguido">Arguido / Suspeito</Label>
                                <Textarea id="arguido" name="arguido" defaultValue={processo.arguido || ''} className="h-20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vitima">Vítima / Lesado</Label>
                                <Input id="vitima" name="vitima" defaultValue={processo.vitima || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="denunciante">Denunciante</Label>
                                <Input id="denunciante" name="denunciante" defaultValue={processo.denunciante || ''} />
                            </div>
                        </div>

                        {/* Full Width: Envio / Obs */}
                        <div className="col-span-2 grid grid-cols-2 gap-6 border-t pt-4">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Dados de Envio</h3>
                                <div className="space-y-2">
                                    <Label>Entidade Destino</Label>
                                    <EntitySelect value={entidade} onChange={setEntidade} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="envio_em">Data Envio</Label>
                                        <Input id="envio_em" name="envio_em" type="date" defaultValue={processo.envio_em?.split('T')[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="numero_oficio_envio">Nº Ofício Envio</Label>
                                        <Input id="numero_oficio_envio" name="numero_oficio_envio" defaultValue={processo.numero_oficio_envio || ''} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="observacoes">Observações / Apreensões</Label>
                                <Textarea id="observacoes" name="observacoes" defaultValue={processo.observacoes || ''} className="h-[150px]" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                        {processo.nuipc_completo && (
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
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Gravar Processo
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
