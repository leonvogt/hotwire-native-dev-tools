// Ideally, we would use a dedicated CSS file, but I dind't find a good way to load the styles from a dedicated CSS file.
// So we just use a function that returns the CSS content as a string.
// For better syntax highlighting, you can set the language to CSS in the editor for this file.
export const cssContent = () => {
  return `
    :host {
      all: initial;
      font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
      --font-size: 16px;
      font-size: var(--font-size) !important;
    }

    * {
      box-sizing: border-box;
    }

    p, span, h1, h2, h3, h4, h5, h6, div, a, button, input, label {
      font-size: inherit;
    }


    a {
      color: white;
    }

    h1, h2, h3, h4, h5, h6 {
      margin: 0;
    }

    button, label, .toggle-label {
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    input {
      display: block;
      padding: 3px;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    input:focus {
      outline: none;
    }

    .btn-icon {
      background-color: transparent;
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5em;
      height: 100%;
    }

    .btn-icon svg {
      width: 1rem;
      height: 1rem;
      fill: white;
    }

    /* Dropdown */
    .dropdown-content {
      display: none;
      position: absolute;
      z-index: 1000;
      background: white;
      border: 1px solid #ddd;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      min-width: 200px;
      max-width: 300px;
      opacity: 0;
      transform: scale(0.9);
      transition: opacity 0.2s, transform 0.2s;
      user-select: none;
      -webkit-user-select: none;
    }

    .dropdown-content.dropdown-open {
      display: block;
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    .dropdown-content > * {
      padding: 12px;
    }

    .dropdown-content button,
    .dropdown-content label {
      color: black;
      width: 100%;
      margin: 0;
      border: none;
      display: flex;
      align-items: center;
    }

    .dropdown-content button:not(:first-child) {
      border-top: 1px solid #cecdcd;
    }

    .settings-dropdown {
      right: 0;
      top: 2rem;
    }

    /* Floating bubble */
    #floating-bubble {
      display: flex;
      background-color: hsl(0deg 0% 0% / 60%);
      border-radius: 50%;
      touch-action: none;
      user-select: none;
      z-index: 10000000;
      position: fixed;
      top: 10px;
      left: 10px;

      /* Remove tap highlight on iOS */
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;

      /* Keep width, height, and border in sync with bubbleSize in FloatingBubble.js */
      width: 4.75rem;
      height: 4.75rem;
      border: 0.3rem solid rgba(136, 136, 136, 0.5);
    }

    #floating-bubble svg {
      transform: scale(0.6);
      fill: #b1b1b1;
    }

    #floating-bubble .animation-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    #floating-bubble .error-border {
      position: absolute;
      top: -30px;
      left: -30px;
      width: calc(100% + 60px);
      height: calc(100% + 60px);
      border-radius: 50%;
    }

    #floating-bubble .error-border circle {
      transform-origin: center;
      transform: rotate(-90deg);
    }

    #floating-bubble .error-border circle.animate {
      animation: error-border-progress 0.8s ease-out forwards;
    }

    #floating-bubble .animation-container.fade-out {
      animation: fade-out 0.4s ease-out forwards;
    }

    /*
      The "stroke-dasharray" defines the start of the animation
      The value is calculated by the formula: 2 * Math.PI * radius
      In this case: 2 * Math.PI * 90 = 565
    */
    @keyframes error-border-progress {
      from {
        stroke-dashoffset: 565;
      }
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes fade-out {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    /* Bottom Sheet */
    .bottom-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      max-height: 100%;
      display: flex;
      opacity: 0;
      pointer-events: none;
      align-items: center;
      flex-direction: column;
      justify-content: flex-end;
      transition: 0.1s linear;
      z-index: 10000001;
    }

    .bottom-sheet .sheet-overlay.active {
      position: fixed;
      top: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      opacity: 0.2;
      background: #000;
    }

    .bottom-sheet .content {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 40vh;
      position: relative;
      color: white;
      transform: translateY(100%);
      border-radius: 12px 12px 0 0;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.03);
      transition: 0.3s ease;
      overflow-y: hidden;
    }

    .bottom-sheet .log-entry {
      border-bottom: 1px solid #6c6c6c;
      white-space: collapse;
    }

    .bottom-sheet .log-entry-icon svg {
      width: 1rem;
      fill: white;
    }

    .bottom-sheet.show {
      opacity: 1;
      pointer-events: auto;
    }

    .bottom-sheet.show .content {
      transform: translateY(0%);
    }

    .bottom-sheet.dragging .content {
      transition: none;
    }
    .bottom-sheet.fullscreen .content {
      border-radius: 0;
      overflow-y: hidden;
    }

    .bottom-sheet .log-entry-message.warn {
      color: #f39c12;
    }

    .bottom-sheet .log-entry-message.error {
      color: #ED4E4C;
    }

    .bottom-sheet .tab-action-bars {
      /* Fixes a 1px gap that can appear between .tab-action-bar and .tablist on Android devices */
      margin-top: -1px;
    }

    .bottom-sheet .tab-action-bar {
      display: none;
      justify-content: space-between;
      background-color: rgb(49, 54, 63);
      padding: 0.5rem;
      padding-right: 1rem;
      padding-left: 1rem;
    }

    .bottom-sheet .tab-action-bar.active {
      display: flex;
    }

    .bottom-sheet .tab-action-bar button:active svg {
      fill: #6c6c6c;
    }

    .bottom-sheet .btn-clear-tab,
    .bottom-sheet .btn-reload-tab {
      margin-left: auto;
    }

    /* Bottom Sheet Tabs */
    .tablist {
      display: flex;
      overflow: hidden;
      background-color: #EEEEEE;
    }

    .tablist .tablink {
      color: black;
      background-color: inherit;
      width: 100%;
      border: none;
      outline: none;
      padding: 14px 16px;
      margin: 0;
      font-size: 0.8em;
    }

    .tablist .tablink.active {
      background-color: #31363f;
      color: white;
    }

    .tablist .tablink-settings {
      background-color: inherit;
    }

    .tab-contents {
      height: 100%;
      overflow: scroll;
      /* Fixes a 1px gap that can appear between .tab-action-bar and .tab-contents on Android devices */
      margin-top: -1px;
    }

    .outer-tab-content {
      display: none;
      border-top: none;
      height: 100%;
      overflow: scroll;
      background-color: hsl(0deg 0% 0% / 80%);
      backdrop-filter: blur(30px) saturate(250%);
      -webkit-backdrop-filter: blur(30px) saturate(250%);
      padding-bottom: 7em;
    }
    .outer-tab-content.active {
      display: block;
    }
    .inner-tab-content {
      padding: 1rem;
      overflow-x: auto;
      white-space: nowrap;
    }
    .single-tab-content .inner-tab-content {
      white-space: normal;
    }

    .info-card {
      border-radius: 5px;
      background: hsl(0deg 0% 0% / 20%);
      padding: 1em;
      margin-bottom: 1em;
    }

    .info-card-title {
      font-size: 1em;
      font-weight: 700;
      margin-bottom: 1em;
      display: flex;
      justify-content: space-between;
    }

    .info-card-hint {
      font-size: 0.8em;
    }

    .tab-empty-content {
      display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;
      padding: 1em;
    }

    .bottom-sheet .tablink-dropdown {
      background: inherit;
      border: none;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5em;
      width: 2rem;
    }

    .bottom-sheet .tablink-dropdown  svg {
      width: 1rem;
      height: 1rem;
      fill: #121212;
    }

    .bottom-sheet .tablink-dropdown:active {
      background-color: #31363f;
    }
    .bottom-sheet .tablink-dropdown:active svg {
      fill: white;
    }

    /* Bottom Sheet Stack Visualization */
    .bottom-sheet .viewstack-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      margin: 10px 0;
      background: white;
      color: black;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: auto;
    }

    .bottom-sheet .viewstack-card.current-view {
      border: 2px solid #f1f208;
    }

    .bottom-sheet .tab-container {
      background: #EEEEEE;
    }

    .bottom-sheet .main-view {
      border-color: #4e6080;
      background: #31363F;
    }

    .bottom-sheet .hotwire-view {
      border-color: #6db1b5;
      background: #76ABAE;
    }

    .bottom-sheet .child-container {
      margin-left: 30px;
      position: relative;
    }

    .bottom-sheet .child-container::before {
      content: "";
      position: absolute;
      left: -15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #ddd;
    }

    .bottom-sheet .view-title {
      display: flex;
      align-items: center;
      gap: 0.5em;

      font-weight: bold;
      color: white;
      margin-bottom: 5px;
    }

    .bottom-sheet .view-title-details {
      color: #efefef;
      font-size: 0.6em;
    }

    .bottom-sheet .tab-container .view-title-details {
      color: #6c6c6c;
    }

    .bottom-sheet .view-url {
      color: #000000;
      font-size: 0.9em;
      margin-top: 5px;
      word-break: break-all;
    }

    .bottom-sheet .non-identified-view {
      background: #EEEEEE;
    }
    .bottom-sheet .non-identified-view .view-title-details,
    .bottom-sheet .non-identified-view .view-title {
      color: #6c6c6c;
    }

    .bottom-sheet .viewstack-card pre {
      font-size: 0.8em;
    }

    /* Bottom Sheet Bridge Components */
    .bottom-sheet .bridge-components-collapse-btn {
      background: none;
      border: none;
      color: white;
      width: 100%;
      text-align: left;
      border-bottom: 1px solid #eee;
      padding: 0.5em 0em;
      font-size: 0.9em;
    }

    .tab-content-bridge-components {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 0.5em 0em;
    }

    .tab-content-bridge-components .bridge-component {
      position: relative;
      padding-left: 15px;
    }

    .tab-content-bridge-components .bridge-component::before {
      content: "•";
      color: #eee;
      font-size: 1.5em;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
    }
    .tab-content-bridge-components .bridge-component.connected::before {
      color: #5cff00
    }

    /* Collapsibles */
    .collapse-target {
      display: none;
    }

    .collapse-target.active {
      display: block;
    }

    .collapse:not(.no-chevron):after {
      content: '\\25BC';
      font-size: 13px;
      color: #777;
      float: right;
      margin-left: 5px;
    }

    .collapse:not(.no-chevron).active:after {
      content: "\\25B2";
    }

    /* Custom checkbox toggles */
    .toggle {
      display: inline-block;
      user-select: none;
    }

    .toggle-switch {
      display: inline-block;
      background: #ccc;
      border-radius: 16px;
      width: 29px;
      height: 16px;
      position: relative;
      vertical-align: middle;
      transition: background 0.15s;
    }
    .toggle-switch:before,
    .toggle-switch:after {
      content: "";
    }
    .toggle-switch:before {
      display: block;
      background: linear-gradient(to bottom, #fff 0%, #eee 100%);
      border-radius: 50%;
      width: 12px;
      height: 12px;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: left 0.15s;
    }
    .toggle-checkbox:checked + .toggle-switch {
      background: #56c080;
    }
    .toggle-checkbox:checked + .toggle-switch:before {
      left: 15px;
    }

    .toggle-checkbox {
      position: absolute;
      visibility: hidden;
    }

    .toggle-label {
      position: relative;
      margin-left: 3px;
      top: 2px;
    }

    /* Utility classes */
    .d-none {
      display: none;
    }

    .text-center {
      text-align: center;
    }

    .text-ellipsis {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    .break-word {
      word-break: break-word;
    }

    .d-flex {
      display: flex;
    }

    .flex-column {
      flex-direction: column;
    }

    .justify-content-between {
      justify-content: space-between;
    }

    .justify-content-end {
      justify-content: flex-end;
    }

    .align-items-center {
      align-items: center;
    }

    .flex-grow-1 {
      flex-grow: 1;
    }

    .border-bottom {
      border-bottom: 1px solid #c5c1c1;
    }

    .no-wrap {
      overflow: hidden;
      white-space: nowrap;
    }

    .white-space-collapse {
      white-space: collapse;
    }

    .overflow-auto {
      overflow: auto;
    }

    .m-0 {
      margin: 0;
    }

    .mt-1 {
      margin-top: 0.25rem;
    }

    .mt-2 {
      margin-top: 0.5rem;
    }

    .mt-4 {
      margin-top: 1.5rem;
    }

    .ms-1 {
      margin-left: 0.25rem;
    }

    .mb-2 {
      margin-bottom: 0.5rem;
    }

    .mb-3 {
      margin-bottom: 1rem;
    }

    .mb-4 {
      margin-bottom: 1.5rem;
    }

    .gap-1 {
      gap: 0.25rem;
    }

    .gap-3 {
      gap: 1rem;
    }

    .pb-2 {
      padding-bottom: 0.5rem;
    }

    .pt-2 {
      padding-top: 0.5rem;
    }

    .w-100 {
      width: 100%;
    }

    .w-80 {
      width: 80%;
    }
  `
}
