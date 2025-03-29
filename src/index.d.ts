interface DevToolsOptions {
  enabled?: boolean
}

declare function setupDevTools(options?: DevToolsOptions): void

export { setupDevTools }
