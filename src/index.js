import DevTools from "./DevTools"
import DebugBubble from "./DebugBubble"
import BottomSheet from "./BottomSheet"

const devTools = new DevTools()
const bubble = new DebugBubble(devTools)
const bottomSheet = new BottomSheet(devTools)

// bottomSheet.addBridgeLog("send", "Test Component", "noAction", { foo: "bar" })
const interceptedBridgeMessage = (direction, args) => {
  args.forEach((arg) => {
    const componentName = arg.component
    const eventName = arg.event
    const { metadata, ...eventArgs } = arg.data // Remove metadata from the args
    bottomSheet.addBridgeLog(direction, componentName, eventName, eventArgs)
  })
}

const addBridgeProxy = () => {
  const originalBridge = window.Strada.web

  // Wrap the bridge with a Proxy
  window.Strada.web = new Proxy(originalBridge, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver)

      // We are only interested in the `send` and `receive` functions
      if (prop === "send" || prop === "receive") {
        return function (...args) {
          switch (prop) {
            case "send":
              interceptedBridgeMessage("send", args)
              break
            case "receive":
              interceptedBridgeMessage("receive", args)
              break
            default:
              break
          }

          // Call the original function
          return originalValue.apply(target, args)
        }
      }

      // For all other functions, call the original function
      return function (...args) {
        return originalValue.apply(target, args)
      }
    },
  })
}

// const mockConsole = () => {
//   // Save the original console object
//   const originalConsole = { ...console }

//   // Wrap console with a Proxy
//   const proxyConsole = new Proxy(console, {
//     get(target, prop, receiver) {
//       const originalMethod = Reflect.get(target, prop, receiver)

//       // Intercept only the methods you want (log, warn, error, etc.)
//       if (["log", "warn", "error"].includes(prop)) {
//         return function (...args) {
//           // Add custom behavior (e.g., log to a server, filter messages, etc.)
//           console.groupCollapsed(`[Intercepted ${prop}]`)
//           console.log("Arguments:", args)
//           console.groupEnd()

//           // Call the original method
//           return originalMethod.apply(target, args)
//         }
//       }

//       // Return other properties or methods unchanged
//       return originalMethod
//     },
//   })

//   // Replace the global console with the proxy
//   window.console = proxyConsole
// }

const setupDevTools = () => {
  addBridgeProxy()

  bubble.onClick((event) => {
    bottomSheet.showBottomSheet()
  })
}

const mockBridge = () => {
  if (window.Strada) {
    setupDevTools()
  } else {
    document.addEventListener("web-bridge:ready", () => {
      setupDevTools()
    })
  }
}

export { mockBridge, addBridgeProxy }
