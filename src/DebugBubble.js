import { getSettings, saveSettings } from "./utils/settings"
import { hotwireIcon } from "./utils/icons"

export default class DebugBubble {
  constructor(devTools) {
    this.devTools = devTools

    let startX = window.innerWidth - 100
    let startY = window.innerHeight - 100
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

    this.bubbleSize = 4.75 * 16 + 0.3 * 16
    this.minVisible = this.bubbleSize * 0.5 // Keep 50% of the bubble visible at all times
  }

  render() {
    this.createDragItem()
    this.setTranslate(this.initialX, this.initialY, this.dragItem)
    this.addEventListeners()
  }

  createDragItem() {
    const existingBubble = this.devTools.shadowRoot?.getElementById("debug-bubble")
    if (existingBubble) {
      this.dragItem = existingBubble
      return
    }

    this.dragItem = document.createElement("div")
    this.dragItem.id = "debug-bubble"
    this.dragItem.innerHTML = hotwireIcon
    this.devTools.shadowRoot.appendChild(this.dragItem)
  }

  addEventListeners() {
    if (this.dragItem.hasEventListeners) return
    this.dragItem.addEventListener("click", this.click.bind(this), false)
    this.dragItem.addEventListener("touchstart", this.dragStart.bind(this), false)
    this.dragItem.addEventListener("touchend", this.dragEnd.bind(this), false)
    this.dragItem.addEventListener("touchmove", this.drag.bind(this), false)
    this.dragItem.hasEventListeners = true
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

    if (event.target.closest("#debug-bubble")) {
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
    if (!this.currentlyDragging) return
    event.preventDefault()

    const touch = event.touches[0]
    const deltaX = touch.clientX - this.initialX
    const deltaY = touch.clientY - this.initialY

    // Constrain movement within screen bounds
    this.currentX = Math.max(-this.bubbleSize + this.minVisible, Math.min(deltaX, window.innerWidth - this.minVisible))
    this.currentY = Math.max(-this.bubbleSize + this.minVisible, Math.min(deltaY, window.innerHeight - this.minVisible))

    this.xOffset = this.currentX
    this.yOffset = this.currentY

    this.setTranslate(this.currentX, this.currentY, this.dragItem)
  }

  setTranslate(xPos, yPos, element) {
    element.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)"
  }
}
