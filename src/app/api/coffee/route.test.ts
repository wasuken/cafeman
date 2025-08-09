import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { DeepMockProxy } from 'jest-mock-extended'

// Mock the prisma client
jest.mock('@/lib/prisma')

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>

describe('POST /api/coffee', () => {
  it('should create a new coffee record', async () => {
    const requestBody = {
      date: '2025-08-08',
      cups: 2,
      time: '2025-08-08T10:00:00.000Z',
    }

    const req = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest

    const expectedRecord = {
      id: 1,
      userId: 'default-user',
      date: new Date(requestBody.date),
      cups: requestBody.cups,
      timestamp: new Date(requestBody.time),
      createdAt: new Date(),
      updatedAt: new Date(),
      coffeeType: null,
      size: null,
      location: null,
      notes: null,
    }

    prismaMock.coffeeRecord.create.mockResolvedValue(expectedRecord)

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    // Compare after serializing and deserializing the expected record to match the format from the API
    expect(body).toEqual(JSON.parse(JSON.stringify(expectedRecord)))
    expect(prismaMock.coffeeRecord.create).toHaveBeenCalledWith({
      data: {
        userId: 'default-user',
        date: new Date(requestBody.date),
        cups: requestBody.cups,
        timestamp: new Date(requestBody.time),
      },
    })
    expect(prismaMock.coffeeRecord.create).toHaveBeenCalledTimes(1)
  })

  it('should return 500 on error', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest

    prismaMock.coffeeRecord.create.mockRejectedValue(new Error('Test error'))

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to save coffee record' })
  })
})
