'use client'

import { RegistarProcessoForm } from '@/app/sp/processos-crime/registar-form'
import { useRouter } from 'next/navigation'

export default function NovoProcessoPage() {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Novo Processo Crime</h1>
                    <p className="text-muted-foreground">Consulta de disponibilidade e registo de novo NUIPC no mapa.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto border p-6 rounded-md bg-white dark:bg-zinc-900 mt-6">
                <RegistarProcessoForm onSuccess={() => router.push('/sp/processos-crime')} />
            </div>
        </div>
    )
}
