import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { SNSService } from '@/lib/sns-service'

export async function GET(request: NextRequest) {
  try {
    const userId = headers().get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor') || undefined

    const feedData = await SNSService.getFeedPosts(userId, limit, cursor)
    return NextResponse.json(feedData)
  } catch (error) {
    console.error('Failed to fetch feed:', error)
    return NextResponse.json({ error: 'フィードの取得に失敗しました' }, { status: 500 })
  }
}
