/*
Similar to the `BridgeComponent` class from the Hotwire Native Bridge,
but without requiring a bridge component HTML element or Stimulus controller.

Originally from: 37signals LLC
https://github.com/hotwired/hotwire-native-bridge
*/
export default class NativeBridge {
  bridgeIsConnected() {
    return !!(window.HotwireNative?.web || window.Strada?.web)
  }

  // Send a message to the native side
  send(event, data = {}, callback = null) {
    if (!this.bridgeIsConnected()) {
      return Promise.reject("Bridge is not connected")
    }

    const messageData = {
      ...data,
      metadata: {
        url: window.location.href,
      },
    }

    return this.bridge.send({
      component: "dev-tools",
      event,
      data: messageData,
      callback,
    })
  }

  isComponentSupported(component) {
    if (!this.bridgeIsConnected()) {
      return false
    }
    return this.bridge.supportsComponent(component)
  }

  getSupportedComponents() {
    return document.documentElement.dataset.bridgeComponents?.split(" ") || []
  }

  get bridge() {
    return window.HotwireNative?.web || window.Strada?.web
  }
}
