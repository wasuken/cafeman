import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../[id]/route'
import { SNSService } from '@/lib/sns-service'
import { headers } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/sns-service')
jest.mock('next/headers')

const mockSNSService = SNSService as jest.Mocked<typeof SNSService>
const mockHeaders = headers as jest.MockedFunction<typeof headers>

const mockUserId = 'test-user-id'

describe('/api/posts/[id]', () => {
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
    it('should return a specific post', async () => {
      const mockPost = {
        id: 1,
        userId: 'user-1',
        content: 'テスト投稿',
        isLiked: false,
        likes: [],
        _count: { likes: 5, comments: 3 },
      }

      mockSNSService.getPost.mockResolvedValue(mockPost as any)

      const request = new NextRequest('http://localhost/api/posts/1')
      const params = Promise.resolve({ id: '1' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(1)
      expect(data.isLiked).toBe(false)
      expect(data.likes).toBeUndefined()
      expect(mockSNSService.getPost).toHaveBeenCalledWith(1, mockUserId)
    })

    it('should return 404 if post not found', async () => {
      mockSNSService.getPost.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/posts/999')
      const params = Promise.resolve({ id: '999' })

      const response = await GET(request, { params })

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid post ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/invalid')
      const params = Promise.resolve({ id: 'invalid' })

      const response = await GET(request, { params })

      expect(response.status).toBe(400)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/posts/1')
      const params = Promise.resolve({ id: '1' })

      const response = await GET(request, { params })

      expect(response.status).toBe(401)
    })

    it('should handle service errors gracefully', async () => {
      mockSNSService.getPost.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/posts/1')
      const params = Promise.resolve({ id: '1' })

      const response = await GET(request, { params })

      expect(response.status).toBe(500)
    })
  })

  describe('PUT', () => {
    it('should update a post', async () => {
      const updatedPost = {
        id: 1,
        userId: mockUserId,
        content: '更新された投稿',
        hashtags: ['updated'],
      }

      mockSNSService.updatePost.mockResolvedValue(updatedPost as any)

      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'PUT',
        body: JSON.stringify({
          content: '更新された投稿',
          hashtags: ['updated'],
        }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.content).toBe('更新された投稿')
      expect(mockSNSService.updatePost).toHaveBeenCalledWith(1, mockUserId, {
        content: '更新された投稿',
        hashtags: ['updated'],
      })
    })

    it('should update post with partial data', async () => {
      const updatedPost = {
        id: 1,
        userId: mockUserId,
        content: '部分更新された投稿',
      }

      mockSNSService.updatePost.mockResolvedValue(updatedPost as any)

      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'PUT',
        body: JSON.stringify({
          content: '部分更新された投稿',
        }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.content).toBe('部分更新された投稿')
      expect(mockSNSService.updatePost).toHaveBeenCalledWith(1, mockUserId, {
        content: '部分更新された投稿',
      })
    })

    it('should return 403 for unauthorized update', async () => {
      mockSNSService.updatePost.mockRejectedValue(new Error('編集権限がありません'))

      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'PUT',
        body: JSON.stringify({
          content: '更新された投稿',
        }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid post ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/invalid', {
        method: 'PUT',
        body: JSON.stringify({
          content: '更新された投稿',
        }),
      })
      const params = Promise.resolve({ id: 'invalid' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'PUT',
        body: JSON.stringify({
          content: '更新された投稿',
        }),
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(401)
    })

    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'PUT',
        body: 'invalid json',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('should delete a post', async () => {
      mockSNSService.deletePost.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('投稿を削除しました')
      expect(mockSNSService.deletePost).toHaveBeenCalledWith(1, mockUserId)
    })

    it('should return 403 for unauthorized delete', async () => {
      mockSNSService.deletePost.mockRejectedValue(new Error('削除権限がありません'))

      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-existent post', async () => {
      mockSNSService.deletePost.mockRejectedValue(new Error('投稿が見つかりません'))

      const request = new NextRequest('http://localhost/api/posts/999', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '999' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(403) // SNSService throws error with message, caught as 403
    })

    it('should return 400 for invalid post ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/invalid', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: 'invalid' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(400)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockHeaders.mockReturnValue({
        get: () => null,
      } as any)

      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(401)
    })

    it('should handle service errors gracefully', async () => {
      mockSNSService.deletePost.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/posts/1', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(500)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/0')
      const params = Promise.resolve({ id: '0' })

      const response = await GET(request, { params })

      expect(mockSNSService.getPost).toHaveBeenCalledWith(0, mockUserId)
    })

    it('should handle negative ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/-1')
      const params = Promise.resolve({ id: '-1' })

      const response = await GET(request, { params })

      expect(mockSNSService.getPost).toHaveBeenCalledWith(-1, mockUserId)
    })

    it('should handle very large ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/999999999')
      const params = Promise.resolve({ id: '999999999' })

      const response = await GET(request, { params })

      expect(mockSNSService.getPost).toHaveBeenCalledWith(999999999, mockUserId)
    })

    it('should handle malformed ID with letters', async () => {
      const request = new NextRequest('http://localhost/api/posts/abc123')
      const params = Promise.resolve({ id: 'abc123' })

      const response = await GET(request, { params })

      expect(response.status).toBe(400)
      expect(mockSNSService.getPost).not.toHaveBeenCalled()
    })

    it('should handle empty string ID', async () => {
      const request = new NextRequest('http://localhost/api/posts/')
      const params = Promise.resolve({ id: '' })

      const response = await GET(request, { params })

      expect(response.status).toBe(400)
      expect(mockSNSService.getPost).not.toHaveBeenCalled()
    })
  })
})
