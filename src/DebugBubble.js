import { getSettings, saveSettings } from "./utils/settings"

export default class DebugBubble {
  constructor(devTools) {
    this.devTools = devTools

    this.createDragItem()
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

  createDragItem() {
    const existingBubble = this.devTools.shadowRoot?.getElementById("debug-bubble")
    if (existingBubble) {
      this.dragItem = existingBubble
      return
    }

    this.dragItem = document.createElement("div")
    this.dragItem.id = "debug-bubble"
    this.devTools.shadowRoot.appendChild(this.dragItem)
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
}
