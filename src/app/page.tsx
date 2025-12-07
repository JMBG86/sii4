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

  // 1. Fetch Counts
  // We can do this efficiently with count() queries
  const { count: totalInqueries } = await supabase.from('inqueritos').select('*', { count: 'exact', head: true })
  const { count: pendingInqueries } = await supabase.from('inqueritos').select('*', { count: 'exact', head: true }).eq('estado', 'por_iniciar')
  const { count: diligenceInqueries } = await supabase.from('inqueritos').select('*', { count: 'exact', head: true }).eq('estado', 'em_diligencias')
  const { count: courtInqueries } = await supabase.from('inqueritos').select('*', { count: 'exact', head: true }).eq('estado', 'tribunal')
  const { count: completedInqueries } = await supabase.from('inqueritos').select('*', { count: 'exact', head: true }).eq('estado', 'concluido')
  const { count: relevoInqueries } = await supabase.from('inqueritos').select('*', { count: 'exact', head: true }).eq('classificacao', 'relevo')

  // 2. Fetch Lists
  const { data: recentInquiries } = await supabase
    .from('inqueritos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch all NUIPCs for year stats (optimization: only select nuipc)
  const { data: allNuipcs } = await supabase.from('inqueritos').select('nuipc')

  // Calculate breakdown
  const yearStats: Record<string, number> = {}
  allNuipcs?.forEach(item => {
    // Regex to extract year from format XXXX/YY.ZZZZZ
    // Looking for / followed by 2 digits and a dot
    const match = item.nuipc.match(/\/(\d{2})\./)
    if (match && match[1]) {
      const year = `20${match[1]}` // assuming 2000s
      yearStats[year] = (yearStats[year] || 0) + 1
    }
  })

  // Sort years
  const sortedYears = Object.keys(yearStats).sort()


  const { data: pendingDiligences } = await supabase
    .from('diligencias')
    .select('*, inqueritos(nuipc)')
    .eq('estado', 'pendente')
    .limit(5)

  const { data: waitingResponse } = await supabase
    .from('inqueritos')
    .select('*')
    .eq('estado', 'aguardando_resposta')
    .limit(5)

  const { data: notableInquiries } = await supabase
    .from('inqueritos')
    .select('*')
    .eq('classificacao', 'relevo')
    .limit(5)


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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link href="/inqueritos" className="block hover:opacity-80 transition-opacity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
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
        <Link href="/inqueritos?status=por_iniciar" className="block hover:opacity-80 transition-opacity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Iniciar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pendingInqueries || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inqueritos?status=em_diligencias" className="block hover:opacity-80 transition-opacity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Diligências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{diligenceInqueries || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inqueritos?status=tribunal" className="block hover:opacity-80 transition-opacity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tribunal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{courtInqueries || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inqueritos?status=concluido" className="block hover:opacity-80 transition-opacity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedInqueries || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inqueritos?classificacao=relevo" className="block hover:opacity-80 transition-opacity">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
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

        {/* Recent Inquiries - Takes up 4 cols */}
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
                  </TableRow>
                ))}
                {recentInquiries?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Sem inquéritos recentes</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Diligences - Takes up 3 cols */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Diligências Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingDiligences?.map((d) => (
                <div key={d.id} className="flex flex-col border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-semibold text-sm">{(d as any).inqueritos?.nuipc || 'N/A'}</span>
                  <span className="text-sm text-muted-foreground">{d.descricao}</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {d.data_prevista ? new Date(d.data_prevista).toLocaleDateString() : 'S/ Data'}
                    </span>
                  </div>
                </div>
              ))}
              {pendingDiligences?.length === 0 && (
                <div className="text-center text-muted-foreground text-sm">Nenhuma diligência pendente.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5.3 Destaques / Waiting Response */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Aguardando Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NUIPC</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitingResponse?.map((inq) => (
                  <TableRow key={inq.id}>
                    <TableCell className="font-medium">{inq.nuipc}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(inq.estado as InquiryStatus)}>
                        {getStatusLabel(inq.estado as InquiryStatus)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {waitingResponse?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">Nada a aguardar.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
