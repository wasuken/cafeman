import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { SNSService } from '@/lib/sns-service'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = (await headers()).get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolvedParams = await params
    const postId = parseInt(resolvedParams.id, 10)
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    const result = await SNSService.toggleLike(postId, userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to toggle like:', error)
    return NextResponse.json({ error: 'いいねの処理に失敗しました' }, { status: 500 })
  }
}
