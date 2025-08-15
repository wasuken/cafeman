'use client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Heart, MessageCircle, Share, MoreHorizontal, Coffee } from 'lucide-react'
import Link from 'next/link'
import UserAvatar from './UserAvatar'
import HashtagDisplay from './HashtagDisplay'
import type { PostWithStats } from '@/types/sns'

interface PostCardProps {
  post: PostWithStats
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)
    const optimisticLiked = !isLiked
    const optimisticCount = optimisticLiked ? likesCount + 1 : likesCount - 1
    setIsLiked(optimisticLiked)
    setLikesCount(optimisticCount)

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
      if (!response.ok) {
        setIsLiked(!optimisticLiked)
        setLikesCount(likesCount)
      }
    } catch (error) {
      setIsLiked(!optimisticLiked)
      setLikesCount(likesCount)
      console.error('Failed to toggle like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.user?.name}さんの投稿`,
          text: post.content,
          url: window.location.origin + `/post-detail/${post.id}`,
        })
      } catch (error) {
        console.log('Share failed:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.origin + `/post-detail/${post.id}`)
      alert('URLをクリップボードにコピーしました')
    }
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
      <div className='flex items-start justify-between mb-4'>
        <Link
          href={`/profile-user/${post.userId}`}
          className='flex items-center gap-3 hover:opacity-80 transition-opacity'
        >
          <UserAvatar src={post.user?.profile?.avatarUrl} alt={post.user?.name} size='md' />
          <div>
            <p className='font-semibold text-gray-800'>{post.user?.name || 'ユーザー'}</p>
            <p className='text-sm text-gray-500'>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ja })}
            </p>
          </div>
        </Link>
        <button className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'>
          <MoreHorizontal className='w-5 h-5' />
        </button>
      </div>

      <div className='mb-4'>
        <p className='text-gray-800 whitespace-pre-wrap leading-relaxed'>{post.content}</p>
      </div>

      {post.imageUrl && (
        <div className='mb-4'>
          <img
            src={post.imageUrl}
            alt='投稿画像'
            className='w-full rounded-lg object-cover max-h-96'
          />
        </div>
      )}

      {post.hashtags && post.hashtags.length > 0 && (
        <div className='mb-4'>
          <HashtagDisplay hashtags={post.hashtags} />
        </div>
      )}

      <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
        <div className='flex items-center gap-6'>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isLiked ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'}`}
          >
            <Heart
              className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`}
            />
            <span className='text-sm font-medium'>{likesCount}</span>
          </button>

          <Link
            href={`/post-detail/${post.id}`}
            className='flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
          >
            <MessageCircle className='w-5 h-5' />
            <span className='text-sm font-medium'>{post._count?.comments || 0}</span>
          </Link>

          <button
            onClick={handleShare}
            className='flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
          >
            <Share className='w-5 h-5' />
          </button>
        </div>
        <Coffee className='w-5 h-5 text-brown-400' />
      </div>
    </div>
  )
}
