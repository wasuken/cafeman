import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-that-is-at-least-32-chars-long'
)
const COOKIE_NAME = 'session'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(COOKIE_NAME)

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET)

    // Add user id to the request headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (err) {
    // If token verification fails, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login, register (public pages)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}
