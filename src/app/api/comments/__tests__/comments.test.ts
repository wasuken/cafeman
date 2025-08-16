import { NextRequest } from 'next/server'
import { PUT, DELETE } from '../[id]/route'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/prisma')
jest.mock('next/headers')

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockHeaders = headers as jest.MockedFunction<typeof headers>

const mockUserId = 'test-user-id'

describe('/api/comments/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeaders.mockReturnValue({
      get: (header: string) => {
        if (header === 'x-user-id') return mockUserId
        return null
      },
    } as any)
  })

  describe('PUT', () => {
    it('should update comment successfully', async () => {
      const existingComment = {
        id: 1,
        userId: mockUserId,
      }

      const updatedComment = {
        id: 1,
        userId: mockUserId,
        content: '更新されたコメント',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: mockUserId,
          name: 'Test User',
          profile: {
            avatarUrl: null,
          },
        },
      }

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment as any)
      mockPrisma.comment.update.mockResolvedValue(updatedComment as any)

      const request = new NextRequest('http://localhost/api/comments/1', {
        method: 'PUT',
        body: JSON.stringify({ content: '更新されたコメント' }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.content).toBe('更新されたコメント')
      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { content: '更新されたコメント' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: true,
            },
          },
        },
      })
    })

    it('should return 403 for unauthorized user', async () => {
      const existingComment = {
        id: 1,
        userId: 'other-user-id',
      }

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment as any)

      const request = new NextRequest('http://localhost/api/comments/1', {
        method: 'PUT',
        body: JSON.stringify({ content: '更新されたコメント' }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-existent comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/comments/1', {
        method: 'PUT',
        body: JSON.stringify({ content: '更新されたコメント' }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid content', async () => {
      const request = new NextRequest('http://localhost/api/comments/1', {
        method: 'PUT',
        body: JSON.stringify({ content: '' }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid comment ID', async () => {
      const request = new NextRequest('http://localhost/api/comments/invalid', {
        method: 'PUT',
        body: JSON.stringify({ content: '更新されたコメント' }),
      })
      const params = Promise.resolve({ id: 'invalid' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE', () => {
    it('should delete comment successfully', async () => {
      const existingComment = {
        id: 1,
        userId: mockUserId,
      }

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment as any)
      mockPrisma.comment.delete.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/comments/1', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('コメントを削除しました')
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should return 403 for unauthorized user', async () => {
      const existingComment = {
        id: 1,
        userId: 'other-user-id',
      }

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment as any)

      const request = new NextRequest('http://localhost/api/comments/1', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-existent comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/comments/1', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(404)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/comments/1', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(401)
    })
  })
})
