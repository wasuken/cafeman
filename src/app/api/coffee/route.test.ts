import { POST, GET } from './route'
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

describe('/api/coffee', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    headersMock.mockReturnValue({
      get: (header: string) => {
        if (header === 'x-user-id') return mockUserId
        return null
      },
    })
  })

  describe('POST', () => {
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
        userId: mockUserId,
        date: new Date(requestBody.date),
        cups: requestBody.cups,
        timestamp: new Date(requestBody.time),
      }
      prismaMock.coffeeRecord.create.mockResolvedValue(expectedRecord as any)

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual(JSON.parse(JSON.stringify(expectedRecord)))
      expect(prismaMock.coffeeRecord.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          date: new Date(requestBody.date),
          cups: requestBody.cups,
          timestamp: new Date(requestBody.time),
        },
      })
    })

    it('should return 401 if user is not authenticated', async () => {
      headersMock.mockReturnValue({ get: () => null }) // No user id
      const req = { json: jest.fn() } as unknown as NextRequest
      const response = await POST(req)
      expect(response.status).toBe(401)
    })
  })

  describe('GET', () => {
    it('should fetch monthly records for the authenticated user', async () => {
      const req = {
        nextUrl: new URL('http://localhost/api/coffee?month=2025-08'),
      } as NextRequest
      prismaMock.coffeeRecord.findMany.mockResolvedValue([])

      await GET(req)

      expect(prismaMock.coffeeRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
          }),
        })
      )
    })

    it('should fetch recent records if no month is specified', async () => {
        const req = {
            nextUrl: new URL('http://localhost/api/coffee'),
          } as NextRequest
        prismaMock.coffeeRecord.findMany.mockResolvedValue([])

        await GET(req)

        expect(prismaMock.coffeeRecord.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId: mockUserId },
          })
        )
    })

    it('should return 401 if user is not authenticated', async () => {
        headersMock.mockReturnValue({ get: () => null }) // No user id
        const req = { nextUrl: new URL('http://localhost/api/coffee') } as NextRequest
        const response = await GET(req)
        expect(response.status).toBe(401)
    })
  })
})
