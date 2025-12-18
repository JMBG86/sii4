
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardCounts } from "./actions"
import { FileText, Mail } from "lucide-react"

export default async function SPDashboard() {
    const counts = await getDashboardCounts()

    return (
        <div className="p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Secção de Processos</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Visão geral da atividade e pendentes.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Processos Crime Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Processos Crime (GBABF)</CardTitle>
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.processos}</div>
                        <p className="text-xs text-muted-foreground">Processos registados e atribuídos</p>
                    </CardContent>
                </Card>

                {/* Correspondência Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Correspondência Pendente</CardTitle>
                        <Mail className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.correspondencia}</div>
                        <p className="text-xs text-muted-foreground">Total de entradas registadas</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
