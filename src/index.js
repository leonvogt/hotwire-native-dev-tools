import DevTools from "./DevTools"

const setupDevTools = (options = {}) => {
  const devTools = new DevTools(options)
  if (!devTools.options.enabled) return

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
