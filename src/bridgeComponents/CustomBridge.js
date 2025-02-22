/*
Custom Hotwire Native Bridge
It differs from the original Bridge, in that it does not use the Stimulus library.
Motivation: This DevTools can be used without Stimulus or the Native Bridge.
Therefore, we don't want to add Stimulus or the Native Bridge as a dependency, if possible.

Originally from: 37signals LLC
https://github.com/hotwired/hotwire-native-bridge
*/
export default class CustomBridge {
  isBridgeConnected() {
    return !!window.Strada?.web
  }

  // Send a message to the native side
  send(component, event, data = {}, callback = null) {
    const messageData = {
      ...data,
      metadata: {
        url: window.location.href,
      },
    }

    return this.bridge.send({
      component,
      event,
      data: messageData,
      callback,
    })
  }

  isComponentSupported(component) {
    return this.bridge.supportsComponent(component)
  }

  getPlatform() {
    return document.documentElement.dataset.bridgePlatform
  }

  getSupportedComponents() {
    return document.documentElement.dataset.bridgeComponents?.split(" ") || []
  }

  get bridge() {
    return window.Strada.web
  }
}
