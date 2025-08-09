import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseISO } from 'date-fns'

import { headers } from 'next/headers'

// 特定の日の記録削除
export async function DELETE(request: NextRequest, { params }: { params: { data: string } }) {
  try {
    const userId = headers().get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.coffeeRecord.deleteMany({
      where: {
        userId,
        date: parseISO(params.data),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coffee record' }, { status: 500 })
  }
}
