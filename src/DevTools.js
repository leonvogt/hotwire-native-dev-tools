import DevToolsState from "./DevToolsState"
import DebugBubble from "./DebugBubble"
import BottomSheet from "./BottomSheet"
import CustomBridge from "./bridge/CustomBridge"
import { debounce } from "./utils/utils"

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
  setup = debounce(() => {
    this.setupShadowRoot()
    this.bottomSheet.render()
    this.bubble.render()

    // Add Console Proxy
    if (!this.originalConsole) {
      this.originalConsole = window.console
      this.addConsoleProxy()
    }

    // Add Bridge Proxy and call the native DevTools bridge component
    if (this.originalBridge) {
      // Bridge Proxy is already added
      this.callNativeBridgeComponent()
    } else if (window.Strada) {
      // Bridge exists -> Add Bridge Proxy
      this.nativeBridgeGotConnected()
    } else {
      // Bridge does not exist yet -> Listen for the event
      document.addEventListener("web-bridge:ready", () => {
        this.nativeBridgeGotConnected()
      })
    }

    this.bubble.onClick((event) => {
      this.bottomSheet.showBottomSheet()
    })
  }, 200)

  nativeBridgeGotConnected() {
    if (this.originalBridge) return

    this.originalBridge = window.Strada.web
    this.addBridgeProxy()
    this.state.setBridgeIsConnected(true)
    this.callNativeBridgeComponent()
  }

  callNativeBridgeComponent() {
    if (this.customBridge.bridgeIsConnected()) {
      this.customBridge.send("connect", {}, (message) => {
        // If this callback gets executed, it means the native counterpart
        // of the dev tools are installed and running.
        this.fetchNativeStack()
      })
    }
  }

  update = debounce((newState) => {
    this.bottomSheet.update(newState)
  }, 200)

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

      if (componentName !== "dev-tools") {
        // We don't want to log our own messages
        this.state.addBridgeLog(direction, componentName, eventName, eventArgs)
      }
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

  fetchNativeStack = debounce(() => {
    this.customBridge.send("currentStackInfo", {}, (message) => {
      this.state.setSupportsNativeStack(true)
      this.state.setNativeStack(message.data.stack)
    })
  }, 200)

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
    shadowContainer.setAttribute("data-native-prevent-pull-to-refresh", "")
    document.body.appendChild(shadowContainer)
    return shadowContainer
  }

  get currentTime() {
    return new Date().toLocaleTimeString()
  }

  // Not ideal, but I didn't found a way to load the CSS from a file, without dependencies
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
        height: 40vh;
        position: relative;
        color: white;
        transform: translateY(100%);
        border-radius: 12px 12px 0 0;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.03);
        transition: 0.3s ease;
        overflow-y: hidden;
      }

      .bottom-sheet .log-entry {
        border-bottom: 1px solid #6c6c6c;
        white-space: collapse;
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

      .bottom-sheet.dragging .content {
        transition: none;
      }
      .bottom-sheet.fullscreen .content {
        border-radius: 0;
        overflow-y: hidden;
      }

      .bottom-sheet .log-entry-message.warn {
        color: #f39c12;
      }

      .bottom-sheet .log-entry-message.error {
        color: #ED4E4C;
      }

      .bottom-sheet .tab-action-bar {
        display: none;
        justify-content: space-between;
        background-color: rgb(49, 54, 63);
        padding: 0.5rem;
        padding-right: 1rem;
        padding-left: 1rem;
      }

      .bottom-sheet .tab-action-bar.active {
        display: flex;
      }

      .bottom-sheet .tab-action-bar button {
        background-color: transparent;
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5em;
        height: 100%;
      }

      .bottom-sheet .tab-action-bar button:active svg {
        fill: #6c6c6c;
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

      /* Bottom Sheet Tabs */
      .tablist {
        display: flex;
        overflow: hidden;
        background-color: #EEEEEE;
      }

      .tablist .tablink {
        color: black;
        background-color: inherit;
        width: 100%;
        border: none;
        outline: none;
        padding: 14px 16px;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .tablist .tablink.active {
        background-color: #31363f;
        color: white;
      }

      .tab-contents {
        height: 100%;
        overflow: scroll;
      }

      .outer-tab-content {
        display: none;
        border-top: none;
        height: 100%;
        overflow: scroll;
        background-color: hsl(0deg 0% 0% / 80%);
        padding-bottom: 7em;
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

      /* Bottom Sheet Stack Visualization */
      .bottom-sheet .viewstack-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        margin: 10px 0;
        background: white;
        color: black;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: auto;
      }

      .bottom-sheet .viewstack-card.active {
        border: 2px solid #f1f208;
      }

      .bottom-sheet .tab-container {
        background: #EEEEEE;
      }

      .bottom-sheet .main-view {
        border-color: #4e6080;
        background: #31363F;
      }

      .bottom-sheet .hotwire-view {
        border-color: #6db1b5;
        background: #76ABAE;
      }

      .bottom-sheet .child-container {
        margin-left: 30px;
        position: relative;
      }

      .bottom-sheet .child-container::before {
        content: "";
        position: absolute;
        left: -15px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #ddd;
      }

      .bottom-sheet .view-title {
        display: flex;
        align-items: center;
        gap: 0.5em;

        font-weight: bold;
        color: white;
        margin-bottom: 5px;
      }

      .bottom-sheet .view-title-details {
        color: #efefef;
        font-size: 0.6em;
      }

      .bottom-sheet .tab-container .view-title-details {
        color: #6c6c6c;
      }

      .bottom-sheet .view-url {
        color: #000000;
        font-size: 0.9em;
        margin-top: 5px;
        word-break: break-all;
      }

      /* Utility classes */
      .d-none {
        display: none;
      }

      .text-center {
        text-align: center;
      }

      .text-ellipsis {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }

      .d-flex {
        display: flex;
      }

      .flex-column {
        flex-direction: column;
      }

      .justify-content-between {
        justify-content: space-between;
      }

      .justify-content-end {
        justify-content: flex-end;
      }

      .no-wrap {
        overflow: hidden;
        white-space: nowrap;
      }

      .white-space-collapse {
        white-space: collapse;
      }

      .gap-3 {
        gap: 1rem;
      }

      .pb-2 {
        padding-bottom: 0.5rem;
      }

      .pt-2 {
        padding-top: 0.5rem;
      }

      .w-100 {
        width: 100%;
      }

      .w-80 {
        width: 80%;
      }
    `
  }
}
