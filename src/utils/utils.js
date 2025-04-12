export const debounce = (fn, delay) => {
  let timeoutId = null

  return (...args) => {
    const callback = () => fn.apply(this, args)
    clearTimeout(timeoutId)
    timeoutId = setTimeout(callback, delay)
  }
}

const { userAgent } = window.navigator
export const isIosApp = /iOS/.test(userAgent)
export const isAndroidApp = /Android/.test(userAgent)

export const platform = () => {
  if (isIosApp) {
    return "ios"
  } else if (isAndroidApp) {
    return "android"
  }
  return "unknown"
}

export const formattedPlatform = () => {
  switch (platform()) {
    case "android":
      return "Android"
    case "ios":
      return "iOS"
    default:
      return "<unknown>"
  }
}
