import { NextResponse } from 'next/server'

const COOKIE_NAME = 'session'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'ログアウトしました。' })

    // Clear the cookie by setting its maxAge to 0
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'ログアウト中にエラーが発生しました。' }, { status: 500 })
  }
}
