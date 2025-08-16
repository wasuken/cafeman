import { NextRequest } from 'next/server'
import { GET, POST } from '../[id]/comments/route'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/prisma')
jest.mock('next/headers')

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockHeaders = headers as jest.MockedFunction<typeof headers>

const mockUserId = 'test-user-id'

const mockComments = [
  {
    id: 1,
    postId: 1,
    userId: 'user-1',
    content: 'テストコメント1',
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z'),
    user: {
      id: 'user-1',
      name: 'User 1',
      profile: {
        avatarUrl: 'https://example.com/avatar1.jpg',
      },
    },
  },
  {
    id: 2,
    postId: 1,
    userId: 'user-2',
    content: 'テストコメント2',
    createdAt: new Date('2023-01-01T11:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z'),
    user: {
      id: 'user-2',
      name: 'User 2',
      profile: {
        avatarUrl: null,
      },
    },
  },
]

describe('/api/posts/[id]/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeaders.mockReturnValue({
      get: (header: string) => {
        if (header === 'x-user-id') return mockUserId
        return null
      },
    } as any)
  })

  describe('GET', () => {
    it('should return comments for a post', async () => {
      mockPrisma.comment.findMany.mockResolvedValue(mockComments as any)

      const request = new NextRequest('http://localhost/api/posts/1/comments')
      const params = Promise.resolve({ id: '1' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.comments).toHaveLength(2)
      expect(data.comments[0].content).toBe('テストコメント1')
      expect(data.hasMore).toBe(false)
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { postId: 1 },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 21,
      })
    })

    it('should handle pagination with cursor', async () => {
      mockPrisma.comment.findMany.mockResolvedValue(mockComments as any)

      const request = new NextRequest('http://localhost/api/posts/1/comments?cursor=5&limit=10')
      const params = Promise.resolve({ id: '1' })

      const response = await GET(request, { params })

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { postId: 1 },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 11,
        cursor: { id: 5 },
        skip: 1,
      })
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/posts/1/comments')
      const params = Promise.resolve({ id: '1' })

      const response = await GET(request, { params })

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid post ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/invalid/comments')
      const params = Promise.resolve({ id: 'invalid' })

      const response = await GET(request, { params })

      expect(response.status).toBe(400)
    })
  })

  describe('POST', () => {
    it('should create a new comment', async () => {
      const newComment = {
        id: 3,
        postId: 1,
        userId: mockUserId,
        content: '新しいコメント',
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

      mockPrisma.post.findUnique.mockResolvedValue({
        userId: 'post-owner-id',
      } as any)

      mockPrisma.comment.create.mockResolvedValue(newComment as any)
      mockPrisma.notification.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/posts/1/comments', {
        method: 'POST',
        body: JSON.stringify({ content: '新しいコメント' }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.content).toBe('新しいコメント')
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          postId: 1,
          userId: mockUserId,
          content: '新しいコメント',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
        },
      })

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'post-owner-id',
          type: 'comment',
          title: 'コメント',
          message: 'あなたの投稿にコメントがつきました',
          relatedId: 1,
        },
      })
    })

    it('should not create notification for own comment', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        userId: mockUserId,
      } as any)

      mockPrisma.comment.create.mockResolvedValue({
        id: 3,
        content: '自分のコメント',
      } as any)

      const request = new NextRequest('http://localhost/api/posts/1/comments', {
        method: 'POST',
        body: JSON.stringify({ content: '自分のコメント' }),
      })
      const params = Promise.resolve({ id: '1' })

      await POST(request, { params })

      expect(mockPrisma.notification.create).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid content', async () => {
      const request = new NextRequest('http://localhost/api/posts/1/comments', {
        method: 'POST',
        body: JSON.stringify({ content: '' }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await POST(request, { params })

      expect(response.status).toBe(400)
    })

    it('should return 404 if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/posts/1/comments', {
        method: 'POST',
        body: JSON.stringify({ content: 'テストコメント' }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await POST(request, { params })

      expect(response.status).toBe(404)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/posts/1/comments', {
        method: 'POST',
        body: JSON.stringify({ content: 'テストコメント' }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await POST(request, { params })

      expect(response.status).toBe(401)
    })
  })
})
