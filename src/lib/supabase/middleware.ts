import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If user is signed in and visits login, redirect to home
    if (request.nextUrl.pathname.startsWith('/login') && user) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // If user is NOT signed in and visits NOT login, redirect to login
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login')
    ) {
        // Check if the route is public (e.g. auth callback if needed, or static)
        // The matcher in middleware.ts handles static files mostly.

        // Just to be safe, avoid redirect loops if specific auth routes
        if (request.nextUrl.pathname.startsWith('/auth')) {
            return response
        }

        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return response
}
