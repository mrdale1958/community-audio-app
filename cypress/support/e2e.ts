/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

import './commands'
import '@testing-library/cypress/add-commands'
import { setupTestUser, cleanupTestUser } from './test-setup'

// Augment window interface for custom properties
declare global {
  namespace Cypress {
    interface Window {
      navigator: Navigator & {
        mediaDevices: MediaDevices
      }
    }
  }
}

// Set up test data before all tests
before(async () => {
  await setupTestUser()
})

// Clean up test data after all tests
after(async () => {
  await cleanupTestUser()
})

// Prevent uncaught exception from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})
