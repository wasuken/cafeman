import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseISO } from 'date-fns'

// 特定の日の記録削除
export async function DELETE(request: NextRequest, { params }: { params: { data: string } }) {
  try {
    await prisma.coffeeRecord.deleteMany({
      where: { date: parseISO(params.data) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coffee record' }, { status: 500 })
  }
}
