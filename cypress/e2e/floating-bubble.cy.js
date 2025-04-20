describe("FloatingBubble Tests", () => {
  beforeEach(() => {
    cy.setupDevTools()
  })

  it("shows floating bubble on page load", () => {
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet("#floating-bubble").should("be.visible")
  })

  it("opens bottom sheet when floating bubble is clicked", () => {
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("not.have.class", "show")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowClick("#floating-bubble")
    cy.get("#hotwire-native-dev-tools-shadow-container").shadowGet(".bottom-sheet").should("have.class", "show")
  })
})
