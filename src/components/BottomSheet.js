import * as Icons from "../assets/icons"
import { platform, formattedPlatform } from "../utils/utils"
import { saveSettings, getSettings, getConsoleFilterLevels, saveConsoleFilterLevels } from "../utils/settings"

// WARNING: Be careful when console logging in this file, as it can cause an infinite loop
// When you need to debug, use the `log` helper function like this:
// this.log("message")
// or turn off the console proxy in DevTools.js

export default class BottomSheet {
  constructor(devTools) {
    this.devTools = devTools
    this.state = devTools.state.state
    this.sheetHeight = getSettings("bottomSheetHeight") || 50
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
    const consoleFilterLevels = getConsoleFilterLevels()
    const consoleSearch = this.state.consoleSearch
    this.bottomSheet = document.createElement("div")
    this.bottomSheet.classList.add("bottom-sheet")
    this.bottomSheet.innerHTML = `
      <div class="sheet-overlay"></div>
      <div class="content">
        <div class="top-part">
          <div class="tablist">
            <button class="tablink ${activeTab === "tab-bridge-components" ? "active" : ""}" data-tab-id="tab-bridge-components">Bridge</button>
            <button class="tablink ${activeTab === "tab-console-logs" ? "active" : ""}" data-tab-id="tab-console-logs">Console</button>
            <button class="tablink ${activeTab === "tab-event-logs" ? "active" : ""}" data-tab-id="tab-event-logs">Events</button>
            <button class="tablink ${activeTab === "tab-native-stack" ? "active" : ""} d-none" data-tab-id="tab-native-stack">Stack</button>
            <button class="tablink-settings btn-switch-to-single-tab-sheet" data-tab-id="single-tab-settings">${Icons.threeDotsVertical}</button>
          </div>

          <div class="tab-action-bars">
            <div class="tab-action-bar tab-bridge-components ${activeTab === "tab-bridge-components" ? "active" : ""}">
              <button class="btn-icon btn-clear-tab btn-clear-bridge-logs">${Icons.trash}</button>
            </div>
            <div class="tab-action-bar d-flex flex-column tab-console-logs ${activeTab === "tab-console-logs" ? "active" : ""}">
              <div class="d-flex">
                <button class="btn-icon btn-search-console">${Icons.search}</button>
                <div class="dropdown">
                  <button class="dropdown-trigger btn-icon">${Icons.filter}</button>
                  <div class="dropdown-content console-filter-levels">
                    <label><input type="checkbox" ${consoleFilterLevels.warn ? "checked" : ""} data-console-filter="warn" /> Warnings</label>
                    <label><input type="checkbox" ${consoleFilterLevels.error ? "checked" : ""} data-console-filter="error" /> Errors</label>
                    <label><input type="checkbox" ${consoleFilterLevels.debug ? "checked" : ""} data-console-filter="debug" /> Debug</label>
                    <label><input type="checkbox" ${consoleFilterLevels.info ? "checked" : ""} data-console-filter="info" /> Info</label>
                    <label><input type="checkbox" ${consoleFilterLevels.log ? "checked" : ""} data-console-filter="log" /> Logs</label>
                  </div>
                </div>
                <button class="btn-icon btn-clear-tab btn-clear-console-logs">${Icons.trash}</button>
              </div>

              <div class="console-search mt-2 ${consoleSearch ? "" : "d-none"}">
                <input type="search" class="console-search-input" value="${consoleSearch}" placeholder="Search console logs" />
              </div>
            </div>
            <div class="tab-action-bar tab-event-logs ${activeTab === "tab-event-logs" ? "active" : ""}">
              <button class="btn-icon btn-clear-tab btn-clear-events">${Icons.trash}</button>
            </div>
            <div class="tab-action-bar tab-native-stack ${activeTab === "tab-native-stack" ? "active" : ""}">
              <button class="btn-icon btn-reload-tab btn-reload-stack">${Icons.rotate}</button>
            </div>
          </div>
        </div>

        <div class="tab-contents">
          <div id="tab-bridge-components" class="outer-tab-content ${activeTab === "tab-bridge-components" ? "active" : ""}">
            <div class="inner-tab-content">
              <button class="collapse bridge-components-collapse-btn" type="button" data-collapse-target="bridge-components-collapse">
                Registered Bridge Components: <span class="bridge-components-amount">${this.state.supportedBridgeComponents.length}</span>
              </button>
              <div id="bridge-components-collapse">
                <div class="d-flex justify-content-between">
                  <div class="tab-content-bridge-components flex-grow-1"></div>
                  <button class="btn-icon btn-help btn-switch-to-single-tab-sheet mt-1" data-tab-id="single-tab-bridge-component-help">${Icons.questionMark}</button>
                </div>
              </div>

              <div class="tab-content-bridge-logs">
              </div>
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

          <div id="single-tab-bridge-component-help" class="single-tab-content outer-tab-content">
            <div class="inner-tab-content">
              <div class="d-flex align-items-center mb-3">
                <button class="btn-icon btn-close-single-mode">${Icons.arrowLeft}</button>
                <h3 class="ms-1">Bridge Components</h3>
              </div>
              <p>This list shows all the bridge components that the ${formattedPlatform()} app supports. Components that are active on this page are marked with a green dot.</p>
              <h3 class="mt-4">Why is my bridge component not on the list?</h3>
              <p class="mt-2">Bridge components are automatically detected when they are registered in the native code. If your component is not on the list, make sure it is registered correctly.</p>
              ${this.registerBridgeComponentExample()}
              <p class"mt-1">For more information, check out the documentation:</p>
              <a href="${this.registerBridgeComponentHelpURL()}">${this.registerBridgeComponentHelpURL()}</a>
            </div>
          </div>

          <div id="single-tab-settings" class="single-tab-content outer-tab-content">
            <div class="inner-tab-content">
              <div class="d-flex align-items-center mb-3">
                <button class="btn-icon btn-close-single-mode">${Icons.arrowLeft}</button>
                <h3 class="ms-1">Settings</h3>
              </div>
              <div class="mb-3">
                <label for="bottom-sheet-height"> Bottom Sheet Height</label>
                <input type="range" id="bottom-sheet-height" class="w-100" min="10" max="100" value="${this.sheetHeight}" step="1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    this.devTools.shadowRoot.appendChild(this.bottomSheet)
  }

  renderConsoleLogs() {
    const container = this.bottomSheet.querySelector(".tab-content-console-logs")
    const consoleFilterLevels = getConsoleFilterLevels()
    const consoleSearch = this.state.consoleSearch
    container.innerHTML = this.state.consoleLogs.length
      ? this.state.consoleLogs
          .filter((log) => consoleFilterLevels[log.type])
          .filter((log) => {
            if (!consoleSearch) return true
            return log.message.toLowerCase().includes(consoleSearch.toLowerCase())
          })
          .map((log) => this.consoleLogHTML(log.type, log.message, log.time))
          .join("")
      : `<div class="tab-empty-content"><span>No console logs yet</span></div>`
  }

  renderBridgeComponents() {
    const bridgeComponentsAmount = this.state.supportedBridgeComponents.length
    this.bottomSheet.querySelector(".bridge-components-amount").textContent = bridgeComponentsAmount

    const bridgeComponentIdentifiers = this.bridgeComponentIdentifiers
    const container = this.bottomSheet.querySelector(".tab-content-bridge-components")
    container.innerHTML = bridgeComponentsAmount
      ? this.state.supportedBridgeComponents.map((component) => `<div class="bridge-component ${bridgeComponentIdentifiers.includes(component) ? "connected" : ""}">${component}</div>`).join("")
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
    container.innerHTML =
      `<div class="native-stack-wrapper">` +
      (this.state.nativeStack.length ? this.state.nativeStack.map((view) => this.nativeViewStackHTML(view)).join("") : `<div class="tab-empty-content"><span>No native stack captured yet</span></div>`) +
      `</div>`
  }

  bridgeLogHTML(direction, componentName, eventName, eventArgs, time) {
    return `
      <div class="log-entry d-flex gap-3 pt-2 pb-2">
        <div class="log-entry-icon d-flex justify-content-center align-items-center">
          ${direction === "send" ? Icons.arrowDown : Icons.arrowUp}
        </div>
        <div class="w-100 overflow-auto">
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
    const wrapperClass = `viewstack-card ${activeClass} ${isMainView ? "main-view" : isHotwireView ? "hotwire-view" : isTabBar ? "tab-container" : "non-identified-view"}`

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

  switchToSingleTabSheet(singleTabId) {
    // Hide the top part and all tabs
    this.sheetContent.querySelector(".top-part").classList.add("d-none")
    this.devTools.shadowRoot.querySelectorAll(".outer-tab-content").forEach((tab) => tab.classList.remove("active"))

    // Show the single mode content
    this.devTools.shadowRoot.getElementById(singleTabId).classList.add("active")
  }

  switchToMultiTabSheet() {
    this.sheetContent.querySelector(".top-part").classList.remove("d-none")
    this.devTools.shadowRoot.querySelectorAll(".outer-tab-content").forEach((tab) => tab.classList.remove("active"))

    // Show the previous active tab
    this.devTools.shadowRoot.querySelectorAll(".tablink, .outer-tab-content").forEach((tab) => {
      if (tab.id == this.state.activeTab) {
        tab.classList.add("active")
      }
    })
  }

  registerBridgeComponentExample() {
    switch (platform()) {
      case "android":
        return `
<pre class="overflow-auto">
  Hotwire.registerBridgeComponents(
    BridgeComponentFactory("my-component", ::MyComponent)
  )
</pre>
`
      case "ios":
        return `
<pre class="overflow-auto">
  Hotwire.registerBridgeComponents([
      MyComponent.self
  ])
</pre>`
      default:
        return ""
    }
  }

  registerBridgeComponentHelpURL() {
    switch (platform()) {
      case "android":
        return "https://native.hotwired.dev/android/bridge-components"
      case "ios":
        return "https://native.hotwired.dev/ios/bridge-components"
      default:
        return "https://native.hotwired.dev"
    }
  }

  checkNativeFeatures() {
    if (this.state.supportsNativeStackView) {
      this.bottomSheet.querySelector(".tablink[data-tab-id='tab-native-stack']").classList.remove("d-none")
    }
  }

  addEventListeners() {
    if (this.bottomSheet.hasEventListeners) return

    // Click outside to close
    this.sheetOverlay.addEventListener("click", () => {
      this.hideBottomSheet()
      this.switchToMultiTabSheet()
    })

    // Tab Click
    this.bottomSheet.querySelector(".tablist").addEventListener("click", (event) => this.handleTabClick(event))

    // Action Buttons
    this.bottomSheet.querySelector(".btn-clear-console-logs").addEventListener("click", () => {
      this.devTools.state.clearConsoleLogs()
      this.renderConsoleLogs()
    })
    this.bottomSheet.querySelector(".btn-clear-bridge-logs").addEventListener("click", () => {
      this.devTools.state.clearBridgeLogs()
      this.renderBridgeLogs()
    })
    this.bottomSheet.querySelector(".btn-clear-events").addEventListener("click", () => {
      this.devTools.state.clearEventLogs()
      this.renderEvents()
    })
    this.bottomSheet.querySelector(".btn-reload-stack").addEventListener("click", () => {
      this.bottomSheet.querySelector(".native-stack-wrapper").style.opacity = 0.5
      this.devTools.refetchNativeStack()
    })

    // Switch to Single Tab Buttons
    this.bottomSheet.querySelectorAll(".btn-switch-to-single-tab-sheet").forEach((button) => {
      button.addEventListener("click", (event) => {
        const singleTabId = event.target.closest("[data-tab-id]").dataset.tabId
        if (!singleTabId) return
        this.switchToSingleTabSheet(singleTabId)
      })
    })

    // Close Single Tab Buttons
    this.bottomSheet.querySelectorAll(".btn-close-single-mode").forEach((button) => {
      button.addEventListener("click", () => {
        this.switchToMultiTabSheet()
      })
    })

    // Dragging
    this.bottomSheet.querySelector(".top-part").addEventListener("touchstart", this.dragStart.bind(this), { passive: true })
    this.bottomSheet.addEventListener("touchmove", this.dragging.bind(this), { passive: true })
    this.bottomSheet.addEventListener("touchend", this.dragStop.bind(this), { passive: true })

    // Filters
    this.bottomSheet.querySelector(".console-filter-levels").addEventListener("click", ({ target }) => {
      const checkbox = target.closest("input[type='checkbox']")
      if (!checkbox) return

      const filterType = checkbox.dataset.consoleFilter
      const isActive = checkbox.checked

      saveConsoleFilterLevels(filterType, isActive)
      this.renderConsoleLogs()
    })

    this.bottomSheet.querySelector(".btn-search-console").addEventListener("click", () => {
      const searchInput = this.bottomSheet.querySelector(".console-search")
      searchInput.classList.toggle("d-none")
      searchInput.querySelector("input").focus()
    })

    this.bottomSheet.querySelector(".console-search-input").addEventListener("input", (event) => {
      this.devTools.state.setConsoleSearchValue(event.target.value.toLowerCase())
      this.renderConsoleLogs()
    })

    // Settings
    this.bottomSheet.querySelector("#bottom-sheet-height").addEventListener("change", (event) => {
      const value = event.target.value
      this.sheetHeight = value
      saveSettings("bottomSheetHeight", value)
      this.updateSheetHeight(value)
    })
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

    // Close dropdown if click is outside
    this.bottomSheet.addEventListener("click", (e) => {
      const openDropdowns = this.bottomSheet.querySelectorAll(".dropdown-content.dropdown-open")
      openDropdowns.forEach((dropdown) => {
        const dropdownContainer = dropdown.closest(".dropdown")
        if (!dropdownContainer.contains(e.target)) {
          dropdown.classList.remove("dropdown-open")
        }
      })
    })

    // Open dropdown
    this.bottomSheet.addEventListener("click", (e) => {
      const trigger = e.target.closest(".dropdown-trigger")
      if (trigger) {
        e.preventDefault()
        this.toggleDropdown(trigger)
      }
    })

    this.bottomSheet.hasEventListeners = true
  }

  toggleDropdown(triggerElement) {
    const dropdownContent = triggerElement.nextElementSibling || triggerElement.closest(".dropdown").querySelector(".dropdown-content")
    // Close other dropdowns first
    this.bottomSheet.querySelectorAll(".dropdown-content.dropdown-open").forEach((el) => {
      if (el !== dropdownContent) {
        el.classList.remove("dropdown-open")
      }
    })
    dropdownContent.classList.toggle("dropdown-open")
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
    this.devTools.shadowRoot.querySelectorAll(".tablink, .outer-tab-content").forEach((tab) => tab.classList.remove("active"))

    // Hide all Action Bars
    this.devTools.shadowRoot.querySelectorAll(".tab-action-bar").forEach((tab) => tab.classList.remove("active"))

    // Show the clicked tab
    this.devTools.shadowRoot.querySelector(`[data-tab-id="${tabId}"]`).classList.add("active")
    this.devTools.shadowRoot.getElementById(tabId).classList.add("active")

    // Show the action bar for the clicked tab
    this.devTools.shadowRoot.querySelector(`.tab-action-bar.${tabId}`).classList.add("active")
  }

  showBottomSheet() {
    this.bottomSheet.classList.add("show")
    document.body.style.overflow = "hidden"
    this.updateSheetHeight(this.sheetHeight)
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
    const draggingThreshold = 10 // Defines how much the user needs to drag to trigger the hide/show
    const currentHeight = parseInt(this.sheetContent.style.height)

    const minThreshold = Math.max(0, this.sheetHeight - draggingThreshold)
    const maxThreshold = Math.min(100, this.sheetHeight + draggingThreshold)

    if (currentHeight < minThreshold) {
      this.hideBottomSheet()
    } else if (currentHeight > maxThreshold) {
      this.updateSheetHeight(100)
    } else {
      this.updateSheetHeight(this.sheetHeight)
    }
  }

  // Helper function to log messages, without causing a rerender of the bottom sheet
  // (Messages with a `HotwireDevTools` prefix will not be logged in the bottom sheet)
  log(message) {
    console.log(`HotwireDevTools: ${message}`)
  }

  // Get all the `static component = "..."` from the bridge components
  get bridgeComponentIdentifiers() {
    return window.Stimulus?.controllers.map((controller) => controller.component).filter((component) => component !== undefined) || []
  }

  get currentUrl() {
    return window.location.href
  }
}
