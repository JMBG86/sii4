'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { upsertImageNotification } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface RegistryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved: () => void
    initialData?: any
}

export function ImageRegistryDialog({ open, onOpenChange, onSaved, initialData }: RegistryDialogProps) {
    const [loading, setLoading] = useState(false)

    // Form State
    const [nuipc, setNuipc] = useState('')
    const [dataOcorrencia, setDataOcorrencia] = useState('')
    const [tipoCrime, setTipoCrime] = useState('')
    const [dataRegisto, setDataRegisto] = useState(new Date().toISOString().split('T')[0])
    const [localizacao, setLocalizacao] = useState('')
    // State for the 3 flags
    const [temImagens, setTemImagens] = useState(true)
    const [notificacaoFeita, setNotificacaoFeita] = useState(false)
    const [notificacaoExecutada, setNotificacaoExecutada] = useState(false)

    // Notification Specifics
    const [militar, setMilitar] = useState('')
    const [dataEntrega, setDataEntrega] = useState('')
    const [dataDevolucao, setDataDevolucao] = useState('')

    // Load Initial Data when available and open
    useEffect(() => {
        if (open && initialData) {
            setNuipc(initialData.nuipc_completo || '')
            setTipoCrime(initialData.tipo_crime || '')
            if (initialData.data_factos) setDataOcorrencia(initialData.data_factos.split('T')[0])
            if (initialData.data_registo) setDataRegisto(initialData.data_registo.split('T')[0])
            if (initialData.localizacao) setLocalizacao(initialData.localizacao)

            // 3 Flags
            if (initialData.imagens_associadas !== undefined) setTemImagens(initialData.imagens_associadas)
            if (initialData.notificacao_imagens !== undefined) setNotificacaoFeita(initialData.notificacao_imagens)
            if (initialData.notificacao_resolvida !== undefined) setNotificacaoExecutada(initialData.notificacao_resolvida)

            if (initialData.notificacao_militar) setMilitar(initialData.notificacao_militar)
            if (initialData.notificacao_data_entrega) setDataEntrega(initialData.notificacao_data_entrega.split('T')[0])
            if (initialData.notificacao_data_devolucao) setDataDevolucao(initialData.notificacao_data_devolucao.split('T')[0])
        } else if (open && !initialData) {
            // Reset if opening empty
            setNuipc('')
            setMilitar('')
            setNotificacaoFeita(false)
            setNotificacaoExecutada(false)
            setTipoCrime('')
            setDataOcorrencia('')
            setLocalizacao('')
            setTemImagens(true)
            // Keep default dates/booleans
        }
    }, [open, initialData])

    // Debounce NUIPC for auto-fill (ONLY IF NOT EDITING / NO INITIAL DATA)
    // If we have initialData, we assume it's correct and don't want to overwrite user edits with DB lookups unless they change NUIPC.
    // However, if user changes NUIPC in edit mode, maybe they want to lookup? 
    // "auto-fill" usually implies overwriting. 
    // Let's guard: if nuipc === initialData?.nuipc_completo, DO NOT lookup.
    useEffect(() => {
        const check = async () => {
            // Skip check if we are in "Edit Mode" (initialData present) AND the NUIPC hasn't changed from the initial value 
            // (Actually we can just check if it matches initialData, but simpler: if initialData provided, we trust it.)
            // However, if user changes NUIPC in edit mode, maybe they want to lookup? 
            // "auto-fill" usually implies overwriting. 
            // Let's guard: if nuipc === initialData?.nuipc_completo, DO NOT lookup.

            if (initialData && nuipc === initialData.nuipc_completo) return

            if (nuipc.length < 5) return // Avoid too short checks

            // Basic debounce logic implicitly handled by user typing speed usually, 
            // but for safety in this robust environment let's assume we can trigger on blur or with a specialized debounce hook.
            // Since I cannot easily add a new hook file without reading, I can assume I can use it if I import it, 
            // BUT 'useDebounce' isn't imported here yet. 
            // I'll stick to a simple onBlur lookup to avoid complexity/flickering, OR just use a timeout here.

            // Let's use a timeout
            const timer = setTimeout(async () => {
                const { checkProcessExists } = await import('./actions')
                const data = await checkProcessExists(nuipc)
                if (data) {
                    toast.info('Processo encontrado! Dados carregados.')
                    setTipoCrime(data.tipo_crime || '')
                    if (data.data_factos) setDataOcorrencia(data.data_factos.split('T')[0])
                    if (data.data_registo) setDataRegisto(data.data_registo.split('T')[0])
                    if (data.localizacao) setLocalizacao(data.localizacao)

                    // Flags
                    if (data.imagens_associadas !== undefined) setTemImagens(data.imagens_associadas)
                    if (data.notificacao_imagens !== undefined) setNotificacaoFeita(data.notificacao_imagens)
                    if (data.notificacao_resolvida !== undefined) setNotificacaoExecutada(data.notificacao_resolvida)

                    if (data.notificacao_militar) setMilitar(data.notificacao_militar)
                    if (data.notificacao_data_entrega) setDataEntrega(data.notificacao_data_entrega.split('T')[0])
                    if (data.notificacao_data_devolucao) setDataDevolucao(data.notificacao_data_devolucao.split('T')[0])
                }
            }, 800)

            return () => clearTimeout(timer)
        }
        check()
    }, [nuipc, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nuipc || !tipoCrime) {
            toast.error('Preencha os campos obrigatórios (NUIPC, Crime)')
            return
        }

        setLoading(true)
        try {
            await upsertImageNotification({
                nuipc,
                data_factos: dataOcorrencia || null,
                tipo_crime: tipoCrime,
                data_registo: dataRegisto,
                localizacao: localizacao,
                imagens_associadas: temImagens,
                notificacao_militar: militar,
                notificacao_data_entrega: dataEntrega || null,
                notificacao_data_devolucao: dataDevolucao || null,
                notificacao_resolvida: notificacaoExecutada,
                notificacao_imagens: notificacaoFeita
            })

            toast.success('Registo guardado com sucesso')
            onSaved()
            onOpenChange(false)

            // Reset state
            setNuipc('')
            setMilitar('')
            setNotificacaoFeita(false)
            setNotificacaoExecutada(false)

        } catch (error) {
            console.error(error)
            toast.error('Erro ao guardar registo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Notificação de Imagens' : 'Registar Notificação de Imagens'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    {/* Linha 1: Identificação */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>NUIPC</Label>
                            <Input
                                placeholder="ex: 123/24.0GC..."
                                value={nuipc}
                                onChange={e => setNuipc(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Crime</Label>
                            <Input
                                placeholder="ex: Furto"
                                value={tipoCrime}
                                onChange={e => setTipoCrime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Linha 2: Datas */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Data Ocorrência</Label>
                            <Input
                                type="date"
                                value={dataOcorrencia}
                                onChange={e => setDataOcorrencia(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Registo</Label>
                            <Input
                                type="date"
                                value={dataRegisto}
                                onChange={e => setDataRegisto(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Localização</Label>
                            <Input
                                value={localizacao}
                                onChange={e => setLocalizacao(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4 space-y-4">
                        <Label className="text-base font-semibold">Estado do Processo</Label>

                        <div className="grid grid-cols-3 gap-4">
                            {/* 1. Tem Imagens */}
                            <div className="flex flex-col gap-2 border p-3 rounded bg-red-50/50 dark:bg-red-950/20 border-red-200">
                                <Label htmlFor="tem-imagens" className="font-semibold text-red-700">1. Tem Imagens?</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="tem-imagens"
                                        checked={temImagens}
                                        onCheckedChange={setTemImagens}
                                        className="data-[state=checked]:bg-red-600"
                                    />
                                    <span className="text-sm">{temImagens ? 'Sim' : 'Não'}</span>
                                </div>
                            </div>

                            {/* 2. Notificação Feita */}
                            <div className="flex flex-col gap-2 border p-3 rounded bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
                                <Label htmlFor="notif-feita" className="font-semibold text-amber-700">2. Notificação Feita?</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="notif-feita"
                                        checked={notificacaoFeita}
                                        onCheckedChange={setNotificacaoFeita}
                                        className="data-[state=checked]:bg-amber-500"
                                    />
                                    <span className="text-sm">{notificacaoFeita ? 'Sim' : 'Não'}</span>
                                </div>
                            </div>

                            {/* 3. Notificação Executada */}
                            <div className="flex flex-col gap-2 border p-3 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200">
                                <Label htmlFor="notif-exec" className="font-semibold text-emerald-700">3. Notif. Executada?</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="notif-exec"
                                        checked={notificacaoExecutada}
                                        onCheckedChange={setNotificacaoExecutada}
                                        className="data-[state=checked]:bg-emerald-600"
                                    />
                                    <span className="text-sm">{notificacaoExecutada ? 'Sim' : 'Não'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <Label className="text-base font-semibold text-blue-600">Dados da Execução</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2 col-span-2">
                                <Label>Militar responsável pela execução</Label>
                                <Input
                                    placeholder="Nome do militar..."
                                    value={militar}
                                    onChange={e => setMilitar(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Entrega p/ Execução</Label>
                                <Input
                                    type="date"
                                    value={dataEntrega}
                                    onChange={e => setDataEntrega(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Devolução</Label>
                                <Input
                                    type="date"
                                    value={dataDevolucao}
                                    onChange={e => setDataDevolucao(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Registo
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
