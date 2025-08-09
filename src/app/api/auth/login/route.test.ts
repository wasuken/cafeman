import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

// Mock jose
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockReturnThis(),
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuedAt: jest.fn().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
  sign: jest.fn(),
}))

const mockPrismaUser = prisma.user.findUnique as jest.Mock
const mockCompare = compare as jest.Mock
const mockSignJWT = {
  sign: jest.fn(),
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuedAt: jest.fn().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
}
;(SignJWT as jest.Mock).mockImplementation(() => mockSignJWT)

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }), // Missing password, invalid email
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('無効なリクエストです。')
  })

  it('should return 401 for non-existent user', async () => {
    mockPrismaUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('メールアドレスまたはパスワードが正しくありません。')
  })

  it('should return 401 for incorrect password', async () => {
    const mockUser = { id: '1', email: 'test@example.com', password: 'hashedpassword' }
    mockPrismaUser.mockResolvedValue(mockUser)
    mockCompare.mockResolvedValue(false) // Password does not match

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('メールアドレスまたはパスワードが正しくありません。')
  })

  it('should return 200 and set a cookie on successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', password: 'hashedpassword' }
    mockPrismaUser.mockResolvedValue(mockUser)
    mockCompare.mockResolvedValue(true) // Password matches
    mockSignJWT.sign.mockResolvedValue('fake-jwt-token')

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(response.cookies.get('session')?.value).toBe('fake-jwt-token')
    expect(response.cookies.get('session')?.httpOnly).toBe(true)
  })

  it('should return 500 on unexpected errors', async () => {
    mockPrismaUser.mockRejectedValue(new Error('Database exploded'))

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('ログイン中にエラーが発生しました。')
  })
})
