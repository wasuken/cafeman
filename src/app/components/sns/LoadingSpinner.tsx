'use client'

import { Coffee } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  return (
    <div className='flex flex-col items-center justify-center py-8'>
      <Coffee className={`${sizeClasses[size]} text-brown-600 animate-pulse mb-2`} />
      {message && <p className='text-gray-600 text-sm'>{message}</p>}
    </div>
  )
}
