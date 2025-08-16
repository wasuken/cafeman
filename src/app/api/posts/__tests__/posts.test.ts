import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { SNSService } from '@/lib/sns-service'
import { headers } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/sns-service')
jest.mock('next/headers')

const mockSNSService = SNSService as jest.Mocked<typeof SNSService>
const mockHeaders = headers as jest.MockedFunction<typeof headers>

const mockUserId = 'test-user-id'

describe('/api/posts', () => {
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
    it('should return feed posts', async () => {
      const mockFeedData = {
        posts: [
          {
            id: 1,
            userId: 'user-1',
            content: 'テスト投稿1',
            isLiked: false,
            _count: { likes: 5, comments: 3 },
          },
        ],
        hasMore: false,
        nextCursor: undefined,
      }

      mockSNSService.getFeedPosts.mockResolvedValue(mockFeedData as any)

      const request = new NextRequest('http://localhost/api/posts')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(mockSNSService.getFeedPosts).toHaveBeenCalledWith(mockUserId, 20, undefined)
    })

    it('should return user posts when userId filter is provided', async () => {
      const mockUserPosts = {
        posts: [
          {
            id: 1,
            userId: 'specific-user',
            content: 'ユーザー投稿',
          },
        ],
        hasMore: false,
        nextCursor: undefined,
      }

      mockSNSService.getUserPosts.mockResolvedValue(mockUserPosts as any)

      const request = new NextRequest('http://localhost/api/posts?userId=specific-user&limit=10')

      const response = await GET(request)

      expect(mockSNSService.getUserPosts).toHaveBeenCalledWith('specific-user', 10, undefined)
    })

    it('should handle pagination parameters', async () => {
      mockSNSService.getFeedPosts.mockResolvedValue({
        posts: [],
        hasMore: false,
        nextCursor: undefined,
      } as any)

      const request = new NextRequest('http://localhost/api/posts?limit=5&cursor=10')

      await GET(request)

      expect(mockSNSService.getFeedPosts).toHaveBeenCalledWith(mockUserId, 5, '10')
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/posts')

      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('should create a new post', async () => {
      const newPost = {
        id: 1,
        userId: mockUserId,
        content: '新しい投稿 #test',
        hashtags: ['test'],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSNSService.createPost.mockResolvedValue(newPost as any)

      const request = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: '新しい投稿 #test',
          hashtags: ['coffee'],
          isPublic: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.content).toBe('新しい投稿 #test')
      expect(mockSNSService.createPost).toHaveBeenCalledWith(mockUserId, {
        content: '新しい投稿 #test',
        imageUrl: undefined,
        hashtags: ['test', 'coffee'],
        isPublic: true,
      })
    })

    it('should extract hashtags from content', async () => {
      mockSNSService.createPost.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: 'コーヒーが美味しい #coffee #morning #goodday',
        }),
      })

      await POST(request)

      expect(mockSNSService.createPost).toHaveBeenCalledWith(mockUserId, {
        content: 'コーヒーが美味しい #coffee #morning #goodday',
        imageUrl: undefined,
        hashtags: ['coffee', 'morning', 'goodday'],
        isPublic: true,
      })
    })

    it('should return 400 for invalid content', async () => {
      const request = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: '',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for content exceeding 280 characters', async () => {
      const request = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: 'a'.repeat(281),
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: 'テスト投稿',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should handle empty hashtags array', async () => {
      mockSNSService.createPost.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: '普通の投稿',
          hashtags: [],
        }),
      })

      await POST(request)

      expect(mockSNSService.createPost).toHaveBeenCalledWith(mockUserId, {
        content: '普通の投稿',
        imageUrl: undefined,
        hashtags: [],
        isPublic: true,
      })
    })

    it('should merge content hashtags with provided hashtags', async () => {
      mockSNSService.createPost.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: 'テスト投稿 #content #hashtag',
          hashtags: ['provided', 'hashtag'], // 'hashtag'は重複
        }),
      })

      await POST(request)

      expect(mockSNSService.createPost).toHaveBeenCalledWith(mockUserId, {
        content: 'テスト投稿 #content #hashtag',
        imageUrl: undefined,
        hashtags: ['content', 'hashtag', 'provided'], // 重複を除去
        isPublic: true,
      })
    })
  })
})
