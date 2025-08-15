'use client'

import { User } from 'lucide-react'

interface UserAvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
}

export default function UserAvatar({ src, alt, size = 'md', className = '' }: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'ユーザーアバター'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center ${className}`}
    >
      <User className='w-1/2 h-1/2 text-gray-500' />
    </div>
  )
}
