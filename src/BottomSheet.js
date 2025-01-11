export default class BottomSheet {
  constructor() {
    this.injectHTML()

    this.bottomSheetTarget = document.querySelector(".bottom-sheet")
    this.sheetContent = document.querySelector(".content")
    this.sheetOverlay = document.querySelector(".sheet-overlay")
  }

  injectHTML() {
    this.bottomSheet = document.createElement("div")
    this.bottomSheet.classList.add("bottom-sheet")
    this.bottomSheet.innerHTML = `
      <div class="sheet-overlay"></div>
      <div class="content">
        <div class="body">
          <h2>Bottom Sheet Title</h2>
          <p>Bottom Sheet Content</p>
        </div>
      </div>
    `
    document.body.appendChild(this.bottomSheet)
  }

  addEventListener() {
    this.sheetOverlay.addEventListener("click", () => this.hideBottomSheet())
  }

  showBottomSheet() {
    this.addEventListener()

    this.bottomSheetTarget.classList.add("show")
    document.body.style.overflowY = "hidden"
    this.updateSheetHeight(50)
  }

  updateSheetHeight(height) {
    this.sheetContent.style.height = `${height}vh`
  }

  hideBottomSheet() {
    this.bottomSheetTarget.classList.remove("show")
    document.body.style.overflowY = "auto"
  }
}
