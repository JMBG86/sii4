
export default function SPDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Secção de Processos</h1>
            <p className="text-gray-600 dark:text-gray-400">
                Bem-vindo à nova área de gestão de correspondência e processos.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder cards */}
                <div className="h-32 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="font-semibold">Correspondência Pendente</h3>
                    <p className="text-2xl font-bold mt-2">0</p>
                </div>
            </div>
        </div>
    )
}
