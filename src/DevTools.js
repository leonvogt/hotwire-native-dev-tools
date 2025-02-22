import DevToolsState from "./DevToolsState"
import DebugBubble from "./DebugBubble"
import BottomSheet from "./BottomSheet"
import CustomBridge from "./bridge/CustomBridge"

export default class DevTools {
  constructor() {
    this.state = new DevToolsState()
    this.bubble = new DebugBubble(this)
    this.bottomSheet = new BottomSheet(this)
    this.customBridge = new CustomBridge(this)
    this.state.subscribe(this.update.bind(this))
    this.listenForTurboEvents()
  }

  // Setup gets called initially and on every turbo:load event, eg. when navigating to a new page
  setup() {
    this.setupShadowRoot()
    this.bottomSheet.render()
    this.bubble.render()

    // Add Console Proxy
    if (!this.originalConsole) {
      this.originalConsole = window.console
      this.addConsoleProxy()
    }

    // Add Bridge Component Proxy
    if (!this.originalBridge && window.Strada) {
      this.originalBridge = window.Strada.web
      this.addBridgeProxy()
    } else if (!this.originalBridge) {
      document.addEventListener("web-bridge:ready", () => {
        if (!this.originalBridge) {
          this.originalBridge = window.Strada.web
          this.addBridgeProxy()
        }
      })
    }

    this.bubble.onClick((event) => {
      this.bottomSheet.showBottomSheet()
    })

    this.bottomSheet.showBottomSheet()
  }

  update(newState) {
    this.bottomSheet.update(newState)
  }

  setupShadowRoot() {
    if (this.shadowContainer.shadowRoot) {
      this.shadowRoot = this.shadowContainer.shadowRoot
      this.injectCSSToShadowRoot()
      return
    }
    this.shadowRoot = this.shadowContainer.attachShadow({ mode: "open" })
    this.injectCSSToShadowRoot()
  }

  addBridgeProxy() {
    window.Strada.web = new Proxy(this.originalBridge, {
      get: (target, prop, receiver) => {
        const originalValue = Reflect.get(target, prop, receiver)

        // We are only interested in the `send` and `receive` functions
        if (typeof originalValue === "function" && (prop === "send" || prop === "receive")) {
          return (...args) => {
            this.interceptedBridgeMessage(prop, args)
            return originalValue.apply(target, args)
          }
        }

        // Forward all the other calls to the original bridge
        return (...args) => {
          return originalValue.apply(target, args)
        }
      },
    })
  }

  addConsoleProxy() {
    window.console = new Proxy(this.originalConsole, {
      get: (target, prop, receiver) => {
        const originalValue = Reflect.get(target, prop, receiver)
        return (...args) => {
          this.interceptedConsoleMessage(prop, args)
          return originalValue.apply(target, args)
        }
      },
    })
  }

  interceptedBridgeMessage(direction, args) {
    args.forEach((arg) => {
      const componentName = arg.component
      const eventName = arg.event
      const { metadata, ...eventArgs } = arg.data // Remove metadata from the args

      this.state.addBridgeLog(direction, componentName, eventName, eventArgs)
    })
  }

  interceptedConsoleMessage(type, args) {
    const message = args
      .map((arg) => {
        if (typeof arg === "object") {
          try {
            return `<pre>${JSON.stringify(arg, null, 2)}</pre>`
          } catch {
            return `<pre>${arg}</pre>`
          }
        }
        return arg.toString()
      })
      .join(" ")

    this.state.addConsoleLog(type, message)
  }

  fetchNativeStack() {
    this.customBridge.send("currentStackInfo", {}, (message) => {
      const stack = JSON.parse(message.data.stack)
      this.state.setNativeStack(stack)
    })
  }

  injectCSSToShadowRoot = async () => {
    if (this.shadowRoot.querySelector("style")) return

    const style = document.createElement("style")
    style.textContent = this.cssContent
    this.shadowRoot.appendChild(style)
  }

  listenForTurboEvents() {
    if (this.eventsRegistered) return

    const turboEvents = [
      "turbo:click",
      "turbo:before-visit",
      "turbo:visit",
      "turbo:before-cache",
      "turbo:before-render",
      "turbo:render",
      "turbo:load",
      "turbo:morph",
      "turbo:before-morph-element",
      "turbo:before-morph-attribute",
      "turbo:morph-element",
      "turbo:submit-start",
      "turbo:submit-end",
      "turbo:before-frame-render",
      "turbo:frame-render",
      "turbo:frame-load",
      "turbo:frame-missing",
      "turbo:before-stream-render",
      "turbo:before-fetch-request",
      "turbo:before-fetch-response",
      "turbo:before-prefetch",
      "turbo:fetch-request-error",
    ]

    turboEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        (event) => {
          this.state.addEventLog(eventName)
        },
        { passive: true }
      )
    })

    this.eventsRegistered = true
  }

  get shadowContainer() {
    const existingShadowContainer = document.getElementById("hotwire-native-dev-tools-shadow-container")
    if (existingShadowContainer) {
      return existingShadowContainer
    }
    const shadowContainer = document.createElement("div")
    shadowContainer.id = "hotwire-native-dev-tools-shadow-container"
    document.body.appendChild(shadowContainer)
    return shadowContainer
  }

  get currentTime() {
    return new Date().toLocaleTimeString()
  }

  // Not ideal, but I didn't found a way to load the CSS from a file, without dependencies
  // Content is copied from dist/styles.css
  get cssContent() {
    return `
      :host {
        all: initial;
        font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        font-size: 16px !important;
      }

      * {
        box-sizing: border-box;
      }

      /* Debug bubble */
      #debug-bubble {
        display: flex;
        width: 4.75rem;
        height: 4.75rem;
        background-color: hsl(0deg 0% 0% / 60%);
        border: 0.3rem solid rgba(136, 136, 136, 0.5);
        border-radius: 50%;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        z-index: 10000000;

        /* Inital position */
        position: fixed;
        bottom: 10px;
        right: 10px;
      }

      #debug-bubble svg {
        transform: scale(0.6);
        fill: #b1b1b1;
      }

      /* Bottom Sheet */
      .bottom-sheet {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        opacity: 0;
        pointer-events: none;
        align-items: center;
        flex-direction: column;
        justify-content: flex-end;
        transition: 0.1s linear;
        z-index: 10000001;
      }

      .bottom-sheet .sheet-overlay {
        position: fixed;
        top: 0;
        left: 0;
        z-index: -1;
        width: 100%;
        height: 100%;
        opacity: 0.2;
        background: #000;
      }

      .bottom-sheet .content {
        width: 100%;
        position: relative;
        color: white;
        max-height: 100vh;
        height: 40vh;
        transform: translateY(100%);
        border-radius: 12px 12px 0 0;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.03);
        transition: 0.3s ease;

        height: 100%;
        overflow-y: auto;
        scrollbar-width: none;
      }

      .bottom-sheet .content::-webkit-scrollbar {
        width: 0;
      }

      .bottom-sheet .log-entry {
        border-bottom: 1px solid #6c6c6c;
      }

      .bottom-sheet .log-entry-icon svg {
        width: 1rem;
        fill: white;
      }

      .bottom-sheet.show {
        opacity: 1;
        pointer-events: auto;
      }

      .bottom-sheet.show .content {
        transform: translateY(0%);
      }

      .bottom-sheet .log-entry-message.warn {
        color: #f39c12;
      }

      .bottom-sheet .log-entry-message.error {
        color: #ED4E4C;
      }

      .bottom-sheet .tab-action-bar {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #6c6c6c;
        padding: 0.5rem;
      }

      .bottom-sheet .tab-action-bar button {
        background-color: transparent;
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .bottom-sheet .btn-clear-tab,
      .bottom-sheet .btn-reload-tab {
        margin-left: auto;
      }
      .bottom-sheet .btn-clear-tab svg,
      .bottom-sheet .btn-reload-tab svg {
        width: 1rem;
        height: 1rem;
        fill: white;
      }

      /* Tabs */
      .tablist {
        display: flex;
        overflow: hidden;
        border: 1px solid #ccc;
        background-color: #ccc;
        position: sticky;
        top: 0;
      }

      .tablist button {
        color: black;
        background-color: inherit;
        width: 100%;
        border: none;
        outline: none;
        padding: 14px 16px;
        user-select: none;
        -webkit-user-select: none;
      }

      .tablist button:active, .tablist button.active {
        background-color: #f1f1f1;
      }

      .tab-contents {
        height: 100%;
      }

      .outer-tab-content {
        min-height: 100%;
        background-color: hsl(0deg 0% 0% / 80%);
        display: none;
        border-top: none;
      }
      .outer-tab-content.active {
        display: block;
      }
      .inner-tab-content {
        padding: 1rem;
        overflow-x: auto;
        white-space: nowrap;
      }

      .tab-empty-content {
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;
        padding: 1em;
      }

      /* Utility classes */
      .d-flex {
        display: flex;
      }

      .align-center {
        align-items: center;
      }

      .justify-center {
        justify-content: center;
      }

      .justify-between {
        justify-content: space-between;
      }

      .justify-end {
        justify-content: flex-end;
      }

      .no-wrap {
        overflow: hidden;
        white-space: nowrap;
      }

      .gap-1 {
        gap: 0.25rem;
      }

      .gap-2 {
        gap: 0.5rem;
      }

      .gap-3 {
        gap: 1rem;
      }

      .gap-4 {
        gap: 1.5rem;
      }

      .mb-1 {
        margin-bottom: 0.25rem;
      }

      .mb-2 {
        margin-bottom: 0.5rem;
      }

      .mb-3 {
        margin-bottom: 1rem;
      }

      .pb-1 {
        padding-bottom: 0.25rem;
      }

      .pb-2 {
        padding-bottom: 0.5rem;
      }

      .pb-3 {
        padding-bottom: 1rem;
      }

      .pt-1 {
        padding-top: 0.25rem;
      }

      .pt-2 {
        padding-top: 0.5rem;
      }

      .pt-3 {
        padding-top: 1rem;
      }

      .w-100 {
        width: 100%;
      }
    `
  }
}
