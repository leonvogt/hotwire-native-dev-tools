import * as Icons from "./utils/icons"
import { getSettings, saveSettings } from "./utils/settings"

export default class BottomSheet {
  constructor(devTools) {
    this.devTools = devTools
    this.activeTab = getSettings("activeTab") || "bridge-logs"

    this.createBottomSheet()
    this.sheetContent = this.bottomSheet.querySelector(".content")
    this.sheetOverlay = this.bottomSheet.querySelector(".sheet-overlay")
  }

  createBottomSheet() {
    const existingBottomSheet = this.devTools.shadowRoot?.querySelector(".bottom-sheet")
    if (existingBottomSheet) {
      this.bottomSheet = existingBottomSheet
      return
    }

    this.bottomSheet = document.createElement("div")
    this.bottomSheet.classList.add("bottom-sheet")
    this.bottomSheet.innerHTML = `
      <div class="sheet-overlay"></div>
      <div class="content">
        <div class="tablist">
          <button class="tablink ${this.activeTab === "bridge-logs" ? "active" : ""}" data-tab-id="bridge-logs">Bridge</button>
          <button class="tablink ${this.activeTab === "console-logs" ? "active" : ""}" data-tab-id="console-logs">Console</button>
        </div>

        <div id="bridge-logs" class="tab-content ${this.activeTab === "bridge-logs" ? "active" : ""}">
          <h3>Bridge Logs</h3>
          <div class="tab-bridge-logs"></div>
        </div>

        <div id="console-logs" class="tab-content ${this.activeTab === "console-logs" ? "active" : ""}">
          <h3>Console Logs</h3>
          <div class="tab-console-logs"></div>
        </div>
      </div>
    `
    this.devTools.shadowRoot.appendChild(this.bottomSheet)
    this.listenForTabNavigation()
  }

  listenForTabNavigation() {
    const tablist = this.devTools.shadowRoot.querySelector(".tablist")
    tablist.addEventListener("click", this.handleClickTab)
  }

  handleClickTab = (event) => {
    this.devTools.shadowRoot.querySelectorAll(".tablink, .tab-content").forEach((tab) => {
      tab.classList.remove("active")
    })

    const clickedTab = event.target.closest(".tablink")
    const desiredTabContent = this.devTools.shadowRoot.getElementById(clickedTab.dataset.tabId)

    clickedTab.classList.add("active")
    desiredTabContent.classList.add("active")

    saveSettings("activeTab", clickedTab.dataset.tabId)
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

  addConsoleLog(type, message) {
    const time = new Date().toLocaleTimeString()
    const html = `
      <div class="log-entry pt-2 pb-2 ${type}">
        <div class="log-entry__content w-100">
          <div class="d-flex justify-end">
            <small>${time}</small>
          </div>
          <div>
            ${message}
          </div>
        </div>
      </div>
    `
    this.sheetContent.querySelector(".tab-console-logs").insertAdjacentHTML("beforebegin", html)
  }

  addEventListener() {
    this.sheetOverlay.addEventListener("click", () => this.hideBottomSheet())
  }

  showBottomSheet() {
    this.addEventListener()

    this.bottomSheet.classList.add("show")
    document.body.style.overflow = "hidden"
    this.updateSheetHeight(50)
  }

  updateSheetHeight(height) {
    this.sheetContent.style.height = `${height}vh`
  }

  hideBottomSheet() {
    this.bottomSheet.classList.remove("show")
    document.body.style.overflow = "auto"
  }
}
