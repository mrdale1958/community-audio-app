import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

// Set up DOM environment
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder

// Mock fetch
global.fetch = jest.fn()

// Mock MediaRecorder
class MockMediaRecorder {
  constructor() {
    this.state = 'inactive'
    this.ondataavailable = jest.fn()
    this.onstop = jest.fn()
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    if (this.onstop) this.onstop()
  }
  pause() {
    this.state = 'paused'
  }
  resume() {
    this.state = 'recording'
  }
}

global.MediaRecorder = MockMediaRecorder

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockImplementation(() =>
    Promise.resolve({
      getTracks: () => [{
        stop: jest.fn()
      }]
    })
  )
}

// Mock URL methods
global.URL.createObjectURL = jest.fn()
global.URL.revokeObjectURL = jest.fn()

// Mock window.location
const mockLocation = new URL('http://localhost:3000')
delete window.location
window.location = mockLocation

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})
import { TextDecoder, TextEncoder } from 'util'

// Mock global browser APIs
Object.assign(global, { TextDecoder, TextEncoder })

// Mock window.URL.createObjectURL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn()
  window.URL.revokeObjectURL = jest.fn()
}

// Mock MediaRecorder
class MockMediaRecorder {
  start = jest.fn()
  stop = jest.fn()
  pause = jest.fn()
  resume = jest.fn()
  ondataavailable = jest.fn()
  onerror = jest.fn()
  onpause = jest.fn()
  onresume = jest.fn()
  onstart = jest.fn()
  onstop = jest.fn()
}

Object.assign(global, { 
  MediaRecorder: MockMediaRecorder,
  navigator: {
    ...navigator,
    mediaDevices: {
      getUserMedia: jest.fn().mockImplementation(() => Promise.resolve()),
    },
  },
})
