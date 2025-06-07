import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import Header from '../Header'
import userEvent from '@testing-library/user-event'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}))

describe('Header', () => {
  const mockSession = {
    data: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: null
      }
    },
    status: 'authenticated'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders logo and navigation when authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    
    render(<Header />)
    
    expect(screen.getByText(/Community Audio/i)).toBeInTheDocument()
    expect(screen.getByText(/Test User/i)).toBeInTheDocument()
  })

  it('shows login button when not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })
    
    render(<Header />)
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.queryByText(/Test User/i)).not.toBeInTheDocument()
  })

  it('opens user menu on click', async () => {
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    
    render(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /user menu/i })
    await userEvent.click(menuButton)
    
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText(/profile/i)).toBeInTheDocument()
    expect(screen.getByText(/sign out/i)).toBeInTheDocument()
  })

  it('handles sign out', async () => {
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    
    render(<Header />)
    
    // Open menu and click sign out
    const menuButton = screen.getByRole('button', { name: /user menu/i })
    await userEvent.click(menuButton)
    
    const signOutButton = screen.getByText(/sign out/i)
    await userEvent.click(signOutButton)
    
    expect(signOut).toHaveBeenCalled()
  })

  it('navigates to profile page', async () => {
    const mockRouter = { push: jest.fn() }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    
    render(<Header />)
    
    // Open menu and click profile
    const menuButton = screen.getByRole('button', { name: /user menu/i })
    await userEvent.click(menuButton)
    
    const profileButton = screen.getByText(/profile/i)
    await userEvent.click(profileButton)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/profile')
  })

  it('renders mobile menu button on small screens', async () => {
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    })
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'))
    
    render(<Header />)
    
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })
})
