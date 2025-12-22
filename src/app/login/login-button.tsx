'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LoginButtonProps {
    loading: boolean
}

export function LoginButton({ loading }: LoginButtonProps) {
    return (
        <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A entrar...
                </>
            ) : (
                'Entrar'
            )}
        </Button>
    )
}
