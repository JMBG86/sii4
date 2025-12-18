'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCorrespondence, checkNuipcOwner } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, Search } from 'lucide-react'

import { useEffect } from 'react'

export default function NewCorrespondencePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // NUIPC Search State
    const [nuipc, setNuipc] = useState('')
    const [searchingNuipc, setSearchingNuipc] = useState(false)
    const [nuipcMessage, setNuipcMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null)
    const [destino, setDestino] = useState('SII')
    const [customDestino, setCustomDestino] = useState('')

    // Debounce search manually for now if hook not available, or just onBlur/Button
    // User asked for "active search function", likely onChange with debounce or specialized button?
    // "active search function and case that NUIPC exists ... system associates immediately"
    // Let's use onBlur for simplicity or a small search button, or useEffect with debounce.
    // Let's try useEffect with a simple timeout.

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (nuipc.length > 5) {
                setSearchingNuipc(true)
                try {
                    const ownerName = await checkNuipcOwner(nuipc)
                    if (ownerName) {
                        // setDestino(ownerName) // REMOVED as per request. Destino field stays as dropdown.
                        setNuipcMessage({ text: `Inquérito encontrado. Responsável: ${ownerName}`, type: 'success' })
                    } else {
                        setNuipcMessage({ text: 'Inquérito não encontrado ou sem responsável atribuído.', type: 'info' })
                        // Do not clear Destino here as user might want to type it manually
                    }
                } catch (error) {
                    console.error(error)
                } finally {
                    setSearchingNuipc(false)
                }
            } else {
                setNuipcMessage(null)
            }
        }, 800)

        return () => clearTimeout(timer)
    }, [nuipc])


    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = await createCorrespondence(formData)
        setLoading(false)

        if (result?.error) {
            alert(result.error)
        } else {
            router.push('/sp/correspondencia')
            router.refresh()
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Nova Correspondência</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Registo de Entrada</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="srv">SRV *</Label>
                                <Input id="srv" name="srv" required placeholder="Nº SRV" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numero_oficio">Nº Ofício *</Label>
                                <Input id="numero_oficio" name="numero_oficio" required placeholder="Nº do Ofício recebido" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nuipc">NUIPC (Opcional)</Label>
                            <div className="relative">
                                <Input
                                    id="nuipc"
                                    name="nuipc"
                                    placeholder="Ano.ID.Comarca (Ex: 2024.123.PDL)"
                                    value={nuipc}
                                    onChange={(e) => setNuipc(e.target.value)}
                                />
                                {searchingNuipc && (
                                    <div className="absolute right-3 top-2.5">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            {nuipcMessage && (
                                <p className={`text-xs ${nuipcMessage.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {nuipcMessage.text}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="origem">Origem *</Label>
                                <Input id="origem" name="origem" required placeholder="Entidade remetente" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destino_select">Destino *</Label>
                                <select
                                    id="destino_select"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={destino}
                                    onChange={(e) => setDestino(e.target.value)}
                                >
                                    <option value="SII">SII (Investigação)</option>
                                    <option value="SP">SP (Processos)</option>
                                    <option value="Outros">Outros</option>
                                </select>
                                <input type="hidden" name="destino" value={destino === 'Outros' ? customDestino : destino} />

                                {destino === 'Outros' && (
                                    <Input
                                        placeholder="Especifique o destino..."
                                        value={customDestino}
                                        onChange={(e) => setCustomDestino(e.target.value)}
                                        required={destino === 'Outros'}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assunto">Assunto *</Label>
                            <Textarea id="assunto" name="assunto" required placeholder="Do que trata..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="data_entrada">Data Entrada (Opcional)</Label>
                            <Input type="date" name="data_entrada" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Registar Correspondência
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
