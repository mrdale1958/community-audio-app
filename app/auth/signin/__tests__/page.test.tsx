import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignInPage from '../page'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

describe('SignInPage', () => {
  const mockRouter = {
    push: jest.fn(),
    query: {}
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders sign in form', () => {
    render(<SignInPage />)
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<SignInPage />)
    
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await userEvent.click(signInButton)
    
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('handles successful sign in', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({
      ok: true,
      error: null
    })

    render(<SignInPage />)
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await userEvent.click(signInButton)
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false
      })
    })

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
  })

  it('handles sign in error', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({
      ok: false,
      error: 'Invalid credentials'
    })

    render(<SignInPage />)
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')
    
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await userEvent.click(signInButton)
    
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })

  it('navigates to sign up page', async () => {
    render(<SignInPage />)
    
    const signUpLink = screen.getByText(/sign up/i)
    await userEvent.click(signUpLink)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/signup')
  })

  it('shows loading state during sign in', async () => {
    // Make signIn take some time to resolve
    ;(signIn as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<SignInPage />)
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await userEvent.click(signInButton)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
