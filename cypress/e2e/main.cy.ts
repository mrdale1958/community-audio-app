/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Reset any previous login state
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Intercept auth and API requests
    cy.intercept('POST', '/api/auth/callback/credentials').as('loginRequest')
    cy.intercept('GET', '/api/auth/session').as('sessionRequest')
  })

  it('redirects to login when accessing protected routes', () => {
    cy.visit('/contribute/live')
    cy.url().should('include', '/auth/signin')
  })

  it('allows user to sign in and maintains session', () => {
    cy.login()

    // Verify session persistence
    cy.getCookie('next-auth.session-token').should('exist')
    cy.reload()
    
    // Wait for session check after reload
    cy.wait('@sessionRequest')
    cy.findByText(/test user/i).should('exist')
    
    // Verify access to protected routes
    cy.visit('/contribute/live')
    cy.url().should('include', '/contribute/live')
  })

  it('navigates through main user modes', () => {
    // Login using custom command
    cy.login()
    
    // Visit home page
    cy.visit('/')
    
    // Verify we're logged in by checking the header
    cy.get('header').should('exist')
    cy.get('header').should('not.contain.text', 'Sign In')
    
    // Test navigation to each main section
    cy.findByRole('link', { name: /live recording/i }).click()
    cy.url().should('include', '/contribute/live')
    
    cy.visit('/')
    cy.findByRole('link', { name: /offline contribution/i }).click()
    cy.url().should('include', '/contribute/offline')
    
    cy.visit('/')
    cy.findByRole('link', { name: /playback/i }).click()
    cy.url().should('include', '/playback')
    
    // Verify navigation state is preserved
    cy.go('back')
    cy.url().should('include', '/')
  })
})

describe('Live Recording Flow', () => {
  beforeEach(() => {
    // Log in before each test
    cy.login()
    
    // Improved MediaDevices mock
    cy.window().then((win: Window & typeof globalThis) => {
      // Create a mock MediaStream with audio track
      const audioTrack = {
        kind: 'audio',
        id: 'mock-audio-track-id',
        label: 'Mock Audio Track',
        enabled: true,
        muted: false,
        readyState: 'live',
        stop: cy.stub(),
      }

      class MockMediaStream {
        tracks: any[]
        constructor() {
          this.tracks = [audioTrack]
        }
        getTracks() { return this.tracks }
        getAudioTracks() { return this.tracks.filter(t => t.kind === 'audio') }
        getVideoTracks() { return [] }
        addTrack(track: any) { this.tracks.push(track) }
        removeTrack(track: any) { this.tracks = this.tracks.filter(t => t !== track) }
      }

      // Create full mock of MediaDevices
      const mockStream = new MockMediaStream()
      const mockMediaDevices: MediaDevices = {
        getUserMedia: cy.stub().resolves(mockStream),
        enumerateDevices: cy.stub().resolves([{
          deviceId: 'mock-audio-device',
          kind: 'audioinput',
          label: 'Mock Microphone',
          groupId: 'mock-group'
        }]),
        getDisplayMedia: cy.stub().resolves(mockStream),
        getSupportedConstraints: () => ({
          aspectRatio: true,
          deviceId: true,
          echoCancellation: true,
          facingMode: true,
          frameRate: true,
          height: true,
          width: true,
          sampleRate: true,
          sampleSize: true,
          volume: true
        }),
        ondevicechange: null,
        addEventListener: cy.stub(),
        removeEventListener: cy.stub(),
        dispatchEvent: cy.stub().returns(true)
      }

      // Apply the mock
      Object.defineProperty(win.navigator, 'mediaDevices', {
        value: mockMediaDevices,
        configurable: true
      })
    })

    // Intercept recording-related requests
    cy.intercept('POST', '/api/recordings/start', { statusCode: 200, body: { id: 'mock-recording-id' } }).as('startRecording')
    cy.intercept('POST', '/api/recordings/stop', { statusCode: 200 }).as('stopRecording')
  })

  it('completes a recording session successfully', () => {
    // Navigate to recording page
    cy.visit('/contribute/live')
    
    // Verify recording interface is ready
    cy.findByRole('heading', { name: /live recording/i }).should('exist')
    cy.findByRole('button', { name: /start recording/i }).should('be.enabled')
    
    // Start recording
    cy.findByRole('button', { name: /start recording/i }).click()
    cy.wait('@startRecording')
    
    // Verify recording state
    cy.findByRole('button', { name: /stop recording/i }).should('be.visible')
    cy.findByText(/recording in progress/i).should('be.visible')
    
    // Wait a bit to simulate recording
    cy.wait(2000)
    
    // Stop recording
    cy.findByRole('button', { name: /stop recording/i }).click()
    cy.wait('@stopRecording')
    
    // Verify recording completed
    cy.findByText(/recording completed/i).should('exist')
    cy.findByRole('button', { name: /start recording/i }).should('be.enabled')
  })

  it('handles recording API errors gracefully', () => {
    // Mock a failed recording start
    cy.intercept('POST', '/api/recordings/start', {
      statusCode: 500,
      body: { error: 'Failed to initialize recording' }
    }).as('failedRecording')
    
    cy.visit('/contribute/live')
    cy.findByRole('button', { name: /start recording/i }).click()
    cy.wait('@failedRecording')
    
    // Check error handling
    cy.findByText(/error/i).should('exist')
    cy.findByText(/failed to initialize recording/i).should('exist')
    cy.findByRole('button', { name: /start recording/i }).should('be.enabled')
  })

  it('completes recording upload successfully', () => {
    // Setup recording upload mock
    cy.intercept('POST', '/api/recordings/upload', {
      statusCode: 200,
      body: { recordingId: 'test-123' }
    }).as('uploadRecording')

    cy.visit('/contribute/live')
    
    // Start recording
    cy.findByRole('button', { name: /start recording/i }).click()
    cy.wait('@startRecording')
    
    // Wait and stop recording (shorter wait for tests)
    cy.wait(1000) // Record for 1 second in tests
    cy.findByRole('button', { name: /stop recording/i }).click()
    cy.wait('@stopRecording')
    
    // Verify recording completed
    cy.findByRole('audio').should('exist')
    cy.findByRole('button', { name: /save recording/i }).should('exist')
    
    // Save recording
    cy.findByRole('button', { name: /save recording/i }).click()
    cy.wait('@uploadRecording')
    
    // Verify success
    cy.findByText(/recording saved successfully/i).should('exist')
  })

  it('handles microphone permission errors', () => {
    // Override MediaDevices mock for this test
    cy.window().then((win: Window & typeof globalThis) => {
      const mockMediaDevices: MediaDevices = {
        getUserMedia: cy.stub().rejects(new Error('Permission denied')),
        enumerateDevices: cy.stub().resolves([]),
        getDisplayMedia: cy.stub().rejects(new Error('Not implemented')),
        getSupportedConstraints: () => ({}),
        ondevicechange: null,
        addEventListener: cy.stub(),
        removeEventListener: cy.stub(),
        dispatchEvent: cy.stub().returns(true)
      }

      Object.defineProperty(win.navigator, 'mediaDevices', {
        value: mockMediaDevices,
        configurable: true
      })
    })

    cy.visit('/contribute/live')
    cy.findByRole('button', { name: /start recording/i }).click()
    
    // Should show error message
    cy.findByText(/could not access microphone/i).should('exist')
  })
})
