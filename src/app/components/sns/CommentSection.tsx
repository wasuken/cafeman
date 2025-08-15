'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { RefreshCw, MessageCircle } from 'lucide-react'
import CommentCard from './CommentCard'
import CommentInput from './CommentInput'
import LoadingSpinner from './LoadingSpinner'
import type { Comment } from '@/types/sns'

interface CommentSectionProps {
  postId: number
  className?: string
}

export default function CommentSection({ postId, className = '' }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>()
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    loadComments(true)
  }, [postId])

  const loadComments = async (reset = false) => {
    if (reset) {
      setIsLoading(true)
      setCursor(undefined)
      setHasMore(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const url = `/api/posts/${postId}/comments${cursor && !reset ? `?cursor=${cursor}` : ''}`
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setComments(prev => (reset ? data.comments : [...prev, ...data.comments]))
        setHasMore(data.hasMore)
        setCursor(data.nextCursor)
      } else {
        console.error('Failed to fetch comments:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleCreateComment = async (content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments(prev => [newComment, ...prev])
      } else {
        const error = await response.json()
        throw new Error(error.error || 'コメントの作成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert(error instanceof Error ? error.message : 'コメントの作成に失敗しました')
      throw error
    }
  }

  const handleUpdateComment = async (commentId: number, newContent: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })

      if (response.ok) {
        const updatedComment = await response.json()
        setComments(prev =>
          prev.map(comment => (comment.id === commentId ? updatedComment : comment))
        )
      } else {
        const error = await response.json()
        throw new Error(error.error || 'コメントの更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert(error instanceof Error ? error.message : 'コメントの更新に失敗しました')
      throw error
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'コメントの削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert(error instanceof Error ? error.message : 'コメントの削除に失敗しました')
      throw error
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <MessageCircle className='w-5 h-5' />
            コメント ({comments.length})
          </h3>
          <button
            onClick={() => loadComments(true)}
            className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
          </button>
        </div>

        {/* コメント入力 */}
        <div className='mb-6'>
          <CommentInput onSubmit={handleCreateComment} placeholder='この投稿にコメントする...' />
        </div>

        {/* コメント一覧 */}
        <div className='space-y-4'>
          {isLoading ? (
            <LoadingSpinner size='md' message='コメントを読み込み中...' />
          ) : comments.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <MessageCircle className='w-12 h-12 text-gray-300 mx-auto mb-2' />
              <p>まだコメントはありません</p>
              <p className='text-sm'>最初のコメントを投稿してみましょう！</p>
            </div>
          ) : (
            <>
              {comments.map(comment => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.userId}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              ))}

              {hasMore && (
                <div className='flex justify-center pt-4'>
                  <button
                    onClick={() => loadComments(false)}
                    disabled={isLoadingMore}
                    className='flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50'
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className='w-4 h-4 animate-spin' />
                        読み込み中...
                      </>
                    ) : (
                      <>
                        <MessageCircle className='w-4 h-4' />
                        もっと読み込む
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
