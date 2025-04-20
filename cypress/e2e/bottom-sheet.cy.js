describe("BottomSheet Tests", () => {
  beforeEach(() => {
    cy.setupDevTools()
  })

  it("displays tabbed interface in the bottom sheet", () => {
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick("#floating-bubble")

    // Click the console tab
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick('[data-tab-id="tab-console-logs"]')
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet("#tab-console-logs").should("have.class", "active")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".tab-content-console-logs").should("exist")
  })

  it("closes the bottom sheet when overlay is clicked", () => {
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick("#floating-bubble")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("have.class", "show")

    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick(".sheet-overlay")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("not.have.class", "show")
  })
})
