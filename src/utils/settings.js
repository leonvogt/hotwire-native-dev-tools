export const getSettings = (key) => {
  let settings = JSON.parse(localStorage.getItem("hotwire-native-dev-tools") || "{}")
  return settings[key]
}

export const saveSettings = (key, value) => {
  let settings = JSON.parse(localStorage.getItem("hotwire-native-dev-tools") || "{}")
  settings[key] = value

  localStorage.setItem("hotwire-native-dev-tools", JSON.stringify(settings))
}

export const resetSettings = () => {
  localStorage.removeItem("hotwire-native-dev-tools")
}

export const getConsoleToggles = () => {
  const consoleToggles = getSettings("consoleToggles") || {
    warn: true,
    error: true,
    debug: true,
    info: true,
    log: true,
  }

  return consoleToggles
}

export const saveConsoleToggle = (key, value) => {
  const consoleToggles = getConsoleToggles()
  consoleToggles[key] = value
  saveSettings("consoleToggles", consoleToggles)
  return consoleToggles
}
