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

export const getMetaElement = (name) => {
  return document.querySelector(`meta[name="${name}"]`)
}

export const getMetaContent = (name) => {
  const element = getMetaElement(name)
  return element && element.content
}

export const elementToEscapedString = (element) => {
  const attrs = Array.from(element.attributes)
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(" ")
  return `&lt;${element.tagName.toLowerCase()}${attrs ? " " + attrs : ""}&gt;&lt;/${element.tagName.toLowerCase()}&gt;`
}

export const escapeHtml = (value) => {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
}

export const parseDocumentCookies = () => {
  return document.cookie
    .split("; ")
    .filter((entry) => entry)
    .map((entry) => {
      const separatorIndex = entry.indexOf("=")
      if (separatorIndex === -1) return { name: "", value: entry }
      return { name: entry.slice(0, separatorIndex), value: entry.slice(separatorIndex + 1) }
    })
}

export const cookieDomainMatchesHost = (cookieDomain, hostname) => {
  if (!cookieDomain) return true
  const domain = cookieDomain.replace(/^\./, "").toLowerCase()
  const host = hostname.toLowerCase()
  return host === domain || host.endsWith(`.${domain}`)
}
