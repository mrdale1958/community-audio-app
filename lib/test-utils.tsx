import { render as rtlRender } from '@testing-library/react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { SessionProvider } from 'next-auth/react'

// Custom render function that includes providers
function render(ui: React.ReactElement, { session = null, ...options } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </SessionProvider>
    )
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { render }

// Mock session data
export const mockSession = {
  data: {
    user: {
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      image: null
    },
    expires: '2100-01-01'
  },
  status: 'authenticated'
}

// Mock recording blob
export const createAudioBlob = () => {
  return new Blob(['test audio data'], { type: 'audio/webm' })
}

// Mock form data
export const createFormData = ({
  audio = createAudioBlob(),
  duration = '120',
  title = 'Test Recording',
  nameListId = 'list123'
} = {}) => {
  const formData = new FormData()
  formData.append('audio', audio, 'recording.webm')
  formData.append('duration', duration)
  formData.append('title', title)
  if (nameListId) {
    formData.append('nameListId', nameListId)
  }
  return formData
}

// Mock name list
export const mockNameList = {
  id: 'list123',
  names: JSON.stringify([
    'Alice Johnson',
    'Bob Smith',
    'Carol Davis'
  ]),
  createdAt: new Date(),
  updatedAt: new Date()
}

// Wait for a promise to resolve
export const waitForPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock fetch responses
export const mockFetchResponse = (data: any, ok = true) => {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data)
  })
}
