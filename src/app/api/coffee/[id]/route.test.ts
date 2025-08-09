import { DELETE } from './route'
import { CoffeeService } from '@/lib/coffee-service'
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'

// Mock the service
jest.mock('@/lib/coffee-service', () => ({
  CoffeeService: {
    deleteCoffeeRecord: jest.fn(),
  },
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}))

const mockDeleteCoffeeRecord = CoffeeService.deleteCoffeeRecord as jest.Mock
const mockHeaders = headers as jest.Mock

describe('DELETE /api/coffee/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 200 on successful deletion', async () => {
    mockHeaders.mockReturnValue(new Map([['x-user-id', 'user-123']]))
    mockDeleteCoffeeRecord.mockResolvedValue({}) // Simulate successful deletion

    const request = new NextRequest('http://localhost')
    const response = await DELETE(request, { params: { id: '1' } })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.message).toBe('Record deleted successfully')
    expect(mockDeleteCoffeeRecord).toHaveBeenCalledWith(1, 'user-123')
  })

  it('should return 401 if x-user-id header is missing', async () => {
    mockHeaders.mockReturnValue(new Map()) // No user id

    const request = new NextRequest('http://localhost')
    const response = await DELETE(request, { params: { id: '1' } })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
    expect(mockDeleteCoffeeRecord).not.toHaveBeenCalled()
  })

  it('should return 400 for an invalid ID', async () => {
    mockHeaders.mockReturnValue(new Map([['x-user-id', 'user-123']]))

    const request = new NextRequest('http://localhost')
    const response = await DELETE(request, { params: { id: 'invalid-id' } })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Invalid ID')
    expect(mockDeleteCoffeeRecord).not.toHaveBeenCalled()
  })

  it('should return 404 if the record is not found', async () => {
    mockHeaders.mockReturnValue(new Map([['x-user-id', 'user-123']]))
    mockDeleteCoffeeRecord.mockRejectedValue(new Error('Record not found or user not authorized'))

    const request = new NextRequest('http://localhost')
    const response = await DELETE(request, { params: { id: '999' } })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe('Record not found or user not authorized')
    expect(mockDeleteCoffeeRecord).toHaveBeenCalledWith(999, 'user-123')
  })

  it('should return 500 for other unexpected errors', async () => {
    mockHeaders.mockReturnValue(new Map([['x-user-id', 'user-123']]))
    mockDeleteCoffeeRecord.mockRejectedValue(new Error('Database connection lost'))

    const request = new NextRequest('http://localhost')
    const response = await DELETE(request, { params: { id: '1' } })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('Failed to delete coffee record')
    expect(mockDeleteCoffeeRecord).toHaveBeenCalledWith(1, 'user-123')
  })
})
