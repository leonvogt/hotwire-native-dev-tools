import * as Icons from "./utils/icons"
import { getSettings, saveSettings } from "./utils/settings"

export default class BottomSheet {
  constructor(devTools) {
    this.devTools = devTools
    this.activeTab = getSettings("activeTab") || "tab-bridge-logs"

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
          <button class="tablink ${this.activeTab === "tab-bridge-logs" ? "active" : ""}" data-tab-id="tab-bridge-logs">Bridge</button>
          <button class="tablink ${this.activeTab === "tab-console-logs" ? "active" : ""}" data-tab-id="tab-console-logs">Console</button>
        </div>

        <div id="tab-bridge-logs" class="tab-content ${this.activeTab === "tab-bridge-logs" ? "active" : ""}">
          <div class="tab-content-bridge-logs">
            <div class="tab-empty-content">
              <span>No bridge communication yet</span>
            </div>
          </div>
        </div>

        <div id="tab-console-logs" class="tab-content ${this.activeTab === "tab-console-logs" ? "active" : ""}">
          <div class="tab-content-console-logs">
            <div class="tab-empty-content">
              <span>No console logs yet</span>
            </div>
          </div>
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
        <div class="w-100">
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
    const bridgeLogs = this.sheetContent.querySelector(".tab-content-bridge-logs")
    const noEntryContent = bridgeLogs.querySelector(".tab-empty-content")
    if (noEntryContent) {
      noEntryContent.remove()
    }
    bridgeLogs.insertAdjacentHTML("beforeend", html)
  }

  addConsoleLog(type, message) {
    const time = new Date().toLocaleTimeString()
    const html = `
      <div class="log-entry pt-2 pb-2">
        <div class="w-100">
          <div class="d-flex justify-end">
            <small>${time}</small>
          </div>
          <div class="log-entry-message ${type}">
            ${message}
          </div>
        </div>
      </div>
    `
    const consoleLogs = this.sheetContent.querySelector(".tab-content-console-logs")
    const noEntryContent = consoleLogs.querySelector(".tab-empty-content")
    if (noEntryContent) {
      noEntryContent.remove()
    }
    consoleLogs.insertAdjacentHTML("beforeend", html)
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
