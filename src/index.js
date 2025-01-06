const addBridgeProxy = () => {
  const originalBridge = window.Strada.web;

  // Wrap the bridge with a Proxy
  window.Strada.web = new Proxy(originalBridge, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);

      // We are only interested in the `send` and `receive` functions
      if (prop === 'send' || prop === 'receive') {
        return function (...args) {
          console.log(`Intercepted call to ${prop}:`, args);

          // Call the original function
          return originalValue.apply(target, args);
        };
      }

      // For all other functions, call the original function
      return function (...args) {
        return originalValue.apply(target, args);
      };
    },
  });
}

const mockBridge = () => {
  if (window.Strada) {
    addBridgeProxy();
  } else {
    document.addEventListener("web-bridge:ready", () => {
      addBridgeProxy();
    });
  }
};

export { mockBridge, addBridgeProxy };
