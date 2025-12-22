'use client'

import { ProcessosTable } from './processos-list'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { getFiscalYears } from '@/app/sp/config/actions'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function ProcessosCrimePage() {
    const [refreshKey, setRefreshKey] = useState(0)
    const [years, setYears] = useState<number[]>([2025])
    const [activeYear, setActiveYear] = useState<number>(2025)
    const [minYear] = useState(2025)

    useEffect(() => {
        getFiscalYears().then(data => {
            const fetchedYears = data?.map(d => d.year) || []
            const uniqueYears = Array.from(new Set([...fetchedYears, 2025]))
            const sortedYears = uniqueYears.sort((a, b) => b - a)

            setYears(sortedYears)
            setActiveYear(sortedYears[0])
        })
    }, [])

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

            <Tabs value={activeYear.toString()} onValueChange={v => setActiveYear(parseInt(v))}>
                <TabsList>
                    {years.map(y => (
                        <TabsTrigger key={y} value={y.toString()}>
                            {y}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {years.map(y => (
                    <TabsContent key={y} value={y.toString()}>
                        <ProcessosTable key={`${refreshKey}-${y}`} year={y} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
