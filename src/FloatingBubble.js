import { getSettings, saveSettings } from "./utils/settings"
import { debounce } from "./utils/utils"
import { hotwireIcon } from "./utils/icons"

export default class FloatingBubble {
  constructor(devTools) {
    this.devTools = devTools
    this.bubbleSize = 4.75 * 16 + 0.3 * 16 // 4.75rem + 0.3rem border
    this.minVisible = this.bubbleSize * 0.5 // Keep 50% of the bubble visible at all times
    this.currentlyDragging = false
  }

  render = debounce(() => {
    this.setPosition()
    this.createDragItem()
    this.setTranslate(this.initialX, this.initialY, this.dragItem)
    this.addEventListeners()
  }, 50)

  setPosition() {
    this.settingKey = window.innerWidth < window.innerHeight ? "bubblePosPortrait" : "bubblePosLandscape"

    // Get stored position or use default (bottom right corner)
    const defaultPos = { x: window.innerWidth - 100, y: window.innerHeight - 100 }
    const { x: startX, y: startY } = getSettings(this.settingKey) || defaultPos

    this.currentX = this.initialX = this.xOffset = startX
    this.currentY = this.initialY = this.yOffset = startY
  }

  createDragItem() {
    const existingBubble = this.devTools.shadowRoot?.getElementById("floating-bubble")
    if (existingBubble) {
      this.dragItem = existingBubble
      return
    }

    this.dragItem = document.createElement("div")
    this.dragItem.id = "floating-bubble"
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

  animateErrorBorder() {
    let errorBorder = this.dragItem.querySelector(".error-border")
    let circleElement = this.dragItem.querySelector(".error-border circle")

    if (errorBorder) {
      errorBorder.remove()
    }

    const animationContainer = document.createElement("div")
    animationContainer.className = "animation-container"
    animationContainer.innerHTML = `
      <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" class="error-border">
        <defs>
          <linearGradient id="errorGradient" gradientTransform="rotate(45)">
            <stop offset="0%" stop-color="#e4241a" />
            <stop offset="50%" stop-color="#dd1f15" />
            <stop offset="100%" stop-color="#f6160a" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r="90" fill="none" stroke="url(#errorGradient)" stroke-width="21"
                stroke-dasharray="565" stroke-dashoffset="565" stroke-linecap="round" />
      </svg>
    `

    this.dragItem.appendChild(animationContainer)
    circleElement = this.dragItem.querySelector(".error-border circle")
    circleElement.classList.add("animate")

    setTimeout(() => {
      animationContainer.classList.add("fade-out")
    }, 1300) // Start fade-out after animation completes

    setTimeout(() => {
      if (animationContainer && animationContainer.parentNode) {
        animationContainer.remove()
      }
    }, 1800) // Remove after fade-out completes
  }

  onClick(callback) {
    this.clickCallback = callback
  }

  dragStart(event) {
    if (!event.target.closest("#floating-bubble")) return
    this.currentlyDragging = true

    this.initialX = event.touches[0].clientX - this.xOffset
    this.initialY = event.touches[0].clientY - this.yOffset
  }

  dragEnd() {
    this.initialX = this.currentX
    this.initialY = this.currentY
    this.currentlyDragging = false

    saveSettings(this.settingKey, { x: this.currentX, y: this.currentY })
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

    if (!this.animationFrame) {
      this.animationFrame = requestAnimationFrame(() => {
        this.setTranslate(this.currentX, this.currentY, this.dragItem)
        this.animationFrame = null
      })
    }
  }

  setTranslate(xPos, yPos, element) {
    element.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`
  }
}
