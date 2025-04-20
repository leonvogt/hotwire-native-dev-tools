describe("FloatingBubble Tests", () => {
  beforeEach(() => {
    cy.setupDevTools()
  })

  it("shows floating bubble on page load", () => {
    // Verify the floating bubble exists and is visible
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet("#floating-bubble").should("be.visible")
  })

  it("opens bottom sheet when floating bubble is clicked", () => {
    // Click the floating bubble
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick("#floating-bubble")

    // Verify the bottom sheet appears
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("have.class", "show")
  })

  it("displays bottom sheet when bubble is clicked", () => {
    // Initially the bottom sheet should not be visible
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("not.have.class", "show")

    // Click to open
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick("#floating-bubble")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("have.class", "show")
  })
})
