export const getSettings = (key) => {
  let settings = JSON.parse(localStorage.getItem("hotwire-native-dev-tools") || "{}")
  return settings[key]
}

export const saveSettings = (key, value) => {
  let settings = JSON.parse(localStorage.getItem("hotwire-native-dev-tools") || "{}")
  settings[key] = value
  console.log("saveSettings", settings)

  localStorage.setItem("hotwire-native-dev-tools", JSON.stringify(settings))
}
