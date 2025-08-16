import { NextRequest } from 'next/server'
import { POST } from '../[id]/like/route'
import { SNSService } from '@/lib/sns-service'
import { headers } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/sns-service')
jest.mock('next/headers')

const mockSNSService = SNSService as jest.Mocked<typeof SNSService>
const mockHeaders = headers as jest.MockedFunction<typeof headers>

const mockUserId = 'test-user-id'

describe('/api/posts/[id]/like', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeaders.mockReturnValue({
      get: (header: string) => {
        if (header === 'x-user-id') return mockUserId
        return null
      },
    } as any)
  })

  describe('POST', () => {
    it('should toggle like on a post', async () => {
      const likeResult = { liked: true }
      mockSNSService.toggleLike.mockResolvedValue(likeResult as any)

      const request = new NextRequest('http://localhost/api/posts/1/like', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(true)
      expect(mockSNSService.toggleLike).toHaveBeenCalledWith(1, mockUserId)
    })

    it('should toggle unlike on a post', async () => {
      const likeResult = { liked: false }
      mockSNSService.toggleLike.mockResolvedValue(likeResult as any)

      const request = new NextRequest('http://localhost/api/posts/1/like', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(false)
      expect(mockSNSService.toggleLike).toHaveBeenCalledWith(1, mockUserId)
    })

    it('should return 400 for invalid post ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/invalid/like', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: 'invalid' })

      const response = await POST(request, { params })

      expect(response.status).toBe(400)
      expect(mockSNSService.toggleLike).not.toHaveBeenCalled()
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/posts/1/like', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await POST(request, { params })

      expect(response.status).toBe(401)
      expect(mockSNSService.toggleLike).not.toHaveBeenCalled()
    })

    it('should handle service errors', async () => {
      mockSNSService.toggleLike.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/posts/1/like', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await POST(request, { params })

      expect(response.status).toBe(500)
    })

    it('should handle non-existent post', async () => {
      mockSNSService.toggleLike.mockRejectedValue(new Error('Post not found'))

      const request = new NextRequest('http://localhost/api/posts/999/like', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: '999' })

      const response = await POST(request, { params })

      expect(response.status).toBe(500)
    })
  })
})
