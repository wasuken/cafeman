import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseISO } from 'date-fns'

// 特定の日の記録削除
export async function DELETE(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    await prisma.coffeeRecord.delete({
      where: { date: parseISO(params.date) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coffee record' }, { status: 500 })
  }
}
