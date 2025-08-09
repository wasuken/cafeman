import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { z } from 'zod'

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// A secret key for signing the JWT. In a real app, use an environment variable.
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-at-least-32-chars-long')
const COOKIE_NAME = 'session'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = loginUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: '無効なリクエストです。' }, { status: 400 })
    }

    const { email, password } = validation.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません。' }, { status: 401 })
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません。' }, { status: 401 })
    }

    // Create JWT
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d') // Token expires in 1 day
      .sign(JWT_SECRET)

    const response = NextResponse.json({ success: true, message: 'ログインに成功しました。' })

    // Set cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'ログイン中にエラーが発生しました。' }, { status: 500 })
  }
}
