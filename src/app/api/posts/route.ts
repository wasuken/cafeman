import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { SNSService } from '@/lib/sns-service'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z
    .string()
    .min(1, '投稿内容を入力してください')
    .max(280, '280文字以内で入力してください'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  hashtags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const userId = headers().get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validation = createPostSchema.safeParse(body)
    if (!validation.success)
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validation.error.format() },
        { status: 400 }
      )

    const { content, imageUrl, hashtags, isPublic } = validation.data
    const extractedHashtags = content.match(/#[^\s#]+/g)?.map(tag => tag.slice(1)) || []
    const allHashtags = [...new Set([...extractedHashtags, ...(hashtags || [])])]

    const post = await SNSService.createPost(userId, {
      content,
      imageUrl: imageUrl || undefined,
      hashtags: allHashtags,
      isPublic,
    })
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json({ error: '投稿の作成に失敗しました' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = headers().get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor') || undefined
    const userIdFilter = searchParams.get('userId') || undefined

    if (userIdFilter) {
      const posts = await SNSService.getUserPosts(userIdFilter, limit, cursor)
      return NextResponse.json(posts)
    }

    const feedData = await SNSService.getFeedPosts(userId, limit, cursor)
    return NextResponse.json(feedData)
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
  }
}
