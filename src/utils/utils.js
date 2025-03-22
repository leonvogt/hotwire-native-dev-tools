export const debounce = (fn, delay) => {
  let timeoutId = null

  return (...args) => {
    const callback = () => fn.apply(this, args)
    clearTimeout(timeoutId)
    timeoutId = setTimeout(callback, delay)
  }
}

export const platform = () => {
  const { bridgePlatform } = document.documentElement.dataset
  const platform = bridgePlatform || "unknown"
  return platform
}
