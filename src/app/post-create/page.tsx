'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft, Coffee, Image, Hash, Send, X } from 'lucide-react'
import Link from 'next/link'
import UserAvatar from '@/app/components/sns/UserAvatar'
import { validateImageFile, resizeImage } from '@/lib/utils/image-upload'

export default function PostCreatePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [hashtags, setHashtags] = useState<string[]>([])
  const [newHashtag, setNewHashtag] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error || '画像ファイルが無効です')
      return
    }

    try {
      const resizedBlob = await resizeImage(file, 800, 600, 0.8)
      const resizedFile = new File([resizedBlob], file.name, { type: file.type })
      setImageFile(resizedFile)
      const previewUrl = URL.createObjectURL(resizedFile)
      setImagePreview(previewUrl)
      setError(null)
    } catch (err) {
      setError('画像の処理に失敗しました')
    }
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
  }

  const addHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      setHashtags([...hashtags, newHashtag.trim()])
      setNewHashtag('')
    }
  }

  const removeHashtag = (tag: string) => setHashtags(hashtags.filter(t => t !== tag))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      let imageUrl = undefined
      if (imageFile) imageUrl = 'https://via.placeholder.com/400x300'

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, imageUrl, hashtags, isPublic }),
      })

      if (response.ok) {
        router.push('/feed')
      } else {
        const data = await response.json()
        setError(data.error || '投稿に失敗しました')
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-2xl'>
        <header className='flex items-center justify-between mb-6'>
          <Link
            href='/feed'
            className='flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
            フィードに戻る
          </Link>
          <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
            <Coffee className='w-6 h-6 text-brown-600' />
            新しい投稿
          </h1>
          <div className='w-20'></div>
        </header>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <form onSubmit={handleSubmit}>
            <div className='flex items-center gap-3 mb-4'>
              <UserAvatar size='md' />
              <div>
                <p className='font-semibold text-gray-800'>{user.name || 'ユーザー'}</p>
                <p className='text-sm text-gray-600'>{user.email}</p>
              </div>
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-3 mb-4'>
                <p className='text-red-700 text-sm'>{error}</p>
              </div>
            )}

            <div className='mb-4'>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder='今日のコーヒーはどうでしたか？'
                className='w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                maxLength={280}
              />
              <div className='flex justify-between items-center mt-2'>
                <span className='text-sm text-gray-500'>{content.length}/280文字</span>
              </div>
            </div>

            <div className='mb-4'>
              {!imagePreview ? (
                <label className='flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors'>
                  <div className='text-center'>
                    <Image className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                    <p className='text-sm text-gray-600'>画像を追加（任意）</p>
                  </div>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />
                </label>
              ) : (
                <div className='relative'>
                  <img
                    src={imagePreview}
                    alt='投稿画像プレビュー'
                    className='w-full h-64 object-cover rounded-lg'
                  />
                  <button
                    type='button'
                    onClick={removeImage}
                    className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            <div className='mb-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Hash className='w-4 h-4 text-gray-500' />
                <input
                  type='text'
                  value={newHashtag}
                  onChange={e => setNewHashtag(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  placeholder='ハッシュタグを追加'
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <button
                  type='button'
                  onClick={addHashtag}
                  className='px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors'
                >
                  追加
                </button>
              </div>

              {hashtags.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm'
                    >
                      #{tag}
                      <button
                        type='button'
                        onClick={() => removeHashtag(tag)}
                        className='hover:text-blue-900'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className='mb-6'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-700'>公開投稿として投稿する</span>
              </label>
            </div>

            <button
              type='submit'
              disabled={!content.trim() || isSubmitting}
              className='w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
            >
              {isSubmitting ? (
                <>
                  <Coffee className='w-5 h-5 animate-pulse' />
                  投稿中...
                </>
              ) : (
                <>
                  <Send className='w-5 h-5' />
                  投稿する
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
