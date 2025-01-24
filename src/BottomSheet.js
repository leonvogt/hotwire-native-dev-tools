import * as Icons from "./utils/icons"

export default class BottomSheet {
  constructor(devTools) {
    this.devTools = devTools

    this.injectHTML()

    this.sheetContent = this.bottomSheet.querySelector(".content")
    this.sheetOverlay = this.bottomSheet.querySelector(".sheet-overlay")
  }

  injectHTML() {
    this.bottomSheet = document.createElement("div")
    this.bottomSheet.classList.add("bottom-sheet")
    this.bottomSheet.innerHTML = `
      <div class="sheet-overlay"></div>
      <div class="content">
        <div class="tab-bridge-logs"></div>
      </div>
    `
    this.devTools.shadowRoot.appendChild(this.bottomSheet)
  }

  addBridgeLog(direction, componentName, eventName, eventArgs) {
    const time = new Date().toLocaleTimeString()
    const html = `
      <div class="log-entry d-flex gap-3 pt-2 pb-2">
        <div class="log-entry-icon">
          ${direction === "send" ? Icons.arrowDown : Icons.arrowUp}
        </div>
        <div class="log-entry__content w-100">
          <div class="d-flex justify-between">
            <strong>${componentName}#${eventName}</strong>
            <small>${time}</small>
          </div>
          <div class="">
            ${Object.entries(eventArgs)
              .map(([key, value]) => {
                return `<div>${key}: ${value}</div>`
              })
              .join("")}
        </div>
      </div>
    `
    this.sheetContent.querySelector(".tab-bridge-logs").insertAdjacentHTML("beforebegin", html)
  }

  addEventListener() {
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
