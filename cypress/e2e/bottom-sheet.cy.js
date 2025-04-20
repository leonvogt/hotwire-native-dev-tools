describe("BottomSheet Tests", () => {
  beforeEach(() => {
    cy.setupDevTools()
  })

  it("closes the bottom sheet when overlay is clicked", () => {
    // Open the bottom sheet
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick("#floating-bubble")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("have.class", "show")

    // Click the overlay to close
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick(".sheet-overlay")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("not.have.class", "show")
  })

  it("shows tabs navigation", () => {
    // Open the bottom sheet
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick("#floating-bubble")

    // Verify tabs exist
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".tablink").should("exist")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet('[data-tab-id="tab-console-logs"]').should("exist")
  })

  it("switches between tabs", () => {
    // Open the bottom sheet
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick("#floating-bubble")

    // Verify a tab is active
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".tablink.active").should("exist")

    // Click console tab
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick('[data-tab-id="tab-console-logs"]')
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".tab-content-console-logs").should("be.visible")
  })
})
