'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2, FileText, Mail, User } from 'lucide-react'
import { searchSPGlobal } from './actions'
import Link from 'next/link'

export default function SPPesquisaPage() {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<any>(null)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (query.length < 2) return

        setLoading(true)
        setHasSearched(true)
        const data = await searchSPGlobal(query)
        setResults(data)
        setLoading(false)
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Pesquisa Global</h1>
                <p className="text-muted-foreground">Pesquise por NUIPC, Ofícios, Assuntos ou Nomes.</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar..."
                        className="pl-9"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pesquisar'}
                </Button>
            </form>

            {hasSearched && results && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Correspondence Results */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Correspondência ({results.correspondence.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {results.correspondence.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nada encontrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.correspondence.map((c: any) => (
                                        <div key={c.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <div className="font-semibold text-sm">{c.assunto}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Ofício: {c.numero_oficio} | De: {c.origem}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-mono bg-stone-100 dark:bg-zinc-800 px-1 rounded">
                                                    {c.nuipc || 'S/ NUIPC'}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {new Date(c.data_entrada).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Inquiry Results (Ownership) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Inquéritos SII ({results.inquiries.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {results.inquiries.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nada encontrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.inquiries.map((i: any) => (
                                        <div key={i.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <div className="font-bold text-sm font-mono">{i.nuipc}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Estado: {i.estado.replace('_', ' ')}
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {i.profiles?.full_name || <span className="text-yellow-600">Por Atribuir</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* SP Processes Results */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Processos Crime ({results.processos?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(!results.processos || results.processos.length === 0) ? (
                                <p className="text-sm text-muted-foreground">Nada encontrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.processos.map((p: any) => (
                                        <div key={p.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-400">
                                                        #{p.numero_sequencial}
                                                    </span>
                                                    <span className="font-semibold text-sm">{p.nuipc_completo || 'S/ NUIPC'}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {p.arguido && <span className="mr-2"><span className="font-bold">Arguido:</span> {p.arguido}</span>}
                                                    {p.denunciante && <span><span className="font-bold">Denunciante:</span> {p.denunciante}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Link href="/sp/processos-crime">
                                                    <Button variant="outline" size="sm" className="h-7 text-xs">
                                                        Ver Mapa
                                                    </Button>
                                                </Link>
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    {new Date(p.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
