'use client'
import { useState, useEffect } from 'react'
import type { Comment } from '@/types/sns'

export function useComments(postId: number) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>()

  const loadComments = async (reset = false) => {
    if (reset) {
      setIsLoading(true)
      setCursor(undefined)
      setHasMore(true)
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
        throw new Error('コメントの取得に失敗しました')
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createComment = async (content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments(prev => [newComment, ...prev])
        return newComment
      } else {
        const error = await response.json()
        throw new Error(error.error || 'コメントの作成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
      throw error
    }
  }

  const updateComment = async (commentId: number, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const updatedComment = await response.json()
        setComments(prev =>
          prev.map(comment => (comment.id === commentId ? updatedComment : comment))
        )
        return updatedComment
      } else {
        const error = await response.json()
        throw new Error(error.error || 'コメントの更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
      throw error
    }
  }

  const deleteComment = async (commentId: number) => {
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
      throw error
    }
  }

  const refreshComments = () => loadComments(true)
  const loadMoreComments = () => hasMore && !isLoading && loadComments(false)

  useEffect(() => {
    loadComments(true)
  }, [postId])

  return {
    comments,
    isLoading,
    hasMore,
    createComment,
    updateComment,
    deleteComment,
    refreshComments,
    loadMoreComments,
  }
}

export function usePostEngagement(initialPost: any) {
  const [likesCount, setLikesCount] = useState(initialPost._count?.likes || 0)
  const [commentsCount, setCommentsCount] = useState(initialPost._count?.comments || 0)
  const [isLiked, setIsLiked] = useState(initialPost.isLiked || false)

  const toggleLike = async (postId: number) => {
    const optimisticLiked = !isLiked
    const optimisticCount = optimisticLiked ? likesCount + 1 : likesCount - 1

    setIsLiked(optimisticLiked)
    setLikesCount(optimisticCount)

    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      if (!response.ok) {
        // Revert on error
        setIsLiked(!optimisticLiked)
        setLikesCount(likesCount)
        throw new Error('いいねの処理に失敗しました')
      }
    } catch (error) {
      setIsLiked(!optimisticLiked)
      setLikesCount(likesCount)
      throw error
    }
  }

  const incrementCommentCount = () => {
    setCommentsCount(prev => prev + 1)
  }

  const decrementCommentCount = () => {
    setCommentsCount(prev => Math.max(0, prev - 1))
  }

  return {
    likesCount,
    commentsCount,
    isLiked,
    toggleLike,
    incrementCommentCount,
    decrementCommentCount,
  }
}
