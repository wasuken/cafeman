'use client'
import { Heart, MessageCircle, Eye, Share } from 'lucide-react'

interface PostStatsProps {
  likesCount: number
  commentsCount: number
  viewsCount?: number
  sharesCount?: number
  className?: string
}

export default function PostStats({
  likesCount,
  commentsCount,
  viewsCount,
  sharesCount,
  className = '',
}: PostStatsProps) {
  return (
    <div className={`flex items-center gap-6 text-sm text-gray-600 ${className}`}>
      <div className='flex items-center gap-1'>
        <Heart className='w-4 h-4' />
        <span>{likesCount.toLocaleString()}</span>
      </div>

      <div className='flex items-center gap-1'>
        <MessageCircle className='w-4 h-4' />
        <span>{commentsCount.toLocaleString()}</span>
      </div>

      {viewsCount !== undefined && (
        <div className='flex items-center gap-1'>
          <Eye className='w-4 h-4' />
          <span>{viewsCount.toLocaleString()}</span>
        </div>
      )}

      {sharesCount !== undefined && sharesCount > 0 && (
        <div className='flex items-center gap-1'>
          <Share className='w-4 h-4' />
          <span>{sharesCount.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
