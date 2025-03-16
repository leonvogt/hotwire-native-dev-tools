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
    this.addEventListeners()
  }

  update(newState) {
    this.state = newState
    this.checkNativeFeatures()
    this.renderConsoleLogs()
    this.renderBridgeComponents()
    this.renderBridgeLogs()
    this.renderEvents()
    this.renderNativeStack()
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
        <div class="top-part">
          <div class="tablist">
            <button class="tablink ${activeTab === "tab-bridge-logs" ? "active" : ""}" data-tab-id="tab-bridge-logs">Bridge</button>
            <button class="tablink ${activeTab === "tab-console-logs" ? "active" : ""}" data-tab-id="tab-console-logs">Console</button>
            <button class="tablink ${activeTab === "tab-event-logs" ? "active" : ""}" data-tab-id="tab-event-logs">Events</button>
            <button class="tablink ${activeTab === "tab-native-stack" ? "active" : ""} d-none" data-tab-id="tab-native-stack">Stack</button>
          </div>

          <div class="tab-action-bars">
            <div class="tab-action-bar tab-bridge-logs ${activeTab === "tab-bridge-logs" ? "active" : ""}">
              <button class="btn-clear-tab btn-clear-bridge-logs">${Icons.trash}</button>
            </div>
            <div class="tab-action-bar tab-console-logs ${activeTab === "tab-console-logs" ? "active" : ""}">
              <button class="btn-clear-tab btn-clear-console-logs">${Icons.trash}</button>
            </div>
            <div class="tab-action-bar tab-event-logs ${activeTab === "tab-event-logs" ? "active" : ""}">
              <button class="btn-clear-tab btn-clear-events">${Icons.trash}</button>
            </div>
            <div class="tab-action-bar tab-native-stack ${activeTab === "tab-native-stack" ? "active" : ""}">
              <button class="btn-reload-tab btn-reload-stack">${Icons.rotate}</button>
            </div>
          </div>
        </div>

        <div class="tab-contents">
          <div id="tab-bridge-logs" class="outer-tab-content ${activeTab === "tab-bridge-logs" ? "active" : ""}">
            <div class="inner-tab-content">
              <button class="collapse bridge-components-collapse-btn" type="button" data-collapse-target="bridge-components-collapse">
                Bridge Components: <span class="bridge-components-amount">${this.state.supportedBridgeComponents.length}</span>
              </button>
              <div id="bridge-components-collapse">
                <div class="tab-content-bridge-components d-flex flex-column gap-1 mt-1"></div>
              </div>
            </div>
            <div class="inner-tab-content tab-content-bridge-logs">
            </div>
          </div>

          <div id="tab-console-logs" class="outer-tab-content ${activeTab === "tab-console-logs" ? "active" : ""}">
            <div class="inner-tab-content tab-content-console-logs">
            </div>
          </div>

          <div id="tab-event-logs" class="outer-tab-content ${activeTab === "tab-event-logs" ? "active" : ""}">
            <div class="inner-tab-content tab-content-event-logs">
            </div>
          </div>

          <div id="tab-native-stack" class="outer-tab-content ${activeTab === "tab-native-stack" ? "active" : ""}">
            <div class="inner-tab-content tab-content-native-stack">
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

  renderBridgeComponents() {
    const bridgeComponentsAmount = this.state.supportedBridgeComponents.length
    this.bottomSheet.querySelector(".bridge-components-amount").textContent = bridgeComponentsAmount

    const container = this.bottomSheet.querySelector(".tab-content-bridge-components")
    container.innerHTML = bridgeComponentsAmount
      ? this.state.supportedBridgeComponents.map((component) => `<div>${component}</div>`).join("")
      : `<div class="tab-empty-content d-flex flex-column text-center"><span>${"No bridge components found"}</span></div>`
  }

  renderBridgeLogs() {
    const container = this.bottomSheet.querySelector(".tab-content-bridge-logs")
    container.innerHTML = this.state.bridgeLogs.length
      ? this.state.bridgeLogs.map((log) => this.bridgeLogHTML(log.direction, log.componentName, log.eventName, log.eventArgs, log.time)).join("")
      : `<div class="tab-empty-content d-flex flex-column text-center"><span>${
          this.state.bridgeIsConnected ? "No bridge communication yet" : "Bridge is not connected <br><small>(window.Strada.web is undefined)</small>"
        }</span></div>`
  }

  renderEvents() {
    const container = this.bottomSheet.querySelector(".tab-content-event-logs")
    container.innerHTML = this.state.eventLogs.length
      ? this.state.eventLogs.map((event) => this.eventMessageHTML(event.eventName, event.time)).join("")
      : `<div class="tab-empty-content"><span>No events captured yet</span></div>`
  }

  renderNativeStack() {
    const container = this.bottomSheet.querySelector(".tab-content-native-stack")
    container.innerHTML = this.state.nativeStack.length ? this.state.nativeStack.map((view) => this.nativeViewStackHTML(view)).join("") : `<div class="tab-empty-content"><span>No native stack captured yet</span></div>`
  }

  bridgeLogHTML(direction, componentName, eventName, eventArgs, time) {
    return `
      <div class="log-entry d-flex gap-3 pt-2 pb-2">
        <div class="log-entry-icon">
          ${direction === "send" ? Icons.arrowDown : Icons.arrowUp}
        </div>
        <div class="w-100">
          <div class="d-flex justify-content-between">
            <strong class="w-80 text-ellipsis">${componentName}#${eventName}</strong>
            <small>${time}</small>
          </div>
          <div>
            ${Object.entries(eventArgs)
              .map(([key, value]) => {
                const formattedValue = typeof value === "object" && value !== null ? JSON.stringify(value) : value
                return `<div class="white-space-collapse">${key}: ${formattedValue}</div>`
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
          <div class="d-flex justify-content-end">
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
          <div class="d-flex justify-content-end">
            <small>${time}</small>
          </div>
          <div class="log-entry-message">
            ${message}
          </div>
        </div>
      </div>
    `
  }

  nativeViewStackHTML(view) {
    const isMainView = ["UINavigationController", "NavigatorHost"].includes(view.type)
    const isTabBar = view.type === "UITabBarController"
    const isHotwireView = ["VisitableViewController", "HotwireWebFragment", "BackStackEntry"].includes(view.type)
    const activeClass = view.url === this.currentUrl ? "active" : ""
    const wrapperClass = `viewstack-card ${activeClass} ${isMainView ? "main-view" : isHotwireView ? "hotwire-view" : isTabBar ? "tab-container" : ""}`

    const urlPath = view.url
      ? `<div class="view-url">
          ${(() => {
            try {
              return new URL(view.url).pathname
            } catch (error) {
              return view.url
            }
          })()}
         </div>`
      : ""

    const childrenHTML = view.children?.length
      ? `<div class="child-container">
          ${view.children.map((child) => this.nativeViewStackHTML(child)).join("")}
         </div>`
      : ""

    return `
      <div>
        <div class="${wrapperClass}">
          <div class="view-title">
            ${view.title == "null" ? "" : view.title}
            <div class="view-title-details">${view.type}</div>
          </div>
          ${urlPath}
        </div>
        ${childrenHTML}
      </div>
    `
  }

  checkNativeFeatures() {
    if (this.state.supportsNativeStackView) {
      this.bottomSheet.querySelector(".tablink[data-tab-id='tab-native-stack']").classList.remove("d-none")
    }
  }

  addEventListeners() {
    if (this.bottomSheet.hasEventListeners) return

    this.sheetOverlay.addEventListener("click", () => this.hideBottomSheet())

    // Tab Click
    this.bottomSheet.querySelector(".tablist").addEventListener("click", (event) => this.handleTabClick(event))

    // Action Buttons
    this.bottomSheet.querySelector(".btn-clear-console-logs").addEventListener("click", () => this.devTools.state.clearConsoleLogs())
    this.bottomSheet.querySelector(".btn-clear-bridge-logs").addEventListener("click", () => this.devTools.state.clearBridgeLogs())
    this.bottomSheet.querySelector(".btn-clear-events").addEventListener("click", () => this.devTools.state.clearEventLogs())
    this.bottomSheet.querySelector(".btn-reload-stack").addEventListener("click", () => this.devTools.fetchNativeStack())

    // Dragging
    this.bottomSheet.querySelector(".top-part").addEventListener("touchstart", this.dragStart.bind(this))
    this.bottomSheet.addEventListener("touchmove", this.dragging.bind(this))
    this.bottomSheet.addEventListener("touchend", this.dragStop.bind(this))

    // Collapsibles
    const collapsibles = this.bottomSheet.querySelectorAll(".collapse")
    collapsibles.forEach((collapsible) => {
      const targetId = collapsible.getAttribute("data-collapse-target")
      const targetElement = this.bottomSheet.querySelector(`#${targetId}`)

      if (!targetElement) return

      targetElement.style.display = "none"
      collapsible.addEventListener("click", function (event) {
        event.preventDefault()
        this.classList.toggle("active")
        targetElement.style.display = targetElement.style.display === "block" ? "none" : "block"
      })
    })

    this.bottomSheet.hasEventListeners = true
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
    this.devTools.shadowRoot.querySelectorAll(".tablink, .outer-tab-content").forEach((tab) => {
      tab.classList.remove("active")
    })

    // Hide all Action Bars
    this.devTools.shadowRoot.querySelectorAll(".tab-action-bar").forEach((tab) => {
      tab.classList.remove("active")
    })

    // Show the clicked tab
    this.devTools.shadowRoot.querySelector(`[data-tab-id="${tabId}"]`).classList.add("active")
    this.devTools.shadowRoot.getElementById(tabId).classList.add("active")

    // Show the action bar for the clicked tab
    this.devTools.shadowRoot.querySelector(`.tab-action-bar.${tabId}`).classList.add("active")
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

  updateSheetHeight(height) {
    this.sheetContent.style.height = `${height}vh`
    this.bottomSheet.classList.toggle("fullscreen", height === 100)
  }

  dragStart(e) {
    this.isDragging = true
    this.startY = e.pageY || e.touches?.[0].pageY
    this.startHeight = parseInt(this.sheetContent.style.height)
    this.bottomSheet.classList.add("dragging")
  }

  dragging(e) {
    if (!this.isDragging) return
    const delta = this.startY - (e.pageY || e.touches?.[0].pageY)
    const newHeight = this.startHeight + (delta / window.innerHeight) * 100
    this.updateSheetHeight(newHeight)
  }

  dragStop() {
    this.isDragging = false
    this.bottomSheet.classList.remove("dragging")
    const sheetHeight = parseInt(this.sheetContent.style.height)
    sheetHeight < 40 ? this.hideBottomSheet() : sheetHeight > 60 ? this.updateSheetHeight(100) : this.updateSheetHeight(50)
  }

  get currentUrl() {
    return window.location.href
  }
}
