export default class DiagnosticsChecker {
  constructor() {
    this.printedWarnings = []
  }

  printWarning = (message, once = true, ...extraArgs) => {
    if (once && this.printedWarnings.includes(message)) return

    console.warn(`DevTools: ${message}`, ...extraArgs)
    this.printedWarnings.push(message)
  }

  checkForWarnings = () => {
    this.#checkForDuplicatedTurboFrames()
    this.#checkTurboPermanentElements()
  }

  #checkForDuplicatedTurboFrames = () => {
    const turboFramesIds = this.turboFrameIds
    const duplicatedIds = turboFramesIds.filter((id, index) => turboFramesIds.indexOf(id) !== index)

    duplicatedIds.forEach((id) => {
      this.printWarning(`Multiple Turbo Frames with the same ID '${id}' detected. This can cause unexpected behavior. Ensure that each Turbo Frame has a unique ID.`)
    })
  }

  #checkTurboPermanentElements = () => {
    const turboPermanentElements = document.querySelectorAll("[data-turbo-permanent]")
    if (turboPermanentElements.length === 0) return

    turboPermanentElements.forEach((element) => {
      const id = element.id
      if (id === "") {
        const message = `Turbo Permanent Element detected without an ID. Turbo Permanent Elements must have a unique ID to work correctly.`
        this.printWarning(message, true, element)
      }

      const idIsDuplicated = id && document.querySelectorAll(`#${id}`).length > 1
      if (idIsDuplicated) {
        const message = `Turbo Permanent Element with ID '${id}' doesn't have a unique ID. Turbo Permanent Elements must have a unique ID to work correctly.`
        this.printWarning(message, true, element)
      }
    })
  }

  get turboFrameIds() {
    return Array.from(document.querySelectorAll("turbo-frame")).map((turboFrame) => turboFrame.id)
  }
}
