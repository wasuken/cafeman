'use client'
import { useState } from 'react'
import { Send, Coffee } from 'lucide-react'
import UserAvatar from './UserAvatar'

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function CommentInput({
  onSubmit,
  placeholder = 'コメントを入力...',
  disabled = false,
  className = '',
}: CommentInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <div className='flex gap-3'>
        <UserAvatar size='sm' />
        <div className='flex-1'>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className='w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            rows={2}
            maxLength={500}
            disabled={disabled || isSubmitting}
          />
          <div className='flex justify-between items-center mt-2'>
            <span className='text-xs text-gray-500'>
              {content.length}/500文字 • Cmd+Enterで送信
            </span>
            <button
              type='submit'
              disabled={!content.trim() || isSubmitting || disabled}
              className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
            >
              {isSubmitting ? (
                <>
                  <Coffee className='w-4 h-4 animate-pulse' />
                  送信中...
                </>
              ) : (
                <>
                  <Send className='w-4 h-4' />
                  送信
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
