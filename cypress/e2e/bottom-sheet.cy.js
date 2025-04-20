describe("BottomSheet Tests", () => {
  beforeEach(() => {
    cy.setupDevTools()
  })

  it("closes the bottom sheet when overlay is clicked", () => {
    cy.openBottomSheet()

    // Click the overlay to close
    cy.shadowClick(".sheet-overlay")
    cy.shadowGet(".bottom-sheet").should("not.have.class", "show")
  })

  it("shows tabs navigation", () => {
    cy.openBottomSheet()

    // Verify tabs exist
    cy.shadowGet(".tablink").should("exist")
    cy.shadowGet('[data-tab-id="tab-console-logs"]').should("exist")
  })

  it("switches between tabs", () => {
    cy.openBottomSheet()

    // Click console tab
    cy.shadowClick('[data-tab-id="tab-console-logs"]')
    cy.shadowGet("#tab-console-logs").should("be.visible")

    // Click bridge tab
    cy.shadowClick('[data-tab-id="tab-bridge-components"]')
    cy.shadowGet("#tab-bridge-components").should("be.visible")
    cy.shadowGet("#tab-console-logs").should("not.be.visible")
  })
})
