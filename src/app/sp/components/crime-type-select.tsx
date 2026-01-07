'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { getCrimeTypes, createCrimeType } from '../processos-crime/actions'

export function CrimeTypeSelect({ value, onChange, readOnly }: { value: string, onChange: (val: string) => void, readOnly?: boolean }) {
    const [types, setTypes] = useState<{ id: string, nome: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newTypeName, setNewTypeName] = useState('')

    useEffect(() => {
        getCrimeTypes().then(setTypes).catch(console.error)
    }, [])

    async function handleCreate() {
        if (!newTypeName) return
        setLoading(true)
        const res = await createCrimeType(newTypeName)
        if (res.data) {
            setTypes(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)))
            onChange(res.data.nome)
            setIsCreating(false)
            setNewTypeName('')
        }
        setLoading(false)
    }

    if (isCreating) {
        return (
            <div className="flex gap-2">
                <Input
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    placeholder="Novo Tipo de Crime..."
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
                <SelectValue placeholder="Selecione tipo de crime" />
            </SelectTrigger>
            <SelectContent>
                {types.map(t => (
                    <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                ))}
                {!readOnly && <SelectItem value="NEW_ENTRY" className="text-blue-600 font-medium">+ Adicionar Novo</SelectItem>}
            </SelectContent>
        </Select>
    )
}
