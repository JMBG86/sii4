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

    // Detainees List State
    // Using simple local objects, not full database objects yet
    const [detaineesList, setDetaineesList] = useState<{ nacionalidade: string, quantidade: number }[]>([])

    // Reset and Fetch
    useEffect(() => {
        setDetidos(processo.detidos || false)
        setEntidade(processo.entidade_destino || '')

        // Fetch existing detainees info if detidos is true
        if (open) {
            getDetidos(processo.id).then(data => {
                if (data && data.length > 0) {
                    setDetaineesList(data.map((d: any) => ({ nacionalidade: d.nacionalidade, quantidade: d.quantidade })))
                } else {
                    setDetaineesList([])
                }
            })
        }
    }, [processo, open])

    function addDetaineeRow() {
        setDetaineesList(prev => [...prev, { nacionalidade: 'Portuguesa', quantidade: 1 }])
    }

    function removeDetaineeRow(index: number) {
        setDetaineesList(prev => prev.filter((_, i) => i !== index))
    }

    function updateDetaineeRow(index: number, field: 'nacionalidade' | 'quantidade', value: any) {
        setDetaineesList(prev => {
            const copy = [...prev]
            copy[index] = { ...copy[index], [field]: value }
            return copy
        })
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.set('entidade_destino', entidade)

        // Serialize Detainees Info
        if (detidos) {
            formData.set('detidos_info_json', JSON.stringify(detaineesList))
        } else {
            formData.set('detidos_info_json', '[]')
        }

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

                            <div className="space-y-2 border p-3 rounded-md bg-slate-50 dark:bg-zinc-900/50">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Switch id="detidos" name="detidos" checked={detidos} onCheckedChange={setDetidos} />
                                    <Label htmlFor="detidos" className="font-semibold">Existem Detidos?</Label>
                                </div>

                                {detidos && (
                                    <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2">
                                        {detaineesList.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <Input
                                                    type="number"
                                                    className="w-20"
                                                    min={1}
                                                    value={item.quantidade}
                                                    onChange={(e) => updateDetaineeRow(idx, 'quantidade', parseInt(e.target.value))}
                                                />
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
                                        <Button type="button" variant="outline" size="sm" onClick={addDetaineeRow} className="w-full border-dashed text-muted-foreground">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Adicionar Detidos
                                        </Button>
                                    </div>
                                )}
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
