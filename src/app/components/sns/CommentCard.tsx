'use client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MoreHorizontal, Edit, Trash2, Check, X } from 'lucide-react'
import UserAvatar from './UserAvatar'
import type { Comment } from '@/types/sns'

interface CommentCardProps {
  comment: Comment
  currentUserId?: string
  onUpdate?: (commentId: number, newContent: string) => void
  onDelete?: (commentId: number) => void
}

export default function CommentCard({
  comment,
  currentUserId,
  onUpdate,
  onDelete,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showMenu, setShowMenu] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const isOwner = currentUserId === comment.userId

  const handleEdit = () => {
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !onUpdate) return

    setIsUpdating(true)
    try {
      await onUpdate(comment.id, editContent.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update comment:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このコメントを削除しますか？') || !onDelete) return

    try {
      await onDelete(comment.id)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  return (
    <div className='border-b border-gray-100 pb-4 last:border-b-0'>
      <div className='flex items-start gap-3'>
        <UserAvatar src={comment.user?.profile?.avatarUrl} alt={comment.user?.name} size='sm' />

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-medium text-gray-800 text-sm'>
              {comment.user?.name || 'ユーザー'}
            </span>
            <span className='text-xs text-gray-500'>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ja })}
            </span>
          </div>

          {isEditing ? (
            <div className='space-y-2'>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className='w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
                rows={2}
                maxLength={500}
                disabled={isUpdating}
              />
              <div className='flex items-center gap-2'>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || isUpdating}
                  className='flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors'
                >
                  <Check className='w-3 h-3' />
                  {isUpdating ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className='flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors'
                >
                  <X className='w-3 h-3' />
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <p className='text-sm text-gray-700 whitespace-pre-wrap leading-relaxed'>
              {comment.content}
            </p>
          )}
        </div>

        {isOwner && !isEditing && (
          <div className='relative'>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className='p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
            >
              <MoreHorizontal className='w-4 h-4' />
            </button>

            {showMenu && (
              <div className='absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]'>
                <button
                  onClick={handleEdit}
                  className='flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  <Edit className='w-4 h-4' />
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  className='flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                  削除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* クリック外でメニューを閉じる */}
      {showMenu && <div className='fixed inset-0 z-5' onClick={() => setShowMenu(false)} />}
    </div>
  )
}
