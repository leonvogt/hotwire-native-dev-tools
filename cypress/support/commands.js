// Set up standard test environment
Cypress.Commands.add("setupDevTools", () => {
  cy.visit("/cypress/fixtures/index.html", {
    onBeforeLoad(win) {
      cy.spy(win.console, "log").as("consoleLog")
      cy.spy(win.console, "info").as("consoleInfo")
      cy.spy(win.console, "error").as("consoleError")
      cy.spy(win.console, "warn").as("consoleWarn")
    },
  })
  cy.wait(100)
})

// Shadow DOM container reference
const SHADOW_CONTAINER = "#hotwire-native-dev-tools-shadow-container"

// Direct shadow DOM access commands
Cypress.Commands.add("devTools", () => {
  return cy.get(SHADOW_CONTAINER)
})

// Get element directly in shadow DOM
Cypress.Commands.add("shadowGet", (selector) => {
  return cy.devTools().then((el) => {
    return cy.wrap(el[0].shadowRoot.querySelector(selector))
  })
})

// Click element directly in shadow DOM
Cypress.Commands.add("shadowClick", (selector) => {
  return cy.devTools().then((el) => {
    const element = el[0].shadowRoot.querySelector(selector)
    if (element) {
      element.click()
    } else {
      throw new Error(`Element "${selector}" not found in shadow DOM`)
    }
    return cy.wrap(el)
  })
})

// Get all elements directly in shadow DOM
Cypress.Commands.add("shadowGetAll", (selector) => {
  return cy.devTools().then((el) => {
    return cy.wrap(Array.from(el[0].shadowRoot.querySelectorAll(selector)))
  })
})

// Open bottom sheet by clicking floating bubble
Cypress.Commands.add("openBottomSheet", () => {
  cy.shadowClick("#floating-bubble")
  cy.shadowGet(".bottom-sheet").should("have.class", "show")
})

// Assert class exists in shadow DOM element
Cypress.Commands.add("shadowHasClass", (selector, className) => {
  return cy.devTools().then((el) => {
    const element = el[0].shadowRoot.querySelector(selector)
    expect(element.classList.contains(className)).to.be.true
  })
})

// Assert text content in shadow DOM
Cypress.Commands.add("shadowContains", (selector, text) => {
  return cy.devTools().then((el) => {
    const element = el[0].shadowRoot.querySelector(selector)
    expect(element.textContent).to.include(text)
  })
})
