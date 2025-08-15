'use client'
import { useState, useEffect, use } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Coffee } from 'lucide-react'
import Link from 'next/link'
import PostCard from '@/app/components/sns/PostCard'
import CommentSection from '@/app/components/sns/CommentSection'
import LoadingSpinner from '@/app/components/sns/LoadingSpinner'
import type { PostWithStats } from '@/types/sns'

interface PostDetailPageProps {
  params: Promise<{ id: string }>
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<PostWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // React.use()でparamsを解決
  const resolvedParams = use(params)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
      return
    }
    if (user) fetchPost()
  }, [user, isAuthLoading, router, resolvedParams.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}`)
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

        <div className='space-y-6'>
          {/* 投稿カード */}
          <PostCard post={post} />

          {/* コメントセクション */}
          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  )
}
