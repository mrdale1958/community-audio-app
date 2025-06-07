import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LiveRecordingPage from '../page'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

describe('LiveRecordingPage', () => {
  const mockRouter = { push: jest.fn() }
  const mockSession = {
    data: {
      user: { email: 'test@example.com', name: 'Test User' },
      expires: '2100-01-01'
    },
    status: 'authenticated'
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('redirects to signin if no session', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<LiveRecordingPage />)
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin')
  })

  it('renders the recording interface when authenticated', () => {
    render(<LiveRecordingPage />)
    
    expect(screen.getByText('Live Recording Session')).toBeInTheDocument()
    expect(screen.getByText(/Read the names below clearly/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
  })

  it('shows recording controls when recording starts', async () => {
    render(<LiveRecordingPage />)
    
    const startButton = screen.getByRole('button', { name: /start recording/i })
    await userEvent.click(startButton)

    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop & save/i })).toBeInTheDocument()
  })

  it('shows save controls after stopping recording', async () => {
    render(<LiveRecordingPage />)
    
    // Start recording
    const startButton = screen.getByRole('button', { name: /start recording/i })
    await userEvent.click(startButton)
    
    // Stop recording
    const stopButton = screen.getByRole('button', { name: /stop/i })
    await userEvent.click(stopButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save recording/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /record again/i })).toBeInTheDocument()
      expect(screen.getByRole('audio')).toBeInTheDocument()
    })
  })

  it('shows success message after saving recording', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ recordingId: 'test-id' }),
      })
    )

    render(<LiveRecordingPage />)
    
    // Start and stop recording
    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))
    await userEvent.click(screen.getByRole('button', { name: /stop/i }))
    
    // Save recording
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save recording/i })
      userEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/Recording saved successfully/i)).toBeInTheDocument()
    })
  })

  it('handles errors during recording start', async () => {
    // Mock getUserMedia to fail
    const mockError = new Error('Permission denied')
    ;(navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(mockError)

    render(<LiveRecordingPage />)
    
    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))

    await waitFor(() => {
      expect(screen.getByText(/Could not access microphone/i)).toBeInTheDocument()
    })
  })

  it('handles errors during save', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to save' }),
      })
    )

    render(<LiveRecordingPage />)
    
    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))
    await userEvent.click(screen.getByRole('button', { name: /stop/i }))
    
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save recording/i })
      userEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/Failed to save/i)).toBeInTheDocument()
    })
  })
})
