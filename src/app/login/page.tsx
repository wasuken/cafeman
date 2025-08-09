'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        // Fetch session to get user data and update context
        const sessionRes = await fetch('/api/auth/session')
        const data = await sessionRes.json()
        if (data.user) {
          login(data.user)
          router.push('/')
        } else {
          setError('ログインセッションの取得に失敗しました。')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'ログインに失敗しました。')
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='max-w-md w-full bg-white shadow-md rounded-lg p-8'>
        <h2 className='text-2xl font-bold text-center mb-6'>ログイン</h2>
        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='email'>
              メールアドレス
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
            />
          </div>
          <div className='mb-6'>
            <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='password'>
              パスワード
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline'
            />
          </div>
          <div className='flex items-center justify-between'>
            <button
              type='submit'
              disabled={loading}
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400'
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
        </form>
        <p className='text-center text-gray-500 text-xs mt-6'>
          アカウントをお持ちではありませんか？{' '}
          <Link href='/register' className='text-blue-500 hover:text-blue-700'>
            新規登録
          </Link>
        </p>
      </div>
    </div>
  )
}
