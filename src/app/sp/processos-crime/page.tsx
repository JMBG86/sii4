'use client'

import { ProcessosTable } from './processos-table'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function ProcessosCrimePage() {
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mapa de Processos</h1>
                    <p className="text-muted-foreground">Mapa de Controlo de Inquéritos (1 a 4000).</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar Lista
                </Button>
            </div>

            <ProcessosTable key={refreshKey} />
        </div>
    )
}
