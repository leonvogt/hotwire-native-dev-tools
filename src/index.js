import DevTools from "./DevTools"

const setupDevTools = () => {
  const devTools = new DevTools()
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
