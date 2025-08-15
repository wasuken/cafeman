import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'コメント内容を入力してください')
    .max(500, '500文字以内で入力してください'),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = (await headers()).get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolvedParams = await params
    const commentId = parseInt(resolvedParams.id, 10)
    if (isNaN(commentId)) return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 })

    const body = await request.json()
    const validation = updateCommentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validation.error.format() },
        { status: 400 }
      )
    }

    // コメントの所有者確認
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (existingComment.userId !== userId) {
      return NextResponse.json({ error: '編集権限がありません' }, { status: 403 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: validation.data.content },
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

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Failed to update comment:', error)
    return NextResponse.json({ error: 'コメントの更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await headers()).get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolvedParams = await params
    const commentId = parseInt(resolvedParams.id, 10)
    if (isNaN(commentId)) return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 })

    // コメントの所有者確認
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (existingComment.userId !== userId) {
      return NextResponse.json({ error: '削除権限がありません' }, { status: 403 })
    }

    await prisma.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ message: 'コメントを削除しました' })
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return NextResponse.json({ error: 'コメントの削除に失敗しました' }, { status: 500 })
  }
}
