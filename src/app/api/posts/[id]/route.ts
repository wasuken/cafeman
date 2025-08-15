import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { SNSService } from '@/lib/sns-service'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = headers().get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const postId = parseInt(params.id, 10)
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    const post = await SNSService.getPost(postId, userId)
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const postWithStats = { ...post, isLiked: post.likes.length > 0, likes: undefined }
    return NextResponse.json(postWithStats)
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = headers().get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const postId = parseInt(params.id, 10)
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    const body = await request.json()
    const updatedPost = await SNSService.updatePost(postId, userId, body)
    return NextResponse.json(updatedPost)
  } catch (error) {
    if (error instanceof Error && error.message.includes('権限がありません'))
      return NextResponse.json({ error: error.message }, { status: 403 })
    console.error('Failed to update post:', error)
    return NextResponse.json({ error: '投稿の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = headers().get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const postId = parseInt(params.id, 10)
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    await SNSService.deletePost(postId, userId)
    return NextResponse.json({ message: '投稿を削除しました' })
  } catch (error) {
    if (error instanceof Error && error.message.includes('権限がありません'))
      return NextResponse.json({ error: error.message }, { status: 403 })
    console.error('Failed to delete post:', error)
    return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 })
  }
}
