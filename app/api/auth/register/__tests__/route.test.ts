import { createMocks } from 'node-mocks-http'
import { POST } from '../route'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

jest.mock('@/lib/prisma')
jest.mock('bcryptjs')

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a new user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }
    })

    ;(hash as jest.Mock).mockResolvedValue('hashedPassword123')
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date()
    })

    await POST(req, res)

    expect(res._getStatusCode()).toBe(201)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com'
        })
      })
    )
  })

  it('handles duplicate email', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      }
    })

    ;(prisma.user.create as jest.Mock).mockRejectedValue(new Error('Unique constraint failed on the fields: (`email`)'))

    await POST(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('email already exists')
      })
    )
  })

  it('validates required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: '',
        email: 'invalid-email',
        password: 'short'
      }
    })

    await POST(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('validation failed')
      })
    )
  })

  it('handles server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }
    })

    ;(prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    await POST(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('failed to create user')
      })
    )
  })
})
