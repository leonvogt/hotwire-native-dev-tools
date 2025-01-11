export default class BottomSheet {
  constructor() {
    this.injectHTML()

    this.bottomSheet = document.querySelector(".bottom-sheet")
    this.sheetContent = this.bottomSheet.querySelector(".content")
    this.sheetOverlay = this.bottomSheet.querySelector(".sheet-overlay")
  }

  injectHTML() {
    this.bottomSheet = document.createElement("div")
    this.bottomSheet.classList.add("bottom-sheet")
    this.bottomSheet.innerHTML = `
      <div class="sheet-overlay"></div>
      <div class="content">
      </div>
    `
    document.body.appendChild(this.bottomSheet)
  }

  content(html) {
    this.sheetContent.innerHTML = html
  }

  addEventListener() {
    // Listen for click on the overlay to close the bottom sheet
    this.sheetOverlay.addEventListener("click", () => this.hideBottomSheet())
  }

  showBottomSheet() {
    this.addEventListener()

    this.bottomSheet.classList.add("show")
    document.body.style.overflowY = "hidden"
    this.updateSheetHeight(50)
  }

  updateSheetHeight(height) {
    this.sheetContent.style.height = `${height}vh`
  }

  hideBottomSheet() {
    this.bottomSheet.classList.remove("show")
    document.body.style.overflowY = "auto"
  }
}
