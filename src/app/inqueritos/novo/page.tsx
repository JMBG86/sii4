'use client'

import { createInquiry } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function AddInquiryPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        const formData = new FormData(event.currentTarget)
        const result = await createInquiry(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
        // If successful, the server action redirects, so we don't need to do anything.
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Adicionar Novo Inquérito</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Dados do Inquérito</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="nuipc">NUIPC *</Label>
                            <Input id="nuipc" name="nuipc" required placeholder="Ex: 123/24.0PALRA" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="data_ocorrencia">Data da Ocorrência</Label>
                                <Input type="date" id="data_ocorrencia" name="data_ocorrencia" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="data_participacao">Data da Participação</Label>
                                <Input type="date" id="data_participacao" name="data_participacao" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tipo_crime">Tipo de Crime</Label>
                            <Input id="tipo_crime" name="tipo_crime" placeholder="Ex: Furto Qualificado" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="classificacao">Classificação</Label>
                            <Select name="classificacao" defaultValue="normal">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="relevo">Relevo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observacoes">Observações</Label>
                            <Textarea
                                id="observacoes"
                                name="observacoes"
                                placeholder="Notas iniciais..."
                                className="min-h-[100px]"
                            />
                        </div>

                        {error && (
                            <div className="text-sm font-medium text-red-500">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Inquérito
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
