import { getSettings, saveSettings } from "./utils/settings"

export default class DebugBubble {
  constructor() {
    this.shadowRoot = this.shadowContainer.attachShadow({ mode: "open" })
    this.injectCSSToShadowRoot()
    this.injectHTML()
    this.addEventListeners()

    let startX = 0
    let startY = 0
    const settings = getSettings("bubblePosition")
    if (settings) {
      startX = settings.x
      startY = settings.y
    }
    this.currentlyDragging = false

    this.currentX = startX
    this.currentY = startY
    this.initialX = startX
    this.initialY = startY
    this.xOffset = startX
    this.yOffset = startY

    this.setTranslate(this.initialX, this.initialY, this.dragItem)
  }

  injectHTML() {
    this.dragItem = document.createElement("div")
    this.dragItem.id = "debug-bubble"
    this.shadowRoot.appendChild(this.dragItem)
  }

  addEventListeners() {
    this.dragItem.addEventListener("click", this.click.bind(this), false)
    this.dragItem.addEventListener("touchstart", this.dragStart.bind(this), false)
    this.dragItem.addEventListener("touchend", this.dragEnd.bind(this), false)
    this.dragItem.addEventListener("touchmove", this.drag.bind(this), false)
  }

  click(event) {
    event.preventDefault()

    if (this.clickCallback) {
      this.clickCallback(event)
    }
  }

  onClick(callback) {
    this.clickCallback = callback
  }

  dragStart(event) {
    this.initialX = event.touches[0].clientX - this.xOffset
    this.initialY = event.touches[0].clientY - this.yOffset

    if (event.target === this.dragItem) {
      this.currentlyDragging = true
    }
  }

  dragEnd(event) {
    this.initialX = this.currentX
    this.initialY = this.currentY

    saveSettings("bubblePosition", {
      x: this.currentX,
      y: this.currentY,
    })

    this.currentlyDragging = false
  }

  drag(event) {
    if (this.currentlyDragging) {
      event.preventDefault()

      this.currentX = event.touches[0].clientX - this.initialX
      this.currentY = event.touches[0].clientY - this.initialY

      // Offset tracks where touch started, relative to the item's position
      // To avoid a unnatural "snapping behaviour" when continuing to drag
      this.xOffset = this.currentX
      this.yOffset = this.currentY

      this.setTranslate(this.currentX, this.currentY, this.dragItem)
    }
  }

  setTranslate(xPos, yPos, element) {
    element.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)"
  }

  injectCSSToShadowRoot = async () => {
    if (this.shadowRoot.querySelector("style")) return

    const style = document.createElement("style")
    style.textContent = this.cssContent
    this.shadowRoot.appendChild(style)
  }

  get shadowContainer() {
    const existingShadowContainer = document.getElementById("hotwire-native-dev-tools-shadow-container")
    if (existingShadowContainer) {
      return existingShadowContainer
    }
    const shadowContainer = document.createElement("div")
    shadowContainer.id = "hotwire-native-dev-tools-shadow-container"
    document.body.appendChild(shadowContainer)
    return shadowContainer
  }

  // Not ideal, but I didn't found a way to load the CSS from a file, without dependencies
  get cssContent() {
    return `
      /* Debug bubble */
      #debug-bubble {
        width: 5rem;
        height: 5rem;
        background-color: rgb(92, 92, 92);
        border: 0.5rem solid rgba(136, 136, 136, 0.5);
        border-radius: 50%;
        touch-action: none;
        user-select: none;
        z-index: 10000000;

        /* Inital position */
        position: absolute;
        bottom: 10px;
        right: 10px;
      }

      /* Bottom Sheet */
      .bottom-sheet {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        opacity: 0;
        pointer-events: none;
        align-items: center;
        flex-direction: column;
        justify-content: flex-end;
        transition: 0.1s linear;

        .sheet-overlay {
          position: fixed;
          top: 0;
          left: 0;
          z-index: -1;
          width: 100%;
          height: 100%;
          opacity: 0.2;
          background: #000;
        }

        .content {
          width: 100%;
          position: relative;
          background-color: hsl(0deg 0% 0% / 60%);
          color: white;
          max-height: 100vh;
          height: 40vh;
          padding: 1rem;
          transform: translateY(100%);
          border-radius: 12px 12px 0 0;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.03);
          transition: 0.3s ease;

          height: 100%;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .content::-webkit-scrollbar {
          width: 0;
        }

        .log-entry {
          border-bottom: 1px solid #6c6c6c;
        }

        .log-entry-icon svg {
          width: 1rem;
          fill: white;
        }
      }

      .bottom-sheet.show {
        opacity: 1;
        pointer-events: auto;
      }

      .bottom-sheet.show .content {
        transform: translateY(0%);
      }

      /* Utility classes */
      .d-flex {
        display: flex;
      }

      .align-center {
        align-items: center;
      }

      .justify-center {
        justify-content: center;
      }

      .justify-between {
        justify-content: space-between;
      }

      .no-wrap {
        overflow: hidden;
        white-space: nowrap;
      }

      .gap-1 {
        gap: 0.25rem;
      }

      .gap-2 {
        gap: 0.5rem;
      }

      .gap-3 {
        gap: 1rem;
      }

      .gap-4 {
        gap: 1.5rem;
      }

      .mb-1 {
        margin-bottom: 0.25rem;
      }

      .mb-2 {
        margin-bottom: 0.5rem;
      }

      .mb-3 {
        margin-bottom: 1rem;
      }

      .pb-1 {
        padding-bottom: 0.25rem;
      }

      .pb-2 {
        padding-bottom: 0.5rem;
      }

      .pb-3 {
        padding-bottom: 1rem;
      }

      .pt-1 {
        padding-top: 0.25rem;
      }

      .pt-2 {
        padding-top: 0.5rem;
      }

      .pt-3 {
        padding-top: 1rem;
      }

      .w-100 {
        width: 100%;
      }

    `
  }
}
