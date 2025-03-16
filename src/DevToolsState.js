import { getSettings, saveSettings } from "./utils/settings"

export default class DevToolsState {
  constructor() {
    this.state = {
      consoleLogs: [],
      bridgeLogs: [],
      eventLogs: [],
      nativeStack: [],
      supportedBridgeComponents: [],
      bridgeIsConnected: false,
      supportsNativeStackView: false,
      activeTab: getSettings("activeTab") || "tab-bridge-logs",
    }
    this.listeners = []
  }

  subscribe(listener) {
    this.listeners.push(listener)
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  addConsoleLog(type, message) {
    const log = { type, message, time: this.currentTime }
    this.state.consoleLogs.push(log)
    this.notify()
  }

  addBridgeLog(direction, componentName, eventName, eventArgs) {
    const log = { direction, componentName, eventName, eventArgs, time: this.currentTime }
    this.state.bridgeLogs.push(log)
    this.notify()
  }

  addEventLog(eventName) {
    const event = { eventName, time: this.currentTime }
    this.state.eventLogs.push(event)
    this.notify()
  }

  setNativeStack(stack) {
    this.state.nativeStack = stack
    this.notify()
  }

  setSupportsNativeStack(supports) {
    this.state.supportsNativeStackView = supports
    this.notify()
  }

  setBridgeIsConnected(isConnected) {
    this.state.bridgeIsConnected = isConnected
    this.notify()
  }

  setSupportedBridgeComponents(components) {
    this.state.supportedBridgeComponents = components
    this.notify()
  }

  clearConsoleLogs() {
    this.state.consoleLogs = []
    this.notify()
  }

  clearBridgeLogs() {
    this.state.bridgeLogs = []
    this.notify()
  }

  clearEventLogs() {
    this.state.eventLogs = []
    this.notify()
  }

  setActiveTab(tab) {
    this.state.activeTab = tab
    saveSettings("activeTab", tab)
  }

  get currentTime() {
    return new Date().toLocaleTimeString()
  }
}
