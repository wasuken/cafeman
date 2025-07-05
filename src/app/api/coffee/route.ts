import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, parseISO } from 'date-fns'

// コーヒー記録追加
export async function POST(request: NextRequest) {
  try {
    const { date, cups, time } = await request.json()

    const record = await prisma.coffeeRecord.upsert({
      where: { date: parseISO(date) },
      update: {
        cups: { increment: cups },
        time: parseISO(time),
      },
      create: {
        date: parseISO(date),
        cups,
        time: parseISO(time),
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save coffee record' }, { status: 500 })
  }
}

// コーヒー記録取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') // YYYY-MM format

    let records
    if (month) {
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

      records = await prisma.coffeeRecord.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'desc' },
      })
    } else {
      records = await prisma.coffeeRecord.findMany({
        orderBy: { date: 'desc' },
        take: 30,
      })
    }

    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coffee records' }, { status: 500 })
  }
}
