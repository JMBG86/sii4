'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { login } from './actions'
import { LoginButton } from './login-button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [errorMsg, setErrorMsg] = useState<string | null>(error)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setErrorMsg(null)

        const formData = new FormData(event.currentTarget)
        const result = await login(formData)

        setLoading(false)

        if (result?.error) {
            setErrorMsg(result.error)
        } else if (result?.redirect) {
            router.push(result.redirect)
        }
    }

    return (
        <Card className="w-full max-w-sm border-0 shadow-lg sm:border sm:border-gray-200">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold tracking-tight">
                    Gestão de Inquéritos
                </CardTitle>
                <CardDescription>
                    Entre com as suas credenciais para aceder
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* App Context Selector */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <label className="cursor-pointer">
                            <input type="radio" name="context" value="sii" className="peer sr-only" defaultChecked />
                            <div className="rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 text-center transition-all">
                                <span className="block font-semibold">SII</span>
                            </div>
                        </label>
                        <label className="cursor-pointer">
                            <input type="radio" name="context" value="sp" className="peer sr-only" />
                            <div className="rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-900 text-center transition-all">
                                <span className="block font-semibold">SP</span>
                            </div>
                        </label>
                        <label className="cursor-pointer">
                            <input type="radio" name="context" value="sg" className="peer sr-only" />
                            <div className="rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent peer-checked:border-amber-600 peer-checked:bg-amber-50 peer-checked:text-amber-900 text-center transition-all">
                                <span className="block font-semibold">SG</span>
                            </div>
                        </label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="nome@exemplo.com"
                            required
                            className="bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="bg-white"
                        />
                    </div>
                    {errorMsg && (
                        <div className="text-sm font-medium text-red-500 text-center animate-pulse">
                            {errorMsg}
                        </div>
                    )}
                    <LoginButton loading={loading} />
                </form>
            </CardContent>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Suspense fallback={<div className="text-center">A carregar...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
