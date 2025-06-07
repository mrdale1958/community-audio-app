/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login to the application
     * @example cy.login()
     */
    login(): Chainable<void>

    /**
     * Custom command to select DOM element by data-cy attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string): Chainable<JQuery<HTMLElement>>
  }

  // Extend Window interface
  interface Window {
    navigator: {
      mediaDevices: {
        getUserMedia: (constraints?: MediaStreamConstraints) => Promise<MediaStream>
      } & MediaDevices
    } & Navigator
  }

  // Extend AUTWindow interface
  interface AUTWindow {
    navigator: {
      mediaDevices: {
        getUserMedia: (constraints?: MediaStreamConstraints) => Promise<MediaStream>
      } & MediaDevices
    } & Navigator
  }

  // Add type for interception
  interface Interception {
    response?: {
      statusCode: number
      body: any
    }
  }
}
