export type BubbleCorner = "bottom-right" | "bottom-left" | "top-right" | "top-left"

export interface DevToolsOptions {
  enabled?: boolean
  reset?: boolean
  initialBubblePosition?: BubbleCorner
}

export function setupDevTools(options?: DevToolsOptions): void
