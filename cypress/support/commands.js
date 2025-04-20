// Set up standard test environment
Cypress.Commands.add("setupDevTools", () => {
  cy.visit("/cypress/fixtures/index.html", {
    onBeforeLoad(win) {
      cy.spy(win.console, "log").as("consoleLog")
      cy.spy(win.console, "info").as("consoleInfo")
    },
  })
  cy.wait(100)
})

// Get element in shadow DOM
Cypress.Commands.add("shadowGet", { prevSubject: "element" }, (subject, selector) => {
  return cy.wrap(subject[0].shadowRoot.querySelector(selector))
})

// Click element in shadow DOM
Cypress.Commands.add("shadowClick", { prevSubject: "element" }, (subject, selector) => {
  cy.wrap(subject[0].shadowRoot.querySelector(selector)).then((element) => {
    element.click()
  })
  return cy.wrap(subject)
})

// Assert class exists in shadow DOM element
Cypress.Commands.add("shadowHasClass", { prevSubject: "element" }, (subject, selector, className) => {
  return cy.wrap(subject[0].shadowRoot.querySelector(selector)).then((element) => {
    expect(element.classList.contains(className)).to.be.true
  })
})
