/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

import '@testing-library/cypress/add-commands'

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
}

Cypress.Commands.add('login', () => {
  cy.session(
    TEST_USER.email,
    () => {
      cy.visit('/auth/signin')

      // Get CSRF token and wait for the form to be ready
      cy.get('form').within(() => {
        cy.get('input[name="csrfToken"]')
          .should('exist')
          .invoke('attr', 'value')
          .then((csrfToken) => {
            // Use API call for faster login
            cy.request({
              method: 'POST',
              url: '/api/auth/callback/credentials',
              body: {
                email: TEST_USER.email,
                password: TEST_USER.password,
                csrfToken,
                json: true,
              },
              headers: {
                'Content-Type': 'application/json',
              },
            }).its('status').should('eq', 200)
        })
      })
    },
    {
      validate() {
        // Check both session token and user state
        cy.getCookie('next-auth.session-token').should('exist')
        cy.visit('/')
        cy.findByText(new RegExp(TEST_USER.name, 'i')).should('exist')
      },
      cacheAcrossSpecs: false,
    }
  )
})

// Custom command to select by data-cy attribute
Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy=${value}]`)
})

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login to the application
       * @example cy.login()
       */
      login(): Chainable<void>
      
      /**
       * Custom command to select DOM element by data-cy attribute
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
