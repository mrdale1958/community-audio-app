import { render } from '@testing-library/react'
import { AuthProvider } from '../AuthProvider'
import { SessionProvider } from 'next-auth/react'

// Mock next-auth SessionProvider
jest.mock('next-auth/react', () => ({
  SessionProvider: jest.fn(({ children }) => children)
}))

describe('AuthProvider', () => {
  it('renders children within SessionProvider', () => {
    const testChild = <div data-testid="test-child">Test Child</div>
    
    const { getByTestId } = render(
      <AuthProvider>
        {testChild}
      </AuthProvider>
    )

    expect(SessionProvider).toHaveBeenCalled()
    expect(getByTestId('test-child')).toBeInTheDocument()
  })

  it('passes correct props to SessionProvider', () => {
    render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    )

    expect(SessionProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        children: expect.anything()
      }),
      expect.any(Object)
    )
  })
})
