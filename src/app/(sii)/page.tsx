import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { InquiryStatus } from '@/types/database'

export default async function Dashboard() {
  const supabase = await createClient()

  // 0. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Access Denied</div>

  // 1. Fetch ALL Data in Parallel for Performance
  const [
    { count: totalInqueries },
    { count: pendingInqueries },
    { count: diligenceInqueries },
    { count: courtInqueries },
    { count: completedInqueries },
    { count: relevoInqueries },
    { data: recentInquiries },
    { data: allInquiries },
    { data: toDodiligences },
    { data: completedDiligences },
    { data: waitingResponse },
    { data: waitingDiligences },
    { data: notableInquiries }
  ] = await Promise.all([
    // [0] Total
    supabase.from('inqueritos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%'),

    // [1] Pending
    supabase.from('inqueritos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'por_iniciar')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%'),

    // [2] In Diligences
    supabase.from('inqueritos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'em_diligencias')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%'),

    // [3] Court
    supabase.from('inqueritos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'tribunal')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%'),

    // [4] Completed
    supabase.from('inqueritos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'concluido')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%'),

    // [5] Relevo
    supabase.from('inqueritos')
      .select('*', { count: 'exact', head: true })
      .eq('classificacao', 'relevo')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%'),

    // [6] Recent List
    supabase.from('inqueritos')
      .select('*')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%')
      .order('created_at', { ascending: false })
      .limit(10),

    // [7] All Inquiries (for Year Stats)
    supabase.from('inqueritos')
      .select('created_at, data_atribuicao')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%'),

    // [8] To Do Diligences
    supabase.from('diligencias')
      .select('*, inqueritos!inner(nuipc, id, user_id, observacoes)')
      .eq('status', 'a_realizar')
      .eq('inqueritos.user_id', user.id)
      .not('inqueritos.observacoes', 'ilike', '%DEPRECADA%')
      .order('data_enviado', { ascending: true })
      .limit(10),

    // [9] Completed Diligences
    supabase.from('diligencias')
      .select('*, inqueritos!inner(nuipc, id, user_id, observacoes)')
      .eq('status', 'realizado')
      .eq('inqueritos.user_id', user.id)
      .not('inqueritos.observacoes', 'ilike', '%DEPRECADA%')
      .order('data_enviado', { ascending: false })
      .limit(10),

    // [10] Waiting Response Inquiries
    supabase.from('inqueritos')
      .select('*')
      .eq('estado', 'aguardando_resposta')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%')
      .order('created_at', { ascending: false })
      .limit(10),

    // [11] Waiting Response Diligences
    supabase.from('diligencias')
      .select('*, inqueritos!inner(nuipc, id, user_id, observacoes)')
      .eq('status', 'enviado_aguardar')
      .eq('inqueritos.user_id', user.id)
      .not('inqueritos.observacoes', 'ilike', '%DEPRECADA%')
      .order('data_enviado', { ascending: false })
      .limit(10),

    // [12] Notable Inquiries List
    supabase.from('inqueritos')
      .select('*')
      .eq('classificacao', 'relevo')
      .eq('user_id', user.id)
      .not('observacoes', 'ilike', '%DEPRECADA%')
      .limit(10)
  ])

  // Calculate breakdown
  const yearStats: Record<string, number> = {}
  allInquiries?.forEach((item: any) => {
    // Use data_atribuicao if available, otherwise created_at
    const rawDate = item.data_atribuicao || item.created_at
    const date = new Date(rawDate)

    if (!isNaN(date.getTime())) {
      const year = date.getFullYear().toString()
      yearStats[year] = (yearStats[year] || 0) + 1
    }
  })

  const sortedYears = Object.keys(yearStats).sort()



  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case 'por_iniciar': return 'bg-blue-500'
      case 'em_diligencias': return 'bg-yellow-500'
      case 'tribunal': return 'bg-purple-500'
      case 'concluido': return 'bg-green-500'
      case 'aguardando_resposta': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: InquiryStatus) => {
    return status.replace('_', ' ').toUpperCase()
  }
  return (
    <div className="space-y-6">

      {/* 5.1 Counters (Cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-stretch">
        <Link href="/inqueritos" className="block hover:opacity-80 transition-opacity h-full">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investigados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInqueries || 0}</div>
              <div className="text-xs text-muted-foreground mt-1 space-x-2">
                {sortedYears.map((year, idx) => (
                  <span key={year} className={idx > 0 ? "border-l pl-2 border-gray-300" : ""}>
                    {year}: <strong>{yearStats[year]}</strong>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inqueritos?status=por_iniciar" className="block hover:opacity-80 transition-opacity h-full">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Iniciar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pendingInqueries || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inqueritos?status=em_diligencias" className="block hover:opacity-80 transition-opacity h-full">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Diligências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{diligenceInqueries || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inqueritos?status=concluido" className="block hover:opacity-80 transition-opacity h-full">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedInqueries || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Card className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950 dark:border-indigo-900 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Existências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {(totalInqueries || 0) - (completedInqueries || 0)}
            </div>
          </CardContent>
        </Card>
        <Link href="/inqueritos?classificacao=relevo" className="block hover:opacity-80 transition-opacity h-full">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Relevo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{relevoInqueries || 0}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 5.2 Listagens rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Recent Inquiries */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Últimos Inquéritos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NUIPC</TableHead>
                  <TableHead>Crime</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Class.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInquiries?.map((inq) => (
                  <TableRow key={inq.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-medium">
                      <Link href={`/inqueritos/${inq.id}`} className="block">
                        {inq.nuipc}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/inqueritos/${inq.id}`} className="block">
                        {inq.tipo_crime}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/inqueritos/${inq.id}`} className="block">
                        <Badge className={getStatusColor(inq.estado as InquiryStatus)}>
                          {getStatusLabel(inq.estado as InquiryStatus)}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/inqueritos/${inq.id}`} className="block">
                        {inq.classificacao === 'relevo' && (
                          <Badge variant="destructive" className="text-xs">Relevo</Badge>
                        )}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {recentInquiries?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Sem inquéritos recentes</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* To Do Diligences */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Diligências a Realizar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {toDodiligences?.map((d) => (
                <Link href={`/inqueritos/${(d as any).inqueritos?.id}`} key={d.id} className="block group">
                  <div className="flex flex-col border-b pb-2 last:border-0 last:pb-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 rounded p-1">
                    <span className="font-semibold text-sm">{(d as any).inqueritos?.nuipc || 'N/A'}</span>
                    <span className="text-sm text-muted-foreground">{d.descricao}</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        Entidade: {d.entidade || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Enviado: {d.data_enviado ? new Date(d.data_enviado).toLocaleDateString() : 'S/ Data'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {toDodiligences?.length === 0 && (
                <div className="text-center text-muted-foreground text-sm">Nenhuma diligência por realizar.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Diligences */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Diligências Realizadas (Recentes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedDiligences?.map((d) => (
                <Link href={`/inqueritos/${(d as any).inqueritos?.id}`} key={d.id} className="block group">
                  <div className="flex flex-col border-b pb-2 last:border-0 last:pb-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 rounded p-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{(d as any).inqueritos?.nuipc || 'N/A'}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-muted-foreground">{d.entidade || '-'}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-muted-foreground">{d.data_enviado ? new Date(d.data_enviado).toLocaleDateString() : 'S/ Data'}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {completedDiligences?.length === 0 && (
                <div className="text-center text-muted-foreground text-sm">Nenhuma diligência realizada recentemente.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notable Inquiries */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-red-600">Inquéritos de Relevo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NUIPC</TableHead>
                  <TableHead>Crime</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notableInquiries?.map((inq) => (
                  <TableRow key={inq.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-medium">
                      <Link href={`/inqueritos/${inq.id}`} className="block">
                        {inq.nuipc}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/inqueritos/${inq.id}`} className="block">
                        {inq.tipo_crime}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/inqueritos/${inq.id}`} className="block">
                        <Badge className={getStatusColor(inq.estado as InquiryStatus)}>
                          {getStatusLabel(inq.estado as InquiryStatus)}
                        </Badge>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {notableInquiries?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Sem inquéritos de relevo.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Waiting Response - Inquiries AND Diligences */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">A aguardar respostas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">

              {/* 1. Inquéritos a aguardar */}
              {waitingResponse && waitingResponse.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Inquéritos com estado "Aguardando Resposta"</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NUIPC</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Class.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitingResponse.map((inq) => (
                        <TableRow key={inq.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="font-medium">
                            <Link href={`/inqueritos/${inq.id}`} className="block">
                              {inq.nuipc}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/inqueritos/${inq.id}`} className="block">
                              <Badge className={getStatusColor(inq.estado as InquiryStatus)}>
                                {getStatusLabel(inq.estado as InquiryStatus)}
                              </Badge>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/inqueritos/${inq.id}`} className="block">
                              {inq.classificacao === 'relevo' && (
                                <Badge variant="destructive" className="text-xs">Relevo</Badge>
                              )}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* 2. Diligências a aguardar */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Diligências "Enviado e a Aguardar"</h4>
                <div className="space-y-4">
                  {waitingDiligences?.map((d) => (
                    <Link href={`/inqueritos/${(d as any).inqueritos?.id}`} key={d.id} className="block group">
                      <div className="flex flex-col border-b pb-2 last:border-0 last:pb-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 rounded p-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-sm">{(d as any).inqueritos?.nuipc || 'N/A'}</span>
                          <Badge variant="secondary" className="text-xs">Aguardando Resposta</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{d.descricao}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">
                            Entidade: {d.entidade || '-'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Enviado: {d.data_enviado ? new Date(d.data_enviado).toLocaleDateString() : 'S/ Data'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {waitingDiligences?.length === 0 && (!waitingResponse || waitingResponse.length === 0) && (
                    <div className="text-center text-muted-foreground text-sm">Nada a aguardar.</div>
                  )}
                  {waitingDiligences?.length === 0 && waitingResponse && waitingResponse.length > 0 && (
                    <div className="text-center text-muted-foreground text-sm">Nenhuma diligência a aguardar.</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
