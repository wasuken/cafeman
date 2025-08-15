'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react'
import type { UserProfile, Post } from '@/types/sns'

interface SNSContextType {
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile | null) => void
  feedPosts: Post[]
  setFeedPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  updatePost: (postId: number, updates: Partial<Post>) => void
  removePost: (postId: number) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const SNSContext = createContext<SNSContextType | undefined>(undefined)

export const SNSProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [feedPosts, setFeedPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addPost = (post: Post) => {
    setFeedPosts(prev => [post, ...prev])
  }

  const updatePost = (postId: number, updates: Partial<Post>) => {
    setFeedPosts(prev => prev.map(post => (post.id === postId ? { ...post, ...updates } : post)))
  }

  const removePost = (postId: number) => {
    setFeedPosts(prev => prev.filter(post => post.id !== postId))
  }

  return (
    <SNSContext.Provider
      value={{
        userProfile,
        setUserProfile,
        feedPosts,
        setFeedPosts,
        addPost,
        updatePost,
        removePost,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </SNSContext.Provider>
  )
}

export const useSNS = () => {
  const context = useContext(SNSContext)
  if (context === undefined) {
    throw new Error('useSNS must be used within a SNSProvider')
  }
  return context
}
