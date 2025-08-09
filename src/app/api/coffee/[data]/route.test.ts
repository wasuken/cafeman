import { DELETE } from './route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { DeepMockProxy } from 'jest-mock-extended'

// Mock the prisma client
jest.mock('@/lib/prisma')

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>

describe('DELETE /api/coffee/[data]', () => {
  it('should delete coffee records for a specific date', async () => {
    const dateStr = '2025-08-08'
    const req = {} as NextRequest
    const context = { params: { data: dateStr } }

    prismaMock.coffeeRecord.deleteMany.mockResolvedValue({ count: 2 })

    const response = await DELETE(req, context)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(prismaMock.coffeeRecord.deleteMany).toHaveBeenCalledWith({
      where: {
        date: new Date(dateStr),
      },
    })
    expect(prismaMock.coffeeRecord.deleteMany).toHaveBeenCalledTimes(1)
  })

  it('should return 500 on error', async () => {
    const dateStr = '2025-08-08'
    const req = {} as NextRequest
    const context = { params: { data: dateStr } }

    prismaMock.coffeeRecord.deleteMany.mockRejectedValue(new Error('Test error'))

    const response = await DELETE(req, context)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to delete coffee record' })
  })
})
