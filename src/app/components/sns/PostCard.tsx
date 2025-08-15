'use client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Heart, MessageCircle, Share, MoreHorizontal, Coffee, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import UserAvatar from './UserAvatar'
import HashtagDisplay from './HashtagDisplay'
import type { PostWithStats } from '@/types/sns'

interface PostCardProps {
  post: PostWithStats
  showFullContent?: boolean
  onDelete?: () => void
}

export default function PostCard({ post, showFullContent = false, onDelete }: PostCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0)
  const [commentsCount, setCommentsCount] = useState(post._count?.comments || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isOwner = user?.userId === post.userId

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
        throw new Error('いいねの処理に失敗しました')
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
    const shareData = {
      title: `${post.user?.name}さんの投稿`,
      text: post.content,
      url: `${window.location.origin}/post-detail/${post.id}`,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log('Share failed:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url)
        alert('URLをクリップボードにコピーしました')
      } catch (error) {
        console.error('Failed to copy URL:', error)
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm('この投稿を削除しますか？')) return

    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (response.ok) {
        onDelete?.()
      } else {
        throw new Error('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('投稿の削除に失敗しました')
    }
  }

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleMenuClose = () => {
    setShowMenu(false)
  }

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength || showFullContent) return content
    return content.substring(0, maxLength) + '...'
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

        {isOwner && (
          <div className='relative'>
            <button
              onClick={handleMenuToggle}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
              type='button'
            >
              <MoreHorizontal className='w-5 h-5' />
            </button>

            {showMenu && (
              <>
                <div className='absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[120px]'>
                  <Link
                    href={`/post-edit/${post.id}`}
                    onClick={handleMenuClose}
                    className='flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg'
                  >
                    <Edit className='w-4 h-4' />
                    編集
                  </Link>
                  <button
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMenuClose()
                      handleDelete()
                    }}
                    className='flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg'
                  >
                    <Trash2 className='w-4 h-4' />
                    削除
                  </button>
                </div>
                {/* メニュー外クリックで閉じる */}
                <div className='fixed inset-0 z-20' onClick={handleMenuClose} />
              </>
            )}
          </div>
        )}
      </div>

      <div className='mb-4'>
        <p className='text-gray-800 whitespace-pre-wrap leading-relaxed'>
          {truncateContent(post.content)}
        </p>
        {!showFullContent && post.content.length > 200 && (
          <Link
            href={`/post-detail/${post.id}`}
            className='text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block'
          >
            もっと見る
          </Link>
        )}
      </div>

      {post.imageUrl && (
        <div className='mb-4'>
          <img
            src={post.imageUrl}
            alt='投稿画像'
            className='w-full rounded-lg object-cover max-h-96 cursor-pointer hover:opacity-95 transition-opacity'
            onClick={() => window.open(post.imageUrl, '_blank')}
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
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }`}
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
            <span className='text-sm font-medium'>{commentsCount}</span>
          </Link>

          <button
            onClick={handleShare}
            className='flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
          >
            <Share className='w-5 h-5' />
            <span className='text-sm font-medium hidden sm:inline'>シェア</span>
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <Coffee className='w-5 h-5 text-brown-400' />
          {post.user?.profile?.location && (
            <span className='text-xs text-gray-500'>{post.user.profile.location}</span>
          )}
        </div>
      </div>
    </div>
  )
}
