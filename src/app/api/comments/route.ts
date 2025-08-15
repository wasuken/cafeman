import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'コメント内容を入力してください')
    .max(500, '500文字以内で入力してください'),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = (await headers()).get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolvedParams = await params
    const postId = parseInt(resolvedParams.id, 10)
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: parseInt(cursor) },
        skip: 1,
      }),
    })

    const hasMore = comments.length > limit
    if (hasMore) comments.pop()

    return NextResponse.json({
      comments,
      hasMore,
      nextCursor: hasMore ? comments[comments.length - 1]?.id.toString() : undefined,
    })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json({ error: 'コメントの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = (await headers()).get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolvedParams = await params
    const postId = parseInt(resolvedParams.id, 10)
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    const body = await request.json()
    const validation = createCommentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validation.error.format() },
        { status: 400 }
      )
    }

    // 投稿が存在するかチェック
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content: validation.data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
      },
    })

    // 投稿者に通知を送信（自分のコメントでない場合）
    if (post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'comment',
          title: 'コメント',
          message: `あなたの投稿にコメントがつきました`,
          relatedId: postId,
        },
      })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json({ error: 'コメントの作成に失敗しました' }, { status: 500 })
  }
}
