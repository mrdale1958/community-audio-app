import { createMocks } from 'node-mocks-http'
import { POST } from '../app/api/recordings/upload/route'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

jest.mock('next-auth/react')
jest.mock('@/lib/prisma')

describe('/api/recordings/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    })

    ;(getSession as jest.Mock).mockResolvedValueOnce(null)

    await POST(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: 'Unauthorized'
      })
    )
  })

  it('creates recording when authenticated', async () => {
    const mockSession = {
      user: { id: 'user123', email: 'test@example.com' }
    }
    
    const mockFormData = new FormData()
    mockFormData.append('audio', new Blob(['test audio'], { type: 'audio/webm' }), 'test.webm')
    mockFormData.append('duration', '120')
    mockFormData.append('title', 'Test Recording')
    mockFormData.append('nameListId', 'list123')

    const { req, res } = createMocks({
      method: 'POST',
      body: mockFormData
    })

    ;(getSession as jest.Mock).mockResolvedValueOnce(mockSession)
    ;(prisma.recording.create as jest.Mock).mockResolvedValueOnce({
      id: 'rec123',
      userId: 'user123',
      duration: 120,
      title: 'Test Recording',
      nameListId: 'list123',
      url: 'test-url'
    })

    await POST(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        recordingId: 'rec123'
      })
    )
  })

  it('handles file upload errors', async () => {
    const mockSession = {
      user: { id: 'user123', email: 'test@example.com' }
    }

    const { req, res } = createMocks({
      method: 'POST',
      // Invalid form data to trigger error
      body: {}
    })

    ;(getSession as jest.Mock).mockResolvedValueOnce(mockSession)

    await POST(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: expect.any(String)
      })
    )
  })
})
