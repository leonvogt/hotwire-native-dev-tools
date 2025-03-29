interface DevToolsOptions {
  enabled?: boolean
  reset?: boolean
}

declare function setupDevTools(options?: DevToolsOptions): void

export { setupDevTools }
