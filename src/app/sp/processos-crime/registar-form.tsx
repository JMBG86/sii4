'use client'

import { useState } from 'react'
import { getProcessoBySequence } from './actions'
import { SPProcessoCrime } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Search, ArrowRight, AlertTriangle } from 'lucide-react'
import { ProcessoDetailDialog } from './detail-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function RegistarProcessoForm({ onSuccess }: { onSuccess: () => void }) {
    const [nuipcInput, setNuipcInput] = useState('')
    const [targetProcess, setTargetProcess] = useState<SPProcessoCrime | null>(null)
    const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info', text: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [openDialog, setOpenDialog] = useState(false)

    async function handleCheck() {
        if (!nuipcInput) return
        setLoading(true)
        setMessage(null)
        setTargetProcess(null)

        // Logic: Extract number before '/'
        // e.g. "55/25.6..." -> 55
        const match = nuipcInput.match(/^(\d+)\//)

        if (!match) {
            setLoading(false)
            setMessage({ type: 'error', text: 'Formato inválido. O NUIPC deve começar com o número do processo seguido de barra (ex: 55/25...)' })
            return
        }

        const seq = parseInt(match[1])

        if (isNaN(seq) || seq < 1 || seq > 4000) {
            setLoading(false)
            setMessage({ type: 'error', text: 'Número fora do intervalo permitido (1 a 4000).' })
            return
        }

        // Fetch the slot
        const process = await getProcessoBySequence(seq)

        if (!process) {
            setMessage({ type: 'error', text: 'Erro ao aceder ao mapa de processos.' })
        } else if (process.nuipc_completo) {
            setMessage({ type: 'error', text: `O número ${seq} já está ocupado pelo processo ${process.nuipc_completo}.` })
        } else {
            // Valid and empty!
            // Pre-fill the NUIPC input in the object so the dialog shows it
            process.nuipc_completo = nuipcInput
            setTargetProcess(process)
            setMessage({ type: 'success', text: `Slot #${seq} disponível! Podes registar.` })
        }

        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Novo Processo Crime</CardTitle>
                    <CardDescription>Insere o NUIPC completo. O sistema irá associá-lo automaticamente ao número sequencial correspondente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>NUIPC</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ex: 55/25.6GBABF"
                                value={nuipcInput}
                                onChange={e => {
                                    setNuipcInput(e.target.value)
                                    setMessage(null)
                                    setTargetProcess(null)
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                            />
                            <Button onClick={handleCheck} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {message && (
                        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-emerald-500 text-emerald-600' : ''}>
                            {message.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                            <AlertTitle>{message.type === 'error' ? 'Atenção' : 'Disponível'}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    {targetProcess && (
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setOpenDialog(true)}
                        >
                            Registar no Slot #{targetProcess.numero_sequencial}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardContent>
            </Card>

            {targetProcess && openDialog && (
                <ProcessoDetailDialog
                    processo={targetProcess} // Has the Input NUIPC pre-filled in memory
                    open={openDialog}
                    onOpenChange={(open) => {
                        setOpenDialog(open)
                        if (!open) {
                            onSuccess() // Refresh list
                            // Reset
                            setTargetProcess(null)
                            setNuipcInput('')
                            setMessage(null)
                        }
                    }}
                />
            )}
        </div>
    )
}
