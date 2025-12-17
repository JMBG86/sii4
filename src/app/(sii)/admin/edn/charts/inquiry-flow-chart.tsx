'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FlowData {
    period: string
    created: number
    concluded: number
}

interface InquiryFlowChartProps {
    weeklyData: FlowData[]
    monthlyData: FlowData[]
    quarterlyData: FlowData[]
}

export function InquiryFlowChart({ weeklyData, monthlyData, quarterlyData }: InquiryFlowChartProps) {
    const hasData = (data: FlowData[]) => data && data.length > 0

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle>Fluxo de Inquéritos</CardTitle>
                <CardDescription>
                    Comparação entre inquéritos entrados e concluídos ao longo do tempo.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <Tabs defaultValue="monthly" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="weekly">Semanal</TabsTrigger>
                        <TabsTrigger value="monthly">Mensal</TabsTrigger>
                        <TabsTrigger value="quarterly">Trimestral</TabsTrigger>
                    </TabsList>

                    <TabsContent value="weekly" className="h-[300px]">
                        {hasData(weeklyData) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <XAxis dataKey="period" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="created" name="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="concluded" name="Saídas (Concluídos)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                Sem dados semanais para apresentar.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="monthly" className="h-[300px]">
                        {hasData(monthlyData) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <XAxis dataKey="period" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="created" name="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="concluded" name="Saídas (Concluídos)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                Sem dados mensais para apresentar.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="quarterly" className="h-[300px]">
                        {hasData(quarterlyData) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={quarterlyData}>
                                    <XAxis dataKey="period" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="created" name="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="concluded" name="Saídas (Concluídos)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                Sem dados trimestrais para apresentar.
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
