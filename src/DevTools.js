import DevToolsState from "./DevToolsState"
import FloatingBubble from "./FloatingBubble"
import BottomSheet from "./BottomSheet"
import DiagnosticsChecker from "./DiagnosticsChecker"
import CustomBridge from "./bridge/CustomBridge"
import { debounce } from "./utils/utils"
import { cssContent } from "./DevToolsStyling.css"

export default class DevTools {
  constructor() {
    this.state = new DevToolsState()
    this.bubble = new FloatingBubble(this)
    this.bottomSheet = new BottomSheet(this)
    this.customBridge = new CustomBridge(this)
    this.diagnosticsChecker = new DiagnosticsChecker()
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
      this.captureUncaughtErrors()
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

    // Observe screen size or orientation changes to reposition the bubble
    window.addEventListener(
      "resize",
      () => {
        this.bubble.render()
      },
      { passive: true }
    )

    // Check for warnings
    this.diagnosticsChecker.checkForWarnings()

    this.bubble.onClick(() => {
      this.bottomSheet.showBottomSheet()
      this.customBridge.send("vibrate")
    })
  }, 200)

  nativeBridgeGotConnected() {
    if (this.originalBridge) return

    this.originalBridge = window.Strada.web
    this.addBridgeProxy()
    this.state.setBridgeIsConnected(true)
    this.callNativeBridgeComponent()
    this.state.setSupportedBridgeComponents(this.customBridge.getSupportedComponents().sort())
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
          return originalValue?.apply(target, args)
        }
      },
    })
  }

  captureUncaughtErrors() {
    window.addEventListener("error", (event) => {
      const { message, filename, lineno, colno } = event
      const formattedMessage = `${message} at ${filename}:${lineno}:${colno}`
      this.interceptedConsoleMessage("error", [formattedMessage])
      return false
    })

    window.addEventListener("unhandledrejection", (event) => {
      this.interceptedConsoleMessage("warn", [event.reason])
      return false
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
        if (arg instanceof Element) {
          const attrs = Array.from(arg.attributes)
            .map((attr) => `${attr.name}="${attr.value}"`)
            .join(" ")

          return `&lt;${arg.tagName.toLowerCase()}${attrs ? " " + attrs : ""}&gt;&lt;/${arg.tagName.toLowerCase()}&gt;`
        }
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

    // Ignore messages from the dev tools itself
    // Otherwise we could end up in an infinite loop
    if (message.includes("hotwire-native-dev-tools") || message.includes("HotwireDevTools")) return

    this.state.addConsoleLog(type, message)
    if (type === "error") {
      this.bubble.animateErrorBorder()
    }
  }

  // Fetch the current stack from the native side
  // The debounce on this function is intentionally high,
  // to ensure the native side has enough time to set the ViewController / Fragment titles.
  // Previously, with a lower debounce, the title would often be empty.
  fetchNativeStack = debounce(() => {
    this.customBridge.send("currentStackInfo", {}, (message) => {
      this.state.setSupportsNativeStack(true)
      this.state.setNativeStack(message.data.stack)
    })
  }, 1000)

  refetchNativeStack() {
    this.customBridge.send("currentStackInfo", {}, (message) => {
      this.state.setNativeStack(message.data.stack)
    })
  }

  injectCSSToShadowRoot = async () => {
    if (this.shadowRoot.querySelector("style")) return

    const style = document.createElement("style")
    style.textContent = cssContent()
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
}
