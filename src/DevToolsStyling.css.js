// Ideally, we would use a dedicated CSS file, but I dind't find a good way to load the styles from a dedicated CSS file.
// So we just use a function that returns the CSS content as a string.
// For better syntax highlighting, you can set the language to CSS in the editor for this file.
export const cssContent = () => {
  return `
    :host {
      all: initial;
      font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
      font-size: 16px !important;
    }

    * {
      box-sizing: border-box;
    }

    /* Debug bubble */
    #debug-bubble {
      display: flex;
      background-color: hsl(0deg 0% 0% / 60%);
      border-radius: 50%;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      z-index: 10000000;
      position: fixed;
      top: 10px;
      left: 10px;

      /* Keep width, height, and border in sync with bubbleSize in DebugBubble.js */
      width: 4.75rem;
      height: 4.75rem;
      border: 0.3rem solid rgba(136, 136, 136, 0.5);
    }

    #debug-bubble svg {
      transform: scale(0.6);
      fill: #b1b1b1;
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
      z-index: 10000001;
    }

    .bottom-sheet .sheet-overlay {
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

    .bottom-sheet .tab-action-bar button {
      background-color: transparent;
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5em;
      height: 100%;
    }

    .bottom-sheet .tab-action-bar button:active svg {
      fill: #6c6c6c;
    }

    .bottom-sheet .btn-clear-tab,
    .bottom-sheet .btn-reload-tab {
      margin-left: auto;
    }
    .bottom-sheet .btn-clear-tab svg,
    .bottom-sheet .btn-reload-tab svg {
      width: 1rem;
      height: 1rem;
      fill: white;
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
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .tablist .tablink.active {
      background-color: #31363f;
      color: white;
    }

    .tab-contents {
      height: 100%;
      overflow: scroll;
    }

    .outer-tab-content {
      display: none;
      border-top: none;
      height: 100%;
      overflow: scroll;
      background-color: hsl(0deg 0% 0% / 80%);
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

    .tab-empty-content {
      display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;
      padding: 1em;
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

    .bottom-sheet .viewstack-card.active {
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

    /* Bottom Sheet Bridge Components */
    .bottom-sheet .bridge-components-collapse-btn {
      background: none;
      border: none;
      color: white;
      width: 100%;
      text-align: left;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5em;
    }

    .tab-content-bridge-components {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      border-bottom: 1px solid #c5c1c1;
      padding: 0.5em 0em;
    }

    .tab-content-bridge-components .bridge-component {
      position: relative;
      padding-left: 15px;
    }

    .tab-content-bridge-components .bridge-component::before {
      content: "•";
      color: #eee;
      font-size: 1.2em;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
    }

    /* Collapsibles */
    .collapse:after {
      content: '\\25BC';
      font-size: 13px;
      color: #777;
      float: right;
      margin-left: 5px;
    }

    .collapse.active:after {
      content: "\\25B2";
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

    .no-wrap {
      overflow: hidden;
      white-space: nowrap;
    }

    .white-space-collapse {
      white-space: collapse;
    }

    .mt-1 {
      margin-top: 0.25rem;
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
