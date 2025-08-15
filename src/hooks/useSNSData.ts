'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { UserProfile, Post } from '@/types/sns'

export function useUserProfile(userId?: string) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const targetUserId = userId || user?.userId

  useEffect(() => {
    if (!targetUserId) return
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/users/${targetUserId}/profile`)
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        } else {
          setError('プロフィールの取得に失敗しました')
        }
      } catch (err) {
        setError('ネットワークエラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [targetUserId])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!targetUserId) return
    try {
      const response = await fetch(`/api/users/${targetUserId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        return updatedProfile
      } else {
        throw new Error('プロフィールの更新に失敗しました')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  return { profile, isLoading, error, updateProfile }
}

export function useFeedPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>()

  const loadPosts = async (reset = false) => {
    setIsLoading(true)
    try {
      const url = `/api/feed${cursor && !reset ? `?cursor=${cursor}` : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPosts(prev => (reset ? data.posts : [...prev, ...data.posts]))
        setHasMore(data.hasMore)
        setCursor(data.nextCursor)
      } else {
        console.error('Failed to fetch feed:', response.status)
      }
    } catch (error) {
      console.error('フィードの取得に失敗しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshPosts = () => {
    setCursor(undefined)
    setHasMore(true)
    loadPosts(true)
  }

  const loadMore = () => {
    if (hasMore && !isLoading) loadPosts(false)
  }

  useEffect(() => {
    loadPosts(true)
  }, [])

  return { posts, isLoading, hasMore, refreshPosts, loadMore }
}

export function usePost(postId: string) {
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!postId) return
    const fetchPost = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/posts/${postId}`)
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
    fetchPost()
  }, [postId])

  return { post, isLoading, error, refetch: () => window.location.reload() }
}
