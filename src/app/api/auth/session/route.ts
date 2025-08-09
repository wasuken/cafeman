import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-at-least-32-chars-long')
const COOKIE_NAME = 'session'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(COOKIE_NAME)

  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET)
    return NextResponse.json({ user: payload }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
