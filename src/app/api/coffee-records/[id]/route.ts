import { NextRequest, NextResponse } from 'next/server'
import { CoffeeService } from '@/lib/coffee-service'
import { headers } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await headers()).get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    await CoffeeService.deleteCoffeeRecord(id, userId)

    return NextResponse.json({ message: 'Record deleted successfully' }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('Failed to delete coffee record:', error)
    return NextResponse.json({ error: 'Failed to delete coffee record' }, { status: 500 })
  }
}
