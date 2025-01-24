import DevTools from "./DevTools"

const devTools = new DevTools()

const setupDevTools = () => {
  devTools.setup()

  document.addEventListener(
    "turbo:load",
    () => {
      devTools.setup()
    },
    { passive: true }
  )
}

export { setupDevTools }
