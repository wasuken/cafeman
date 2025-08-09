import { DELETE } from './route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { DeepMockProxy } from 'jest-mock-extended'
import { headers } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/prisma')
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}))

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>
const headersMock = headers as jest.Mock

const mockUserId = 'test-user-id'

describe('DELETE /api/coffee/[data]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    headersMock.mockReturnValue({
      get: (header: string) => {
        if (header === 'x-user-id') return mockUserId
        return null
      },
    })
  })

  it('should delete coffee records for a specific date for the authenticated user', async () => {
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
        userId: mockUserId,
        date: new Date(dateStr),
      },
    })
  })

  it('should return 401 if user is not authenticated', async () => {
    headersMock.mockReturnValue({ get: () => null }) // No user id
    const dateStr = '2025-08-08'
    const req = {} as NextRequest
    const context = { params: { data: dateStr } }

    const response = await DELETE(req, context)
    expect(response.status).toBe(401)
  })
})
