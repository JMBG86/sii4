'use client'

import { ProcessosTable } from './processos-list'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProcessosCrimePage() {
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mapa de Processos</h1>
                    <p className="text-muted-foreground">Mapa de Controlo de Inquéritos (1 a 4000).</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/sp/novo-processo-crime">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Processo Crime
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar Lista
                    </Button>
                </div>
            </div>

            <ProcessosTable key={refreshKey} />
        </div>
    )
}
