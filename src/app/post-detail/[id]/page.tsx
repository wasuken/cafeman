'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Coffee } from 'lucide-react'
import Link from 'next/link'
import PostCard from '@/app/components/sns/PostCard'
import LoadingSpinner from '@/app/components/sns/LoadingSpinner'
import type { PostWithStats } from '@/types/sns'

interface PostDetailPageProps {
  params: { id: string }
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<PostWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
      return
    }
    if (user) fetchPost()
  }, [user, isAuthLoading, router, params.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      } else if (response.status === 404) {
        setError('投稿が見つかりません')
      } else {
        setError('投稿の取得に失敗しました')
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading || isLoading) return <LoadingSpinner size='lg' message='読み込み中...' />
  if (!user) return null

  if (error || !post) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Coffee className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-600 mb-2'>
            {error || '投稿が見つかりません'}
          </h2>
          <Link href='/feed' className='text-blue-600 hover:text-blue-800 underline'>
            フィードに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-2xl'>
        <header className='flex items-center justify-between mb-6'>
          <Link
            href='/feed'
            className='flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
            フィードに戻る
          </Link>
          <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
            <Coffee className='w-6 h-6 text-brown-600' />
            投稿詳細
          </h1>
          <div className='w-20'></div>
        </header>

        <PostCard post={post} />

        <div className='mt-6 bg-white rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold text-gray-800 mb-4'>コメント</h3>
          <div className='text-center py-8 text-gray-500'>
            <Coffee className='w-12 h-12 text-gray-300 mx-auto mb-2' />
            <p>コメント機能は次のフェーズで実装予定です</p>
          </div>
        </div>
      </div>
    </div>
  )
}
