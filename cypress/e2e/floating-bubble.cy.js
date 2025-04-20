describe("FloatingBubble Tests", () => {
  beforeEach(() => {
    cy.setupDevTools()
  })

  it("shows floating bubble on page load", () => {
    // Verify the floating bubble exists and is visible
    cy.shadowGet("#floating-bubble").should("be.visible")
  })

  it("opens bottom sheet when floating bubble is clicked", () => {
    cy.shadowGet(".bottom-sheet").should("not.have.class", "show")
    cy.shadowClick("#floating-bubble")
    cy.shadowGet(".bottom-sheet").should("have.class", "show")
  })
})
