'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Coffee, Plus, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import PostCard from '@/app/components/sns/PostCard'
import LoadingSpinner from '@/app/components/sns/LoadingSpinner'
import { useFeedPosts } from '@/hooks/useSNSData'

export default function FeedPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const { posts, isLoading, hasMore, refreshPosts, loadMore } = useFeedPosts()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && !user) router.push('/login')
  }, [user, isAuthLoading, router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshPosts()
    setIsRefreshing(false)
  }

  if (isAuthLoading || !user) return <LoadingSpinner size='lg' message='読み込み中...' />

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-2xl'>
        <header className='flex items-center justify-between mb-6'>
          <Link
            href='/'
            className='flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
            ホームに戻る
          </Link>
          <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
            <Coffee className='w-6 h-6 text-brown-600' />
            コーヒーフィード
          </h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors'
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className='mb-6'>
          <Link
            href='/post-create'
            className='flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
          >
            <Plus className='w-5 h-5' />
            新しい投稿
          </Link>
        </div>

        <div className='space-y-6'>
          {isLoading && posts.length === 0 ? (
            <LoadingSpinner size='lg' message='フィードを読み込み中...' />
          ) : posts.length === 0 ? (
            <div className='text-center py-12'>
              <Coffee className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-600 mb-2'>まだ投稿がありません</h3>
              <p className='text-gray-500 mb-6'>
                最初の投稿を作成してコーヒーライフをシェアしましょう！
              </p>
              <Link
                href='/post-create'
                className='inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
              >
                <Plus className='w-5 h-5' />
                投稿を作成
              </Link>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
              {hasMore && (
                <div className='flex justify-center py-6'>
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className='flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors'
                  >
                    {isLoading ? (
                      <>
                        <Coffee className='w-5 h-5 animate-pulse' />
                        読み込み中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className='w-5 h-5' />
                        もっと読み込む
                      </>
                    )}
                  </button>
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <div className='text-center py-6 text-gray-500'>すべての投稿を表示しました</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
