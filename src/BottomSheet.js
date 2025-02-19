import * as Icons from "./utils/icons"

export default class BottomSheet {
  constructor(devTools) {
    this.devTools = devTools
    this.state = devTools.state.state
  }

  render() {
    this.createBottomSheet()
    this.sheetContent = this.bottomSheet.querySelector(".content")
    this.sheetOverlay = this.bottomSheet.querySelector(".sheet-overlay")
    this.addEventListener()
  }

  update(newState) {
    this.state = newState
    this.renderConsoleLogs()
    this.renderBridgeLogs()
    this.renderEvents()
  }

  createBottomSheet() {
    const existingBottomSheet = this.devTools.shadowRoot?.querySelector(".bottom-sheet")
    if (existingBottomSheet) {
      this.bottomSheet = existingBottomSheet
      return
    }

    const activeTab = this.state.activeTab
    this.bottomSheet = document.createElement("div")
    this.bottomSheet.classList.add("bottom-sheet")
    this.bottomSheet.innerHTML = `
      <div class="sheet-overlay"></div>
      <div class="content">
        <div class="tablist">
          <button class="tablink ${activeTab === "tab-bridge-logs" ? "active" : ""}" data-tab-id="tab-bridge-logs">Bridge</button>
          <button class="tablink ${activeTab === "tab-console-logs" ? "active" : ""}" data-tab-id="tab-console-logs">Console</button>
          <button class="tablink ${activeTab === "tab-event-logs" ? "active" : ""}" data-tab-id="tab-event-logs">Events</button>
        </div>

        <div class="tab-contents">
          <div id="tab-bridge-logs" class="tab-content ${activeTab === "tab-bridge-logs" ? "active" : ""}">
            <div class="tab-action-bar">
              <button class="btn-clear-tab btn-clear-bridge-logs">${Icons.trash}</button>
            </div>
            <div class="tab-content-bridge-logs">
            </div>
          </div>

          <div id="tab-console-logs" class="tab-content ${activeTab === "tab-console-logs" ? "active" : ""}">
            <div class="tab-action-bar">
              <button class="btn-clear-tab btn-clear-console-logs">${Icons.trash}</button>
            </div>
            <div class="tab-content-console-logs">
            </div>
          </div>

          <div id="tab-event-logs" class="tab-content ${activeTab === "tab-event-logs" ? "active" : ""}">
            <div class="tab-action-bar">
              <button class="btn-clear-tab btn-clear-events">${Icons.trash}</button>
            </div>
            <div class="tab-content-event-logs">
            </div>
          </div>
        </div>
      </div>
    `
    this.devTools.shadowRoot.appendChild(this.bottomSheet)
  }

  renderConsoleLogs() {
    const container = this.bottomSheet.querySelector(".tab-content-console-logs")
    container.innerHTML = this.state.consoleLogs.length
      ? this.state.consoleLogs.map((log) => this.consoleLogHTML(log.type, log.message, log.time)).join("")
      : `<div class="tab-empty-content"><span>No console logs yet</span></div>`
  }

  renderBridgeLogs() {
    const container = this.bottomSheet.querySelector(".tab-content-bridge-logs")
    container.innerHTML = this.state.bridgeLogs.length
      ? this.state.bridgeLogs.map((log) => this.bridgeLogHTML(log.direction, log.componentName, log.eventName, log.eventArgs, log.time)).join("")
      : `<div class="tab-empty-content"><span>No bridge communication yet</span></div>`
  }

  renderEvents() {
    const container = this.bottomSheet.querySelector(".tab-content-event-logs")
    container.innerHTML = this.state.eventLogs.length
      ? this.state.eventLogs.map((event) => this.eventMessageHTML(event.eventName, event.time)).join("")
      : `<div class="tab-empty-content"><span>No events captured yet</span></div>`
  }

  handleTabClick = (event) => {
    const clickedTab = event.target.closest(".tablink")
    if (!clickedTab) return

    const tabId = clickedTab.dataset.tabId
    this.devTools.state.setActiveTab(tabId)
    this.updateTabView(tabId)
  }

  updateTabView(tabId) {
    // Hide all Tabs
    this.devTools.shadowRoot.querySelectorAll(".tablink, .tab-content").forEach((tab) => {
      tab.classList.remove("active")
    })

    // Show the clicked tab
    this.devTools.shadowRoot.querySelector(`[data-tab-id="${tabId}"]`).classList.add("active")
    this.devTools.shadowRoot.getElementById(tabId).classList.add("active")
  }

  bridgeLogHTML(direction, componentName, eventName, eventArgs, time) {
    return `
      <div class="log-entry d-flex gap-3 pt-2 pb-2">
        <div class="log-entry-icon">
          ${direction === "send" ? Icons.arrowDown : Icons.arrowUp}
        </div>
        <div class="w-100">
          <div class="d-flex justify-between">
            <strong>${componentName}#${eventName}</strong>
            <small>${time}</small>
          </div>
          <div>
            ${Object.entries(eventArgs)
              .map(([key, value]) => {
                return `<div>${key}: ${value}</div>`
              })
              .join("")}
          </div>
        </div>
      </div>
    `
  }

  consoleLogHTML(type, message, time) {
    return `
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
  }

  eventMessageHTML(message, time) {
    return `
      <div class="log-entry pt-2 pb-2">
        <div class="w-100">
          <div class="d-flex justify-end">
            <small>${time}</small>
          </div>
          <div class="log-entry-message">
            ${message}
          </div>
        </div>
      </div>
    `
  }

  addEventListener() {
    if (this.bottomSheet.hasEventListeners) return

    this.sheetOverlay.addEventListener("click", () => this.hideBottomSheet())

    this.bottomSheet.querySelector(".btn-clear-console-logs").addEventListener("click", () => this.devTools.state.clearConsoleLogs())
    this.bottomSheet.querySelector(".btn-clear-bridge-logs").addEventListener("click", () => this.devTools.state.clearBridgeLogs())
    this.bottomSheet.querySelector(".btn-clear-events").addEventListener("click", () => this.devTools.state.clearEventLogs())
    this.bottomSheet.querySelector(".tablist").addEventListener("click", (event) => this.handleTabClick(event))
    this.bottomSheet.hasEventListeners = true
  }

  showBottomSheet() {
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
