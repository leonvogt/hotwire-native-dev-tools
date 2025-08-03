import * as Icons from "../assets/icons"
import { platform, formattedPlatform, getMetaContent, debounce } from "../utils/utils"
import { saveSettings, getSettings, getConsoleFilterLevels, saveConsoleFilterLevels, getConsoleLogBlacklist, addConsoleLogBlacklistEntry, removeConsoleLogBlacklistEntry } from "../utils/settings"

// WARNING: Be careful when console logging in this file, as it can cause an infinite loop
// When you need to debug, use the `log` helper function like this:
// this.log("message")
// or turn off the console proxy in DevTools.js

export default class BottomSheet {
  constructor(devTools) {
    this.devTools = devTools
    this.state = devTools.state.state
    this.sheetHeight = parseInt(getSettings("bottomSheetHeight")) || 55
  }

  render() {
    this.createBottomSheet()
    this.sheetContent = this.bottomSheet.querySelector(".content")
    this.sheetOverlay = this.bottomSheet.querySelector(".sheet-overlay")
    this.addEventListeners()
  }

  // Called when the in-memory state changes,
  // such as when a new console or bridge log is captured.
  update(newState) {
    this.state = newState
    this.checkNativeFeatures()
    this.renderConsoleLogs()
    this.renderBridgeComponents()
    this.renderBridgeLogs()
    this.renderEvents()
    this.renderNativeStack()
    this.scrollToLatestLog(this.state.activeTab)
    this.state.shouldScrollToLatestLog = true
  }

  // Called when another native tab of the mobile app
  // updates devtools-related local storage.
  applySettingsFromStorage() {
    const settings = [
      { key: "bottomSheetHeight", setter: (value) => this.updateSheetHeight(value) },
      { key: "activeTab", setter: (value) => this.updateTabView(value) },
      { key: "fontSize", setter: (value) => this.updateFontSize(value) },
      { key: "errorAnimationEnabled", setter: (value) => this.updateErrorAnimation(value) },
      { key: "autoOpen", setter: (value) => this.updateAutoOpen(value) },
    ]
    settings.forEach(({ key, setter }) => {
      const storedValue = getSettings(key)
      if (storedValue !== undefined) setter(storedValue)
    })

    const storedConsoleFilterLevels = getConsoleFilterLevels()
    if (storedConsoleFilterLevels) {
      this.updateConsoleFilter(storedConsoleFilterLevels)
    }
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
      <div class="sheet-overlay ${getSettings("bottomSheetPinned") === true ? "" : "active"}"></div>
      <div class="content">
        <div class="top-part">
          <div class="tablist">
            <button class="tablink ${activeTab === "tab-bridge-components" ? "active" : ""}" data-tab-id="tab-bridge-components">Bridge</button>
            <button class="tablink ${activeTab === "tab-console-logs" ? "active" : ""}" data-tab-id="tab-console-logs">Console</button>
            <button class="tablink ${activeTab === "tab-event-logs" ? "active" : ""}" data-tab-id="tab-event-logs">Events</button>
            <button class="tablink ${activeTab === "tab-native-stack" ? "active" : ""} d-none" data-tab-id="tab-native-stack">Stack</button>
            <div class="tablink-settings dropdown d-flex">
              <button class="dropdown-trigger tablink-dropdown">${Icons.threeDotsVertical}</button>
              <div class="dropdown-content settings-dropdown">
                <button class="dropdown-btn-full-width btn-switch-to-single-tab-sheet" data-tab-id="single-tab-settings">Settings</button>
                <button class="dropdown-btn-full-width btn-switch-to-single-tab-sheet" data-tab-id="single-tab-info">Info</button>
                <button class="dropdown-btn-full-width btn-switch-to-single-tab-sheet d-none" data-tab-id="single-tab-path-configuration-check">PathConfiguration Check</button>
                <button class="dropdown-btn-full-width pin-bottom-sheet">Pin Bottom Sheet</button>
              </div>
            </div>
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
                <div class="dropdown dropdown--scrollable">
                  <button class="dropdown-trigger btn-icon">${Icons.ban}</button>
                  <div class="dropdown-content console-log-blacklist">
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
              <div id="bridge-components-collapse" class="collapse-target">
                <div class="d-flex justify-content-between border-bottom">
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
                <label for="bottom-sheet-height-setting"> Bottom Sheet Height</label>
                <input type="range" id="bottom-sheet-height-setting" class="w-100" min="10" max="100" value="${this.sheetHeight}" step="1" list="bottom-sheet-height-setting-markers" />
                <datalist id="bottom-sheet-height-setting-markers">
                  <option value="55"></option>
                </datalist>
              </div>
              <div class="mb-4">
                <label for="font-size-setting"> Font Size</label>
                <input type="range" id="font-size-setting" class="w-100" min="8" max="24" value="${getSettings("fontSize") || 16}" step="1" list="font-size-setting-markers" />
                <datalist id="font-size-setting-markers">
                  <option value="16"></option>
                </datalist>
              </div>
              <div class="mb-3">
                <label class="toggle">
                  <input class="toggle-checkbox" type="checkbox" id="console-error-animation-setting" ${getSettings("errorAnimationEnabled") !== false ? "checked" : ""} />
                  <div class="toggle-switch"></div>
                  <span class="toggle-label">Console Error Animation</span>
                </label>
              </div>
              <div class="mb-3">
                <label class="toggle">
                  <input class="toggle-checkbox" type="checkbox" id="auto-open-setting" ${getSettings("autoOpen") === true ? "checked" : ""} />
                  <div class="toggle-switch"></div>
                  <span class="toggle-label">Auto Open</span>
                </label>
              </div>
              <div class="mb-3">
                <label class="toggle">
                  <input class="toggle-checkbox" type="checkbox" id="scroll-to-latest-log-setting" ${getSettings("scrollToLatestLog") === true ? "checked" : ""} />
                  <div class="toggle-switch"></div>
                  <span class="toggle-label">Automatically Scroll to New Logs</span>
                </label>
              </div>
            </div>
          </div>

          <div id="single-tab-path-configuration-check" class="single-tab-content outer-tab-content">
            <div class="inner-tab-content">
              <div class="d-flex align-items-center mb-3">
                <button class="btn-icon btn-close-single-mode">${Icons.arrowLeft}</button>
                <h3 class="ms-1">PathConfiguration Check</h3>
              </div>
              <div class="mb-3">
                <label for="path-configuration-check-url">URL</label>
                <input id="path-configuration-check-url" class="w-100" value="/" />
              </div>
              <div id="path-configuration-check-properties-output" class="overflow-auto">
              </div>
            </div>
          </div>

          <div id="single-tab-info" class="single-tab-content outer-tab-content">
            <div class="inner-tab-content">
              <div class="d-flex align-items-center mb-3">
                <button class="btn-icon btn-close-single-mode">${Icons.arrowLeft}</button>
                <h3 class="ms-1">Info</h3>
              </div>
              <div class="info-card">
                <div class="info-card-title">Current URL</div>
                <div class="current-url">${this.currentUrl}</div>
              </div>
              <div class="info-card">
                <div class="info-card-title">User Agent</div>
                <div class="user-agent">${navigator.userAgent}</div>
              </div>
              <div class="info-card">
                <div class="info-card-title"><pre class="m-0">turbo-cache-control:</pre> <span>${getMetaContent("turbo-cache-control") || "-"}</span></div>
                <div class="info-card-hint"><strong>no-cache:</strong> always fetched from the network, even on restore</div>
                <div class="info-card-hint"><strong>no-preview:</strong> skipped in preview, used only on restore</div>
                <div class="info-card-hint"><strong>unset:</strong> shows cached preview if the cache is valid</div>
              </div>
              <div class="info-card">
                <div class="info-card-title"><pre class="m-0">turbo-refresh-method:</pre> <span>${getMetaContent("turbo-refresh-method") || "-"}</span></div>
                <div class="info-card-hint"><strong>replace (default):</strong> replaces the entire &lt;body&gt; on revisit</div>
                <div class="info-card-hint"><strong>morph:</strong> updates only changed DOM elements, preserving state</div>
              </div>
              <div class="info-card">
                <div class="info-card-title"><pre class="m-0">turbo-visit-control:</pre> <span>${getMetaContent("turbo-visit-control") || "-"}</span></div>
                <div class="info-card-hint"><strong>reload:</strong> forces a full page reload</div>
                <div class="info-card-hint"><strong>unset:</strong> allows Turbo to handle the visit normally</div>
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
    const consoleLogBlacklist = getConsoleLogBlacklist()
    const consoleSearch = this.state.consoleSearch
    container.innerHTML = this.state.consoleLogs.length
      ? this.state.consoleLogs
          .filter((log) => consoleFilterLevels[log.type])
          .filter((log) => {
            if (!consoleSearch) return true
            return log.message.toLowerCase().includes(consoleSearch.toLowerCase())
          })
          .filter((log) => !consoleLogBlacklist.includes(log.message.trim()))
          .map((log) => this.consoleLogHTML(log.type, log.message, log.time))
          .join("")
      : `<div class="tab-empty-content"><span>No console logs yet</span></div>`
    this.renderConsoleBlacklist()
  }

  renderConsoleBlacklist() {
    this.bottomSheet.querySelector(".console-log-blacklist").innerHTML = getConsoleLogBlacklist().length
      ? `
      ${getConsoleLogBlacklist()
        .map(
          (entry) => `
            <div class="d-flex justify-content-between align-items-center dropdown-entry">
              <label class="console-log-blacklist-entry-text">${entry}</label>
              <button class="btn-icon btn-remove-console-log-blacklist-entry icon--muted dropdown-content-action w-auto" data-entry="${entry}">${Icons.trash}</button>
            </div>
          `
        )
        .join("")}`
      : `<div class="text-center text-muted">No blacklisted logs</div>`
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
          this.state.bridgeIsConnected ? "No bridge communication yet" : "Bridge is not connected <br><small>(Neither window.HotwireNative nor window.Strada is defined)</small>"
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

  renderPathConfigurationCheck = debounce((path) => {
    const url = window.location.origin + path
    this.devTools.nativeBridge.send("propertiesForUrl", { url }, (message) => {
      this.bottomSheet.querySelector("#path-configuration-check-properties-output").style.opacity = 1
      const pathConfigurationPropertiesJson = (() => {
        try {
          const props = message.data.properties
          return JSON.stringify(typeof props === "string" ? JSON.parse(props) : props, null, 2)
        } catch {
          return message.data.properties
        }
      })()
      const pathConfigurationProperties = pathConfigurationPropertiesJson ? `<pre class="view-path-configuration">${pathConfigurationPropertiesJson}</pre>` : ""
      const outputContainer = this.bottomSheet.querySelector("#path-configuration-check-properties-output")
      outputContainer.innerHTML = pathConfigurationProperties
    })
  }, 500)

  bridgeLogHTML(direction, componentName, eventName, eventArgs, time) {
    return `
      <div class="log-entry d-flex gap-3 pt-2 pb-2">
        <div class="log-entry-icon d-flex justify-content-center align-items-center">
          ${direction === "send" ? Icons.arrowDown : Icons.arrowUp}
        </div>
        <div class="w-100 overflow-auto">
          <div class="d-flex justify-content-between">
            <strong class="w-80 break-word">${componentName}#${eventName}</strong>
            <small>${time}</small>
          </div>
          <div class="overflow-auto">
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
          <div class="d-flex justify-content-between">
            <div class="log-entry-message ${type}">
              ${message}
            </div>
            <div class="dropdown dropdown--right">
              <button class="dropdown-trigger btn-icon">${Icons.threeDotsVertical}</button>
              <div class="dropdown-content">
                <button class="dropdown-btn-full-width dropdown-content-action console-log-action-hide-console-log">Ignore this log</button>
                <button class="dropdown-btn-full-width dropdown-content-action console-log-action-copy-console-log">Copy log message</button>
              </div>
            </div>
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
    const removeTrailingSlash = (url) => {
      return url?.replace(/\/+$/, "")
    }
    const isMainView = ["UINavigationController", "NavigatorHost"].includes(view.type)
    const isTabBar = view.type === "UITabBarController"
    const isHotwireView = ["VisitableViewController", "HotwireWebFragment", "BackStackEntry"].includes(view.type)
    const activeClass = removeTrailingSlash(view.url) === removeTrailingSlash(this.currentUrl) ? "current-view" : ""
    const wrapperClass = `viewstack-card ${activeClass} ${isMainView ? "main-view" : isHotwireView ? "hotwire-view" : isTabBar ? "tab-container" : "non-identified-view"}`
    const uniqueViewId = "viewstack-" + Math.random().toString(16).slice(2)

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

    const pathConfigurationPropertiesJson = (() => {
      try {
        const props = view.pathConfigurationProperties
        return JSON.stringify(typeof props === "string" ? JSON.parse(props) : props, null, 2)
      } catch {
        return view.pathConfigurationProperties
      }
    })()
    const pathConfigurationProperties = pathConfigurationPropertiesJson ? `<pre class="view-path-configuration">${pathConfigurationPropertiesJson}</pre>` : ""

    const childrenHTML = view.children?.length
      ? `<div class="child-container">
          ${view.children.map((child) => this.nativeViewStackHTML(child)).join("")}
         </div>`
      : ""

    return `
      <div>
        <div class="${wrapperClass} collapse no-chevron" data-collapse-target="path-configuration-properties-${uniqueViewId}">
          <div>
            <div class="view-title">
              ${view.title == "null" ? "" : view.title}
              <div class="view-title-details">${view.type}</div>
            </div>
            ${urlPath}
          </div>
          <div id="path-configuration-properties-${uniqueViewId}" class="collapse-target">
            ${pathConfigurationProperties}
          </div>
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
      this.bottomSheet.querySelector(".btn-switch-to-single-tab-sheet[data-tab-id='single-tab-path-configuration-check']").classList.remove("d-none")
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
        if (singleTabId === "single-tab-path-configuration-check" && this.bottomSheet.querySelector("#path-configuration-check-url").value === "/") {
          this.renderPathConfigurationCheck("/")
        }
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
    this.bottomSheet.querySelector("#bottom-sheet-height-setting").addEventListener("change", (event) => {
      const value = event.target.value
      this.sheetHeight = parseInt(value)
      saveSettings("bottomSheetHeight", value)
      this.updateSheetHeight(value)
    })

    this.bottomSheet.querySelector("#console-error-animation-setting").addEventListener("change", (event) => {
      saveSettings("errorAnimationEnabled", event.target.checked)
    })

    this.bottomSheet.querySelector("#font-size-setting").addEventListener("change", (event) => {
      let value = event.target.value
      value = Math.max(8, Math.min(24, value))
      saveSettings("fontSize", value)
      this.devTools.setCSSProperty("--font-size", `${value}px`)
    })

    this.bottomSheet.querySelector("#auto-open-setting").addEventListener("change", (event) => {
      saveSettings("autoOpen", event.target.checked)
    })

    this.bottomSheet.querySelector("#scroll-to-latest-log-setting").addEventListener("change", (event) => {
      saveSettings("scrollToLatestLog", event.target.checked)
    })

    this.bottomSheet.querySelector(".pin-bottom-sheet").addEventListener("click", () => {
      const isPinned = getSettings("bottomSheetPinned") === true
      saveSettings("bottomSheetPinned", !isPinned)
      this.sheetOverlay.classList.toggle("active")
      this.bottomSheet.querySelector(".settings-dropdown").classList.remove("dropdown-open")
    })

    this.bottomSheet.querySelector("#path-configuration-check-url").addEventListener("input", (event) => {
      this.bottomSheet.querySelector("#path-configuration-check-properties-output").style.opacity = 0.5
      this.renderPathConfigurationCheck(event.target.value)
    })

    this.bottomSheet.addEventListener("click", (event) => {
      // Handle collapsible elements
      const collapsible = event.target.closest(".collapse")
      if (collapsible && this.bottomSheet.contains(collapsible)) {
        const targetId = collapsible.getAttribute("data-collapse-target")
        const targetElement = this.bottomSheet.querySelector(`#${targetId}`)
        if (targetElement) {
          const isActive = collapsible.classList.toggle("active")
          targetElement.classList.toggle("active", isActive)
        }
        return
      }

      // Handle dropdown triggers
      const trigger = event.target.closest(".dropdown-trigger")
      if (trigger) {
        event.preventDefault()
        this.toggleDropdown(trigger)
        return
      }

      // Handle dropdown actions
      const dropdownAction = event.target.closest(".dropdown-content-action")
      if (dropdownAction) {
        this.handleDropdownActionClick(event)
        return
      }

      // Close dropdowns when clicking outside
      this.closeAllDropdowns(event)
    })

    this.bottomSheet.hasEventListeners = true
  }

  closeAllDropdowns(event) {
    const openDropdowns = this.bottomSheet.querySelectorAll(".dropdown-content.dropdown-open")
    openDropdowns.forEach((dropdown) => {
      const dropdownContainer = dropdown.closest(".dropdown")
      if (!dropdownContainer.contains(event.target)) {
        dropdown.classList.remove("dropdown-open")
      }
    })
  }

  updateConsoleFilter(consoleFilterLevels) {
    this.bottomSheet.querySelectorAll(".console-filter-levels input[type='checkbox']").forEach((checkbox) => {
      const filterType = checkbox.dataset.consoleFilter
      const isActive = consoleFilterLevels[filterType]
      checkbox.checked = isActive
    })
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

  handleDropdownActionClick = (event) => {
    const action = event.target.closest(".dropdown-content-action")
    if (!action) return
    if (action.classList.contains("console-log-action-hide-console-log")) {
      addConsoleLogBlacklistEntry(action.closest(".log-entry").querySelector(".log-entry-message").textContent)
      this.renderConsoleLogs()
    } else if (action.classList.contains("console-log-action-copy-console-log")) {
      const logEntry = action.closest(".log-entry")
      const message = logEntry.querySelector(".log-entry-message").textContent
      navigator.clipboard.writeText(message).then(() => {
        this.closeAllDropdowns(event)
      })
    } else if (action.classList.contains("btn-remove-console-log-blacklist-entry")) {
      removeConsoleLogBlacklistEntry(action.dataset.entry.trim())
      this.renderConsoleLogs()
    }
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

    // Scroll to the latest log in the clicked tab
    if (this.state.shouldScrollToLatestLog) {
      this.scrollToLatestLog(tabId)

      // Reset the flag to avoid scrolling on every tab switch without new logs
      this.state.shouldScrollToLatestLog = false
    }
  }

  scrollToLatestLog(tabId) {
    if (getSettings("scrollToLatestLog") != true) return

    requestAnimationFrame(() => {
      const tabContainer = this.devTools.shadowRoot.getElementById(tabId)
      const latestLog = tabContainer?.querySelector(".log-entry:last-child")
      latestLog?.scrollIntoView({ behavior: "instant", block: "center" })
    })
  }

  showBottomSheet() {
    if (this.bottomSheet.classList.contains("show")) return
    this.bottomSheet.classList.add("show")
    this.originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    this.updateSheetHeight(this.sheetHeight)
  }

  hideBottomSheet() {
    this.bottomSheet.classList.remove("show")
    document.body.style.overflow = this.originalOverflow
  }

  updateSheetHeight(height) {
    this.sheetContent.style.height = `${height}vh`
    this.bottomSheet.classList.toggle("fullscreen", height === 100)
  }

  dragStart(event) {
    this.isDragging = true
    this.startY = event.pageY || event.touches?.[0].pageY
    this.startHeight = parseInt(this.sheetContent.style.height)
    this.bottomSheet.classList.add("dragging")
  }

  dragging(event) {
    if (!this.isDragging) return
    const delta = this.startY - (event.pageY || event.touches?.[0].pageY)
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

  updateFontSize(value) {
    this.devTools.setCSSProperty("--font-size", `${value}px`)
    this.bottomSheet.querySelector("#font-size-setting").value = value
  }

  updateErrorAnimation(value) {
    this.bottomSheet.querySelector("#console-error-animation-setting").checked = value
  }

  updateAutoOpen(value) {
    this.bottomSheet.querySelector("#auto-open-setting").checked = value
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
