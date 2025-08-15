'use client'

import Link from 'next/link'

interface HashtagDisplayProps {
  hashtags: string[]
  className?: string
}

export default function HashtagDisplay({ hashtags, className = '' }: HashtagDisplayProps) {
  if (!hashtags || hashtags.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {hashtags.map((tag, index) => (
        <Link
          key={index}
          href={`/search?hashtag=${encodeURIComponent(tag)}`}
          className='text-blue-600 hover:text-blue-800 text-sm hover:underline'
        >
          #{tag}
        </Link>
      ))}
    </div>
  )
}
