'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft, Coffee, Image, Hash, Save, X } from 'lucide-react'
import Link from 'next/link'
import UserAvatar from '@/app/components/sns/UserAvatar'
import LoadingSpinner from '@/app/components/sns/LoadingSpinner'
import { validateImageFile, resizeImage } from '@/lib/utils/image-upload'
import type { PostWithStats } from '@/types/sns'

interface PostEditPageProps {
  params: Promise<{ id: string }>
}

export default function PostEditPage({ params }: PostEditPageProps) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<PostWithStats | null>(null)
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [hashtags, setHashtags] = useState<string[]>([])
  const [newHashtag, setNewHashtag] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [postId, setPostId] = useState<string | null>(null)

  // paramsを一度だけ解決
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setPostId(resolvedParams.id)
      } catch (err) {
        console.error('Failed to resolve params:', err)
        setError('ページパラメータの取得に失敗しました')
        setIsLoading(false)
      }
    }
    resolveParams()
  }, [params])

  // 認証チェック
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // 投稿データ取得
  useEffect(() => {
    if (user && postId && !isAuthLoading) {
      fetchPost()
    }
  }, [user, postId, isAuthLoading])

  const fetchPost = async () => {
    if (!postId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('投稿が見つかりません')
        } else if (response.status === 403) {
          setError('編集権限がありません')
        } else {
          setError('投稿の取得に失敗しました')
        }
        return
      }

      const data = await response.json()

      // 投稿の所有者確認
      if (data.userId !== user?.userId) {
        setError('この投稿を編集する権限がありません')
        return
      }

      setPost(data)
      setContent(data.content || '')
      setHashtags(data.hashtags || [])
      setIsPublic(data.isPublic ?? true)
      setImagePreview(data.imageUrl || null)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

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

      // 既存のプレビューURLがあればクリーンアップ
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }

      setImagePreview(previewUrl)
      setError(null)
    } catch (err) {
      console.error('Image processing error:', err)
      setError('画像の処理に失敗しました')
    }
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
  }

  const addHashtag = () => {
    const trimmedTag = newHashtag.trim()
    if (trimmedTag && !hashtags.includes(trimmedTag)) {
      setHashtags(prev => [...prev, trimmedTag])
      setNewHashtag('')
    }
  }

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !postId) return

    setIsSubmitting(true)
    setError(null)

    try {
      let imageUrl = imagePreview

      // 新しい画像がアップロードされた場合（実際のプロジェクトでは画像アップロード処理）
      if (imageFile) {
        imageUrl = 'https://via.placeholder.com/400x300'
      }

      const extractedHashtags = content.match(/#[^\s#]+/g)?.map(tag => tag.slice(1)) || []
      const allHashtags = [...new Set([...extractedHashtags, ...hashtags])]

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageUrl: imageUrl || undefined,
          hashtags: allHashtags,
          isPublic,
        }),
      })

      if (response.ok) {
        router.push(`/post-detail/${postId}`)
      } else {
        const data = await response.json()
        setError(data.error || '投稿の更新に失敗しました')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [])

  // ローディング状態
  if (isAuthLoading || isLoading) {
    return <LoadingSpinner size='lg' message='読み込み中...' />
  }

  // 認証されていない場合
  if (!user) {
    return <LoadingSpinner size='lg' message='認証中...' />
  }

  // エラーまたは投稿が見つからない場合
  if (error || !post) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Coffee className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-600 mb-2'>
            {error || '投稿が見つかりません'}
          </h2>
          <div className='space-x-4'>
            <Link href='/feed' className='text-blue-600 hover:text-blue-800 underline'>
              フィードに戻る
            </Link>
            {postId && (
              <Link
                href={`/post-detail/${postId}`}
                className='text-blue-600 hover:text-blue-800 underline'
              >
                投稿詳細に戻る
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-2xl'>
        <header className='flex items-center justify-between mb-6'>
          <Link
            href={`/post-detail/${postId}`}
            className='flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
            投稿詳細に戻る
          </Link>
          <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
            <Coffee className='w-6 h-6 text-brown-600' />
            投稿を編集
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
                placeholder='投稿内容を編集...'
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

            <div className='flex gap-3'>
              <Link
                href={`/post-detail/${postId}`}
                className='flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors'
              >
                キャンセル
              </Link>
              <button
                type='submit'
                disabled={!content.trim() || isSubmitting}
                className='flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? (
                  <>
                    <Coffee className='w-5 h-5 animate-pulse' />
                    更新中...
                  </>
                ) : (
                  <>
                    <Save className='w-5 h-5' />
                    更新する
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
