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

export const getConsoleFilterLevels = () => {
  const consoleFilterLevels = getSettings("consoleFilterLevels") || {
    warn: true,
    error: true,
    debug: true,
    info: true,
    log: true,
  }

  return consoleFilterLevels
}

export const saveConsoleFilterLevels = (key, value) => {
  const consoleFilterLevels = getConsoleFilterLevels()
  consoleFilterLevels[key] = value
  saveSettings("consoleFilterLevels", consoleFilterLevels)
  return consoleFilterLevels
}
