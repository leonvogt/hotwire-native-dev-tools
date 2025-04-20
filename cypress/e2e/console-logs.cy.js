describe("Console Logs Tests", () => {
  beforeEach(() => {
    cy.setupDevTools()
  })

  it("captures and displays console.log messages", () => {
    // Trigger a console log
    cy.window().then((win) => {
      win.console.log("Test log message")
    })

    cy.openBottomSheet()

    // Verify log is displayed in console tab
    cy.shadowGet(".tab-content-console-logs").contains("Test log message").should("exist")
  })

  it("displays different console message types", () => {
    // Trigger various console message types
    cy.window().then((win) => {
      win.console.log("Log message")
      win.console.info("Info message")
      win.console.warn("Warning message")
      win.console.error("Error message")
    })

    cy.openBottomSheet()

    // Verify all message types are displayed
    cy.shadowGet(".tab-content-console-logs").contains("Log message").should("exist")
    cy.shadowGet(".tab-content-console-logs").contains("Info message").should("exist")
    cy.shadowGet(".tab-content-console-logs").contains("Warning message").should("exist")
    cy.shadowGet(".tab-content-console-logs").contains("Error message").should("exist")
  })

  it("displays console log entries", () => {
    // Trigger multiple console message types
    cy.window().then((win) => {
      win.console.log("Specific test message")
      win.console.error("Specific error message")
    })

    cy.openBottomSheet()
    cy.shadowClick('[data-tab-id="tab-console-logs"]')

    // Verify messages appear in log
    cy.shadowGet(".tab-content-console-logs").contains("Specific test message").should("exist")
  })
})
