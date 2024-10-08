import "@webcomponents/custom-elements/custom-elements.min.js";
import {CHAT_API_MODELS, VISION_SUPPORTED_MODELS} from "./gpt3.js";
import { models } from "./sharedfunctions.js"

function symbolFromModel(model) {
  // check if the model is in the dictionary
  if (models.hasOwnProperty(model)) {
    return models[model];
  }
  console.log("model not found", model)
  return null;
}

// const highlightColor = "#d2f4d3";//"rgb(16, 163, 255)";
const Gpt4oMiniCost = 0.0006 / 1000;
const Gpt4oCost = 0.015 / 1000;
const Gpt4TurboCost = 0.03 / 1000;
const Gpt4Cost8kCompl = 0.06 / 1000;
const ChatGPTCost = 0.002 / 1000;


function computeCost(tokens, model) {
  var cost = 0;
  if (model == "gpt-3.5-turbo") cost = tokens * ChatGPTCost;
  else if (model == "gpt-4") cost = tokens * Gpt4Cost8kCompl;
  else if (model == "gpt-4-turbo") cost = tokens * Gpt4TurboCost;
  else if (model == "gpt-4o") cost = tokens * Gpt4oCost;
  else if (model == "gpt-4o-mini") cost = tokens * Gpt4oMiniCost;
  return cost.toFixed(5);
}

//

const minipopup = (id, { left = 0, top = 0 }) => `
<div class="popuptext" id="${id}" style="left: ${left}px; top:${top}px" name="fullpopup">
  <div id="${id}prompt" class="popupprompt">
    <div id="${id}grabbable" class="grabbable">
      <div style='position:relative; z-index:3; float:right; height:30px'>
        <span class='minibuttons symbolmodel' id="${id}temptext" style="cursor: default;" title="Temperature"></span>
        <input type="range" class="minibuttons tempslider" id="${id}temperature"  min="0" max="2" step="0.01"  title="Temperature">
        <button class='minibuttons symbolmodel' id="${id}symbol"></button>
        <button class='minibuttons regeneratebutton' id="regenerate${id}" title="Regenerate prompt (Alt+Enter)"></button>
        <button class='minibuttons pinbutton' id="pin${id}" title="Pin the popup" hidden></button>
        <button class='minibuttons minimize-button' id="minimize${id}" title="Minimize/maximize completion"></button>
        <button class='minibuttons close-button' id="mclose${id}"  title="Close popup (Esc)"></button>
      </div>
      <div id="${id}header" class="promptheader" style="white-space: pre-wrap;" title=" Double-click to expand">
      </div>
    </div>
  </div>
  <div id="${id}completion">
    <p id="${id}text" class='popupcompletion'></p>
    <div style="float:right">
      <span id="${id}probability" class="tkn_prb"></span>
      <button class='minibuttons copybutton hide' id='copy_to_clipboard${id}' style="cursor: copy;" title='Copy completion to clipboard (Alt+C)'></button>
    </div>
  </div>
</div>
`;

const flypopup = (id, { text = "", left = 0, top = 0, symbol = "🅶" }) => `
<div class="popuptext onylonthefly" id="${id}" style="left: ${left}px; top:${top}px;" name="fullpopup">
  <div id="${id}prompt" class="popupprompt">
    <div id="${id}grabbable" class="grabbable">
      <div style='position:relative; z-index:3; float:right; height:30px'>
        <span class='minibuttons symbolmodel' id="${id}temptext" style="cursor: default;" title="Temperature"></span>
        <input type="range" class="minibuttons tempslider" id="${id}temperature"  min="0" max="2" step="0.01"  title="Temperature">
        <button class='minibuttons symbolmodel' id="${id}symbol">${symbol}</button>
        <button class='minibuttons pinbutton' id="pin${id}" title="Pin the popup" hidden></button>
        <button class='minibuttons minimize-button' id="minimize${id}" title="Minimize/maximize completion"></button>
        <button class='minibuttons close-button' id="mclose${id}"  title="Close popup (Esc)"></button>
      </div>
      <div id="${id}header" class="promptheader" title="Double-click to expand">
          <b>Prompt On-the-Fly</b> (<b>Alt+P</b> - Open , <b>Alt+Enter</b> - Submit, <b>Esc</b> - Close)
      </div>
    </div>
  </div>
  <div id="${id}completion">
  <div class="textarea-container">
    <textarea contentEditable="true" id="${id}textarea" class="textarea">${text}</textarea>
    <div id="${id}mic-container">
      <button id="${id}microphone" class="microphone-button" title="Transcribe with Whisper (Tab key to start/stop)">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z"/></svg>
      </button>
      <div id="${id}loading-spinner" class="loading-spinner microphone-button" style="display: none;"></div>
    </div>
  </div>
    <button type="button" id="${id}submit" class="submitbutton" style="display:inline-block" title="Alt+Enter">Submit</button>
    <button type="button" id="${id}stop" class="submitbutton hide" title="Alt+Enter" style='background-color: red;'>Stop</button>
    <button type="button" id="${id}add2comp" class="submitbutton hide" style=" width: 65px;" title="Alt+A">Add &#8682;</button>

    <button type="button" id="${id}upload" for="${id}file" class="submitbutton" style="display:inline-block" title="Alt+U">Add Image</button>
    <input type="file" id="${id}file" style="display:none" accept="image/*">
    <button type="button" id="${id}screenshot" class="submitbutton" style="display:inline-block;" title="Alt+S">Screenshot</button>

    <div id="${id}galleryLabel" style="display:none; padding-top: 10px;">
      <span class="popupcompletion symbolmodel">▷ Images:</span>
      <button type="button" id="${id}clearButton" class="submitbutton" title="Alt+Shift+D" style="width: 120px;">Clear Images</button>      
    </div> 

    <div id="${id}imageGallery" style="display: flex; flex-wrap: wrap;"></div>
    <p id="${id}text" class='popupcompletion'></p>

    <div style="float:right">
      <span id="${id}probability" class="tkn_prb" ></span>
      <button class='minibuttons copybutton hide' id='copy_to_clipboard${id}' style="cursor: copy;" title='Copy completion to clipboard (Alt+C)'></button>
    </div>
    </div>
</div>
`;

// const messagepopup = (id, { text = "none"}) => `
// <p id="${id}text" class='popupcompletion'>${text}</p>
// `;

const chatpopup = (id, { text = "", left = 0, top = 0, symbol = "🅶" }) => `
<div class="popuptext onlychat" id="${id}" style="left: ${left}px; top:${top}px; width:520px;" name="fullpopup">
  <div id="${id}prompt" class="popupprompt">
    <div id="${id}grabbable" class="grabbable2">
      <div style='position:relative; z-index:3; float:right; height:30px'>
        <span class='minibuttons ' id="${id}temptext" style="cursor: default;" title="Temperature"></span>
        <input type="range" class="minibuttons tempslider" id="${id}temperature"  min="0" max="2" step="0.01"  title="Temperature">
        <button class='minibuttons symbolmodel' id="${id}symbol" >${symbol}</button>
        <button class='minibuttons pinbutton' id="pin${id}" title="Pin the popup" hidden></button>
        <button class='minibuttons minimize-button' id="minimize${id}" title="Minimize/maximize completion"></button>
        <button class='minibuttons close-button' id="mclose${id}"  title="Close popup (Esc)"></button>
      </div>
      <div id="${id}header" class="promptheader chatcolor" title="Double-click to expand">
      <b>ChatGPT</b> (<b>Alt+G</b> - Open , <b>Alt+Enter</b> - Submit, <b>Esc</b> - Close)
      </div>
    </div>
  </div>
  <div id="${id}completion" style="display:grid; overflow-y: auto; resize: vertical; padding: 5px; max-height: 800px">
   <div id="${id}system" class="suggestion" style="margin-top: 10px;"></div>
  </div>
    <div id="${id}chat" style="display: flex;">
      <div class="textarea-container">
        <textarea contentEditable="true" id="${id}chatarea" class="textarea">${text}</textarea>
        <div id="${id}mic-container" title="Transcribe with Whisper (Tab key to start/stop)" >
          <button id="${id}microphone" class="microphone-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z"/></svg>
          </button>
          <div id="${id}loading-spinner" class="loading-spinner microphone-button" style="display: none;"></div>
        </div>
      </div>
    </div>
    <button type="button" id="${id}submit" class="submitbutton chatsubmit" style="display:inline-block" title="Alt+Enter">Submit</button>
    <button type="button" id="${id}stop" class="submitbutton chatsubmit hide" title="Alt+Enter" style='background-color: red;'>Stop</button>

    <button type="button" id="${id}upload" for="${id}file" class="submitbutton chatsubmit" style="width: 110px; display:inline-block" title="Alt+U">Add Image</button>
    <input type="file" id="${id}file" style="display:none" accept="image/*">
    <button type="button" id="${id}screenshot" class="submitbutton chatsubmit" style="display:inline-block;" title="Alt+S">Screenshot</button>

    <div id="${id}galleryLabel" style="display:none; padding-top: 10px;">
      <span class="popupcompletion" style="color: #71a799">▷ Images:</span>
      <button type="button" id="${id}clearButton" class="submitbutton chatsubmit" title="Alt+Shift+D" style="width: 120px;">Clear Images</button>      
    </div> 
    <div id="${id}imageGallery" style="display: flex; flex-wrap: wrap;"></div>

    <div style="float:right">
        <span id="${id}probability" class="tkn_prb" ></span>
        <button class='minibuttons copybutton hide' id='copy_to_clipboard${id}' style="cursor: copy;" title='Copy completion to clipboard (Alt+C)'></button>
    </div>
</div>
`;

const styled = `
.tkn_prb {
  color: #777676;
  float: left; 
  margin-top: 0.25em;
  margin-right: 0.5em;
}

@font-face {
  font-family: 'Material Icons';
  src: url('https://fonts.googleapis.com/icon?family=Material+Icons');
}

.close-button:before  {
  font-family: 'Material Icons';
  content: '\u2715';
}
.minimize-button:before {
  font-family: 'Material Icons';
  content: '\uD83D\uDDD5';
}
.minimize-button.expanded:before {
  font-family: 'Material Icons';
  content: '\uD83D\uDDD6';
}
.copybutton:before {
  font-family: 'Material Icons';
  content: '\uD83D\uDCCB';
}
.pinbutton:before {
  font-family: 'Material Icons';
  content: '\uD83D\uDCCC';
}

.imclosebutton{
  background-color: #eb3b43;
  color: #E8EAED;
  border: none;
  border-radius: 50%;
  padding: 2px;
  margin-left: -5px;
  cursor: pointer;
  font-size: 10px;
  height: 15px;
  width: 15px;
  display: inline;
  vertical-align: middle;
}

.regeneratebutton:before {
  font-family: 'Material Icons';
  content: "\u21BB";
}
.suggestion {
    color: #e1e1e1;
    font-style: italic;
    font-size: smaller;
    display: flex;
    justify-content: space-around;
}
  }
.copybutton {
  float:right;
  margin-bottom: -.5em;
}
.chatsubmit{
  margin-bottom:3px;
  margin-top:5px;
  margin-right:5px;
  background-color: #71a799!important;
}
.textarea{
    border: 1px solid #bbbbbb;
    margin-bottom:10px;
    margin-top:10px;
    white-space: nowrap;
    display: inline-block;
    width: -webkit-fill-available;
    heigth: -webkit-fill-available;
    background-color: #202123;
    font-family: 'Roboto', sans-serif!important;
    color: #fff;
    resize: none;
    overflow: hidden;
    max-width:900px;
}
.textarea:focus{
    border: 1px solid #ffffff;
}
.textarea:hover {
    background-color: #333333; /* slightly lighter background color */
}
.textarea::placeholder {
  color: lightgray;
}
.textarea-container {
  position: relative;
  display: inline-block;
  width: -webkit-fill-available;
}
.microphone-button {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1;
  fill: gray;
}
.loading-spinner {
  margin-top: -0.8em;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.symbolmodel {
  color: #3ee2ba!important; 
}

.chatcolor {
  color: rgba(113,167,153,1)!important;
}

.grabbable {
  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;
  cursor: -moz-grab;
  cursor: -webkit-grab;
  color: #3ee2ba;
  display: block; 
  justify-content: space-between; 
  position: relative;
  height: 30px;
}
.grabbable2 {
  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;
  cursor: -moz-grab;
  cursor: -webkit-grab;
  color: #71a799;
  display: block;
  justify-content: space-between;
  position: relative;
  height: 30px;
}
.grabbable:hover {
  background: radial-gradient(closest-side,rgba(22, 92, 75, 0.8), rgba(54, 54, 54 , 0));
  z-index: 4;
}
.grabbable2:hover {
  background: radial-gradient(closest-side,rgba(113, 167, 153, 0.8), rgba(54, 54, 54 , 0));
  z-index: 4;
}

/* (Optional) Apply a "closed-hand" cursor during drag operation. */
.grabbable:active {
  cursor: grabbing;
  cursor: -moz-grabbing;
  cursor: -webkit-grabbing;
}
.submitbutton {
  background-color: #10a37f;
  color: white;
  border: white;
  border-radius: 5px;
  padding: 6px 12px;
  padding-top: 6px;
  padding-right: 12px;
  padding-bottom: 6px;
  padding-left: 12px;
  width: 100px;
  height: 30px;
}
.submitbutton:hover {
  background-color: #0f8e6c;
}
.onylonthefly{
  border: 2px solid rgb(16, 163, 127);
}
.onlychat{
  border: 2px solid #71a799;
}

.popupcompletion {
  clear: left;
  cursor: text;
  white-space: pre-wrap;
  margin-block-end: 0em;
}
.singlemessage {
  border : 1px solid #bbbbbb;
  width: fit-content;
  border-radius: 0.5em;
  background-color: rgba(22,22,22,1);
  padding: 5px;
  max-width: 88%;
}

.initialhidden {
  opacity: 0;
  transition: opacity 1s ease-in-out;
}
.reveal {
  opacity: 1;
}
.user{
 justify-items: end;
}
.user::after {
    content: "user";
    font-size: 10px;
    font-style: italic;
    color: #e1e1e1;
    float: right;
  }
.assistant{
  justify-items: start;
}
.assistant::after {
    content: "assistant";
    font-size: 10px;
    font-style: italic;
    color: #3ee2ba;
  }
.popupprompt {
  height: 2.6em;
  overflow-y: hidden;
}
.expand {
  height: auto;
  min-height: 2.6em;
}
.popuptext {
  align-items: center;
  background-color: rgba(33,33,33, 0);
  border-radius: 20px;
  color: #fff;
  display: block;
  justify-content:center;
  padding: 15px;
  position:fixed;
  width:auto;
  min-width:300px;
  max-width:900px;
  max-height: -webkit-fill-available;
  z-index: 10001;
  line-height:1.4;
  margin-right:10px!important;
  font-size: 14px;
  font-family: 'Roboto', sans-serif!important;
  resize:horizontal;
  overflow:auto;
  transform: scale(0);
  transform-origin: top left;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1), width 0.5s ease-out;
}

.enlarge{
  width: 100vw !important; /* Use 100vw instead of -webkit-fill-available */
}

.show {
  // background-color: rgba(33,33,33, 0.9);
  background:radial-gradient(at center center, rgba(33, 35, 32, 0.85) 0%, rgb(52, 53, 65) 100%);
 
  transform: scale(1);
}
.hide {
  display: none!important;
  height: auto;
}

.minibuttons{
  color: #fff;
  background-color: #000;
  cursor: pointer; 
  font-size:15px;
  border-radius: 8px;
  z-index: 2;
  height:100%;
}
.minibuttons:hover{
  background-color: #333333;
}
.invertcolor{
  color:  #000;
  background-color:#fff!important;
}
.highlighted-text {
  background-color: #175043;
}
.tempslider {
  width: 30px;
  height: 10px;
  transition: all 0.3s ease-in-out;
  }
.tempslider:hover {
    width: 100px;
  }
input[type=range] {
    -webkit-appearance: none;
    background-color: rgb(100, 100, 100);
  }
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 15px;
  background-color: var(--thumb-color);
  overflow: visible;
  cursor: pointer;
  border: 3px solid #333333;
}
pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}.hljs{background:#1e1e1e;color:#dcdcdc}.hljs-keyword,.hljs-literal,.hljs-name,.hljs-symbol{color:#569cd6}.hljs-link{color:#569cd6;text-decoration:underline}.hljs-built_in,.hljs-type{color:#4ec9b0}.hljs-class,.hljs-number{color:#b8d7a3}.hljs-meta .hljs-string,.hljs-string{color:#d69d85}.hljs-regexp,.hljs-template-tag{color:#9a5334}.hljs-formula,.hljs-function,.hljs-params,.hljs-subst,.hljs-title{color:#dcdcdc}.hljs-comment,.hljs-quote{color:#57a64a;font-style:italic}.hljs-doctag{color:#608b4e}.hljs-meta,.hljs-meta .hljs-keyword,.hljs-tag{color:#9b9b9b}.hljs-template-variable,.hljs-variable{color:#bd63c5}.hljs-attr,.hljs-attribute{color:#9cdcfe}.hljs-section{color:gold}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}.hljs-bullet,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-selector-pseudo,.hljs-selector-tag{color:#d7ba7d}.hljs-addition{background-color:#144212;display:inline-block;width:100%}.hljs-deletion{background-color:#600;display:inline-block;width:100%}
`;

class popUpClass extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  get mousePosition() {
    return JSON.parse(this.getAttribute("mousePosition") || "{}");
  }

  static get observedAttributes() {
    return ["mousePosition"];
  }

  render() {
    if (!this.shadowRoot) {
        this.attachShadow({ mode: "open" });
    }
    const style = document.createElement("style");
    style.textContent = styled;
    this.shadowRoot.appendChild(style); // here append the style to the shadowRoot
    // add script to the shadowRoot that points at local src="dist/markdown.bundle.js" 
    // const script = document.createElement("script");
    // script.src = chrome.runtime.getURL("dist/markdown.bundle.js"); // Use getURL to resolve the correct path 
    // this.shadowRoot.appendChild(script);
    this.ids = 0;
    this.tokens = 0;
    this.tokens_sent = 0;
    this.probabilities = [];
    this.showProbabilities = true;
    this.clearnewlines = true;
    this.listOfActivePopups = [];
    this.listOfUnpinnedPopups = [];
    this.listOfUndesiredStreams = [];
    this.stream_on = false;
    this.stop_stream = false;
    this.alreadyCalled = {};
  }

  //   this function update the style in shadow DOM with the new mousePosition. TO REVIEW
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "mousePosition") {
      if (this.mousePosition.left + 150 > window.innerWidth) {
        var position = this.mousePosition;
        position.left = window.innerWidth - 150;
        this.lastpop = minipopup(this.ids, position);
      } else {
        this.lastpop = minipopup(this.ids, this.mousePosition);
      }
    }
  }
  defaultpopup() {
    // Create a new element to hold the pop-up
    const popUpElement = document.createElement("div");
    popUpElement.innerHTML = this.lastpop;

    // Append the new element to the shadow root
    this.shadowRoot.appendChild(popUpElement);

    // Toggle the 'show' class on the element with the ID specified in this.ids
    setTimeout(() => {
      this.shadowRoot.getElementById(this.ids).classList.toggle("show");
    }, 10);
    // Set up event listeners for the buttons and other actions
    this.buttonForPopUp(this.ids);
    const id_symbol = `${this.ids}symbol`;
    this.togglerModel(this.ids, id_symbol);
  }

  ontheflypopup(selectionText, bodyData, cursorPosition) {
    // Create a new element to hold the pop-up

    const popUpElement = document.createElement("div");
    popUpElement.innerHTML = flypopup(this.ids, {
      text: selectionText,
      left: this.mousePosition.left,
      top: this.mousePosition.top,
      symbol: symbolFromModel(bodyData.model),
    });

    // Append the new element to the shadow root
    this.shadowRoot.appendChild(popUpElement);

    // toggle the 'show' class on the element with the ID specified in this.ids
    const element = this.shadowRoot.getElementById(this.ids);
    // attach the bodyData to the element
    element.bodyData = bodyData;
    this.updateTemperature(this.ids);
    this.runClick(this.ids);
    this.stopButton(this.ids);
    this.imageUpload(this.ids);
    this.clearButton(this.ids);
    this.screenshotButton(this.ids);
    this.showAdd2CompletionButton(this.ids);
    if (!this.imbase64arr) this.imbase64arr = {};
    if (!this.imvalids) this.imvalids = {};

    // pause for 1 second to allow the popup to be rendered
    setTimeout(() => {
      element.classList.toggle("show");
    }, 10);

    // Set up event listeners for the buttons and other actions
    this.buttonForPopUp(this.ids);
    const id_symbol = `${this.ids}symbol`;
    const symbolElement = this.shadowRoot.getElementById(id_symbol);
    symbolElement.title = bodyData.model;
    this.togglerModel(this.ids, id_symbol);

    // Get the text area element
    const txtArea = this.shadowRoot.getElementById(this.ids + "textarea");
    if (txtArea) {
      this.activateMicrophone(this.ids, txtArea);
      // Stop the event from bubbling up to the document
      this.stopBubblingEvent(txtArea);
      txtArea.addEventListener("input", (e) => {
        txtArea.style.height = "auto";
        txtArea.style.height = txtArea.scrollHeight + "px";
        if (txtArea.scrollWidth > txtArea.offsetWidth) {
          element.style.width = txtArea.scrollWidth + "px";
          // element.style.width = txtArea.scrollWidth + 'px';
          setTimeout(() => {
          element.classList.toggle("enlarge");
          }, 10);
          // set the width of the popup to the width of the text area
          txtArea.style.whiteSpace = "pre-wrap";
          
          setTimeout(() => {
          // set width = max width
          element.style.width = "100%";
          element.classList.toggle("enlarge");
          }, 500);
        }
        

        // if the wideth is greate than 900px, set the  white-space: to pre-wrap
        // if (txtArea.scrollWidth > 900) {
        //   txtArea.style.whiteSpace = 'pre-wrap';
        // }
      });

      txtArea.focus();
      txtArea.selectionEnd = txtArea.selectionStart = cursorPosition;
      txtArea.dispatchEvent(new Event("input"));
      setTimeout(() => {
        txtArea.dispatchEvent(new Event("input"));
      }, 100);
    }
  }

  chatGPTpopup(messages, bodyData, cursorPosition) {
    // Create a new element to hold the pop-up
    const popUpElement = document.createElement("div");

    // get the last message in the list
    var messageInTextArea = "";
    if (messages[messages.length - 1]["role"] == "user") {
      messageInTextArea = messages[messages.length - 1]["content"];
      messages.pop(); // remove the last message from the list
    } else {
      messageInTextArea = "";
    }
    
    popUpElement.innerHTML = chatpopup(this.ids, {
      text: messageInTextArea,
      left: this.mousePosition.left,
      top: this.mousePosition.top,
      symbol: symbolFromModel(bodyData.model),
    });

    // Append the new element to the shadow root
    this.shadowRoot.appendChild(popUpElement);

    const element = this.shadowRoot.getElementById(this.ids);
    // attach the bodyData to the element
    element.bodyData = bodyData;
    // make a copy of the messages list and attach it to the element
    element.previousMessages = messages;
    // Set the system message in the popup
    if (messages.length > 0 && messages[0]["role"] == "system") {
      this.shadowRoot.getElementById(this.ids + "system").innerText = "System: " + messages[0]["content"];
    }

    // loop over the messages and add each message to one messagepopup, append the messagepopup to the div with id = this.ids + "completion"
    var that = this; // create a reference to the current object
    for (var i = 1; i < messages.length; i++) {
      (function (index) {
        setTimeout(function () {
          var messagepopup = that.createChatElement(messages[index], that.ids + "message_" + index);
          that.shadowRoot.getElementById(that.ids + "completion").appendChild(messagepopup);
          setTimeout(() => {
            messagepopup.classList.add("reveal");
          }, 50);
        }, index * 50 + 500);
      })(i);
    }

    // toggle the 'show' class on the element with the ID specified in this.ids
    this.updateTemperature(this.ids);
    this.runClickChat(this.ids);
    this.stopButton(this.ids);
    this.imageUpload(this.ids);
    this.screenshotButton(this.ids);
    this.clearButton(this.ids);
    if (!this.imbase64arr) this.imbase64arr = {};
    if (!this.imvalids) this.imvalids = {};

    setTimeout(() => {
      element.classList.toggle("show");
    }, 10);

    // Set up event listeners for the buttons and other actions
    this.buttonForPopUp(this.ids);
    const id_symbol = `${this.ids}symbol`;
    const symbolElement = this.shadowRoot.getElementById(id_symbol);
    symbolElement.title = bodyData.model;
    this.togglerModelChat(this.ids, id_symbol);
    // Get the text area element
    const txtArea = this.shadowRoot.getElementById(this.ids + "chatarea");
    this.activateMicrophone(this.ids, txtArea);
    this.stopBubblingEvent(txtArea);
    txtArea.addEventListener("input", (e) => {
      txtArea.style.height = "auto";
      txtArea.style.height = txtArea.scrollHeight + "px";
      if (txtArea.scrollWidth > txtArea.offsetWidth) {
        // element.style.width = txtArea.scrollWidth + 'px';
        element.classList.toggle("enlarge");
        txtArea.style.whiteSpace = "pre-wrap";
        setTimeout(() => {
          element.style.width = "100%";
          element.classList.toggle("enlarge");
          }, 500);
      }
    });
    txtArea.focus();
  }

  activateMicrophone(id, textArea) {
    const microphoneButton = this.shadowRoot.getElementById(id + "microphone");
    const loadingSpinner = this.shadowRoot.getElementById(id + "loading-spinner");
    let isRecording = false;
    let mediaRecorder = null;
    let mediaStream = null;

    microphoneButton.addEventListener("click", async (e) => {
      if (!isRecording) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(mediaStream);
          const audioChunks = [];

          mediaRecorder.addEventListener("dataavailable", (event) => {
            audioChunks.push(event.data);
          });

          mediaRecorder.addEventListener("stop", async () => {
            microphoneButton.style.display = "none";
            loadingSpinner.style.display = "block";

            const audioBlob = new Blob(audioChunks);
            // send a message with the audio blob to the backgrond script

            const resp = await transcribeWithWhisper(audioBlob);
            textArea.value += resp.data;
            textArea.dispatchEvent(new Event("input"));
            microphoneButton.style.fill = "gray";
            microphoneButton.disabled = false;

            microphoneButton.style.display = "block";
            loadingSpinner.style.display = "none";
          });

          mediaRecorder.start();
          isRecording = true;
          microphoneButton.style.fill = "red";
        } catch (error) {
          console.error("Error occurred while recording audio:", error);
        }
      } else {
        mediaRecorder.stop();
        mediaStream.getTracks().forEach((track) => track.stop());
        isRecording = false;
        // disable the microphone button
        microphoneButton.disabled = true;
      }
    });
  }

  createChatElement(messages, idmessage) {
    var messagepopup = document.createElement("div");
    var innermessage = document.createElement("p");
    messagepopup.className = "popupcompletion initialhidden";

    innermessage.className = "singlemessage";
    // add to messagepoup an equivalent of the role
    messagepopup.classList.add(messages["role"]);

    // if the role is user, shift the message to the right
    if (messages["role"] == "user") {
      innermessage.innerText = messages["content"].content;

      if (Array.isArray(messages["content"].content)){
        innermessage.innerText = messages["content"].content[0].text;
        // Images are attached!
        var innerGallery = document.createElement("div");
        innerGallery.style.display = "flex";
        innerGallery.style.flexWrap = "wrap";
        var images = messages["content"].content.slice(1);
        for (let i = 0; i < images.length; i++){
          if (images[i].type == "image_url"){
            var img = document.createElement("img");
            img.src = images[i].image_url.url;
            img.style.cssText = "max-width: 300px; max-height: 50px; margin-top: 5px; margin-left: 3px; margin-right: 3px;";
            innerGallery.appendChild(img);
          }
        }

        innermessage.appendChild(innerGallery);
        this.clearGallery(idmessage.split("message_")[0]);
      }

      innermessage.style.textAlign = "right";
      // float the message to the right
      innermessage.style.float = "right";
    } else {
      innermessage.innerText = messages["content"];
      innermessage.style.textAlign = "left";
      // float the message to the left
      innermessage.style.float = "left";
      innermessage.style.color = "rgb(198 249 236)";
    }
    innermessage.id = idmessage;
    messagepopup.appendChild(innermessage);
    return messagepopup;
  }

  stopBubblingEvent(txtArea) {
    txtArea.addEventListener("keydown", (e) => {
      e.stopPropagation();
    });
    // stop the event from bubbling up to the document
    txtArea.addEventListener("keyup", (e) => {
      e.stopPropagation();
    });
  }

  pinButtons(id_target, id_button) {
    this.shadowRoot.getElementById(id_button).addEventListener("click", () => {
      // if the element is in listOfUnpinnedPopups, remove it from there. If not, add it to the list
      if (this.listOfUnpinnedPopups.includes(id_target)) {
        this.listOfUnpinnedPopups.splice(this.listOfUnpinnedPopups.indexOf(id_target), 1);
      } else {
        this.listOfUnpinnedPopups.push(id_target);
      }
      //toggle class to invertcolor
      this.shadowRoot.getElementById(id_button).classList.toggle("invertcolor");
    });
  }

  minimizeButtons(id_target, id_button) {
    const button = this.shadowRoot.getElementById(id_button);
    button.addEventListener("click", () => {
      const element = this.shadowRoot.getElementById(id_target);
      // toggle class to minimize
      this.shadowRoot.getElementById(`${id_target}completion`).classList.toggle("hide");
      // set the height and width to auto
      element.style.height = "auto";
      element.style.width = "auto";
      button.classList.toggle("expanded");
    });
    button.addEventListener("dblclick", (e) => {
      e.stopPropagation();
    });
  }
  closeButtons(id_target, id_button) {
    this.shadowRoot.getElementById(id_button).addEventListener("click", () => {
      // prevent a second click on the button to close the popup
      this.shadowRoot.getElementById(id_button).disabled = true;
      this.shadowRoot.getElementById(id_target).classList.toggle("show");
      setTimeout(() => {
        this.shadowRoot.getElementById(id_target).remove();
      }, 500);
      // if the stream is on, stop it
      if (this.stream_on) {
        this.stop_stream = true;
        this.stream_on = false;
      }
      // Clear the image gallery
      this.clearGallery(id_target);

      this.listOfActivePopups = this.listOfActivePopups.filter((item) => item !== id_target);
      // remove from listOfUnpinnedPopups if it is there
      if (this.listOfUnpinnedPopups.includes(id_target)) {
        this.listOfUnpinnedPopups.splice(this.listOfUnpinnedPopups.indexOf(id_target), 1);
      }
    });
  }

  doubleClick(id_target) {
    this.shadowRoot.getElementById(id_target + "prompt").addEventListener("dblclick", () => {
      this.shadowRoot.getElementById(id_target + "prompt").classList.toggle("expand");
      this.shadowRoot.getElementById(id_target + "grabbable").classList.toggle("expand");
    });
  }

  getPromptUserContent(textPrompt, modelToUse, targetId) {
    if (modelToUse in CHAT_API_MODELS) {
      if (this.imbase64arr[targetId] && (modelToUse in VISION_SUPPORTED_MODELS)){
        let imbase64arr = this.imbase64arr[targetId];
        let imvalids = this.imvalids[targetId];
        let contentarr = [
          {
            type: "text",
            text: textPrompt
          }
        ]
        for (let i = 0; i < imbase64arr.length; i++){
          if (imvalids[i]){
            contentarr.push({
              type: "image_url",
              image_url: {
                url: imbase64arr[i]
              }
            });
          }
        }

        textPrompt = [{ role: "user", content: contentarr}];
      }
      else {
        textPrompt = [{ role: "user", content: textPrompt }];
      }
    }
    return textPrompt;
  }

  runClick(targetId) {
    const submitButton = this.shadowRoot.getElementById(`${targetId}submit`);

    // Add click event listener to submit button if it doesn't already have one
    if (!submitButton.listener) {
      submitButton.addEventListener("click", () => {
        this.toggleRunStop(targetId);
        this.clearProbability(targetId);
        this.resetTextElement(targetId);
        // remove hide from the id text element
        this.removeHideFromCompletion(targetId);
        let modelToUse = this.getBodyData(targetId, "model");
        let textPrompt = this.getTextareaValue(targetId);
        textPrompt = this.getPromptUserContent(textPrompt, modelToUse, targetId);

        const promptObj = {
          prompt: textPrompt,
          model: modelToUse,
          temperature: this.getBodyData(targetId, "temperature"),
          max_tokens: this.getBodyData(targetId, "max_tokens"),
          popupID: targetId,
          type: "completion",
        };
        chrome.runtime.sendMessage({ text: "launchGPT", prompt: promptObj });

        // get the textarea element
        this.resetAutoWidthTextArea(targetId);
      });
    }

    // Remove <br> from textarea
    // this.removeBRFromTextarea(targetId);

    // Add keydown event listener to textarea
    this.getTextareaElement(targetId).addEventListener("keydown", this.handleKeydown.bind(this, targetId));

    // Add alt + a keydown event listener to target element
    this.shadowRoot.getElementById(targetId).addEventListener("keydown", (event) => {
      if (event.altKey && event.key === "a") {
        this.shadowRoot.getElementById(`${targetId}add2comp`).click();
      }
    });
  }

  runClickChat(targetId) {
    const submitButton = this.shadowRoot.getElementById(`${targetId}submit`);
    const txtArea = this.shadowRoot.getElementById(`${targetId}chatarea`);
    txtArea.addEventListener("keydown", this.handleKeydown.bind(this, targetId));
    // Add click event listener to submit button if it doesn't already have one
    if (!submitButton.listener) {
      submitButton.addEventListener("click", () => {
        this.toggleRunStop(targetId);
        let modelToUse = this.getBodyData(targetId, "model");
        let userTextPrompt = txtArea.value;
        txtArea.value = "";
        userTextPrompt = this.getPromptUserContent(userTextPrompt, modelToUse, targetId)[0];

        let chatElement = this.shadowRoot.getElementById(targetId);
        let previousmessages = chatElement.previousMessages;
        // add a Child to the chat element with id of id+"text", of type assistant
        let completionElement = this.shadowRoot.getElementById(targetId + "completion");
        // remove hide from the id text element
        this.removeHideFromCompletion(targetId);
        let length_messages = completionElement.children.length;
        // if there is an element with targetId + "text" , change the id to targetId + "message_" + length_messages
        if (this.shadowRoot.getElementById(targetId + "text")) {
          this.shadowRoot.getElementById(targetId + "text").id = targetId + "message_" + length_messages;
        }

        let usermessage = this.createChatElement({ role: "user", content: userTextPrompt }, targetId + "message_" + (length_messages - 1));
        completionElement.appendChild(usermessage);
        setTimeout(() => {
          usermessage.classList.add("reveal");
        }, 10);

        let assistantmessage = this.createChatElement({ role: "assistant", content: "" }, targetId + "text");
        completionElement.appendChild(assistantmessage);
        setTimeout(() => {
          assistantmessage.classList.add("reveal");
        }, 300);
        // scroll to the bottom of the chat element
        assistantmessage.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });

        // append the user text to the previous messages
        previousmessages.push(userTextPrompt);
        let textPrompt = previousmessages;
        const promptObj = {
          prompt: textPrompt,
          model: modelToUse,
          temperature: this.getBodyData(targetId, "temperature"),
          max_tokens: this.getBodyData(targetId, "max_tokens"),
          popupID: targetId,
          type: "chat",
        };

        chrome.runtime.sendMessage({ text: "launchGPT", prompt: promptObj });
      });
    }

    // this.stopBubblingEvent(txtArea);
  }

  screenshotButton(targetId) {
    const buttonobj = this.shadowRoot.getElementById(`${targetId}screenshot`);
    if (!buttonobj.listener) {
      buttonobj.addEventListener("click", async () => {
        // Hide all popups
        for (const element of this.shadowRoot.querySelectorAll("div[name='fullpopup']")) {
          element.classList.toggle("hide");
        }
      
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: "takeScreenCapture"}, (response) => {
            // response.data is the image in base64
            if (response && !response.error) {
              // Change cursor to crosshair
              document.body.style.cursor = "crosshair";
              // Create a new image element
              // Disable dragging of document elements
              document.body.style.userSelect = "none";

              let img = getImage(response.data, "screenshot");
              // Darken the image display
              img.style.filter = "brightness(0.7)";
              // Put the image on top of the other elements
              img.style.zIndex = "10000";

              // Disable scrolling
              document.body.style.overflow = "hidden";

              // Brightened image
              let brightenedImg = getImage(response.data, "brightened_selection");
              brightenedImg.style.zIndex = "10001";
              brightenedImg.style.display = "none";
              
              // Append the image to the body
              document.body.appendChild(img);
              document.body.appendChild(brightenedImg);

              // Add global keydown listener
              let imgKeyDownHandler = this.handleKeyDownImg.bind(this, targetId);
              document.addEventListener("keydown", imgKeyDownHandler);

              console.log("Image created!");
              // Wait for the user to crop a region
              let screenshotCancelHandler = null;
              let mouseUpHandler = null;
              let mouseMoveHandler = null;
              screenshotCancelHandler = () => {
                handleScreenshotCancel(img, targetId, brightenedImg, mouseMoveHandler, mouseUpHandler, screenshotCancelHandler, imgKeyDownHandler, this);
              }
              document.addEventListener("cancel", screenshotCancelHandler);

              img.addEventListener("mousedown", (e) => {
                const startX = e.clientX;
                const startY = e.clientY;

                mouseMoveHandler = (e) => handleMouseMove(e, startX, startY, brightenedImg);
                document.addEventListener("mousemove", mouseMoveHandler);
                mouseUpHandler = (e) => {
                  handleMouseUp(e, startX, startY, targetId, img, brightenedImg, mouseMoveHandler, mouseUpHandler, screenshotCancelHandler, imgKeyDownHandler, this);
                };
                document.addEventListener("mouseup", mouseUpHandler);

              });
            } else{
              if (response.error === "Permission denied"){
                // Create a popup to ask for permission
                alert("To take a screen capture, the extension needs to access the current tab.")
              }
            }
          });
        }, 50);
      });
    }
  }

  resetAutoWidthTextArea(targetId) {
    const textarea = this.getTextareaElement(targetId);
    // set the width of the text are to-webkit-fill-available
    textarea.style.width = "-webkit-fill-available";
  }

  removeHideFromCompletion(targetId) {
    this.shadowRoot.getElementById(`${targetId}completion`).classList.remove("hide");
  }
  clearProbability(targetId) {
    this.shadowRoot.getElementById(`${targetId}probability`).innerHTML = "";
  }

  resetTextElement(targetId) {
    this.shadowRoot.getElementById(`${targetId}text`).innerHTML = "";
    const element = this.shadowRoot.getElementById(targetId);
    element.preText = "";
  }

  getTextareaValue(targetId) {
    return this.shadowRoot.getElementById(`${targetId}textarea`).value;
  }

  getBodyData(targetId, property) {
    return this.shadowRoot.getElementById(targetId).bodyData[property];
  }

  getTextareaElement(targetId) {
    return this.shadowRoot.getElementById(`${targetId}textarea`);
  }

  removeBRFromTextarea(targetId) {
    const textarea = this.getTextareaElement(targetId);
    textarea.addEventListener("keydown", (e) => {
      if (e.target.innerHTML.includes("<br>")) {
        e.target.innerHTML = e.target.innerHTML.replace(/<br>/g, "");
      }
    });
    this.putCursorAtTheEnd(textarea);
  }

  handleKeyDownImg(targetId, e) {
    if (e.key === "Escape") {
      console.log("Sending cancel message.");
      const cancel = new CustomEvent("cancel");
      document.dispatchEvent(cancel);
    }
  }

  handleKeydown(targetId, e) {
    if (e.key === "Escape") {
      this.closePopup(targetId);
    }
    else if (e.key === "Tab") {
      e.preventDefault();
      if (this.shadowRoot.getElementById(`${targetId}microphone`)) {
        this.shadowRoot.getElementById(`${targetId}microphone`).click();
      }
    } else if (e.altKey) {
      e.preventDefault();
      if (e.key === "Enter") {
        this.submitOrStop(targetId);
      } else if (e.key === "c") {
        this.clickCopyToClipboard(targetId);
      } else if (e.key === "a" && this.shadowRoot.getElementById(`${targetId}add2comp`)) {
        this.shadowRoot.getElementById(`${targetId}add2comp`).click();
      } else if (e.key === "u" && this.shadowRoot.getElementById(`${targetId}upload`)) {
        this.shadowRoot.getElementById(`${targetId}upload`).click();
      } else if (e.key === "s" && this.shadowRoot.getElementById(`${targetId}screenshot`)) {
        this.shadowRoot.getElementById(`${targetId}screenshot`).click();
      }
    }
  }

  submitOrStop(targetId) {
    const submitButton = this.shadowRoot.getElementById(`${targetId}submit`);
    if (!submitButton.classList.contains("hide")) {
      submitButton.click();
    } else {
      this.shadowRoot.getElementById(`${targetId}stop`).click();
    }
  }

  closePopup(targetId) {
    const closePopup = this.shadowRoot.getElementById(`mclose${targetId}`);
    if (closePopup) {
      closePopup.click();
    }
  }

  clickCopyToClipboard(targetId) {
    const copyButton = this.shadowRoot.getElementById(`copy_to_clipboard${targetId}`);
    if (copyButton) {
      copyButton.click();
    }
  }

  regenerateOrRun(id_target) {
    const regenerateButton = this.shadowRoot.getElementById(`regenerate${id_target}`);
    if (regenerateButton) {
      regenerateButton.click();
    } else {
      const runButton = this.shadowRoot.getElementById(`${id_target}submit`);
      if (runButton) {
        runButton.click();
      }
    }
  }

  addImageToGallery(id_target, dataUrl) {
    /* 
    1. Adds image to gallery object
    2. Handles the close button for the image
    3. Adds image (in base64 dataURL form) to the global variable
    */
    const gallery = this.shadowRoot.getElementById(id_target + "imageGallery");
    if (!this.imbase64arr[id_target] || this.imbase64arr[id_target].length === 0) {
      let galleryLabel = this.shadowRoot.getElementById(id_target + "galleryLabel");
      galleryLabel.style.display = "block";
      // this.shadowRoot.getElementById(id_target + "clearButton").style.display = "inline-block";

      this.imbase64arr[id_target] = [dataUrl];
      this.imvalids[id_target] = [true];
    }
    else {
      this.imbase64arr[id_target].push(dataUrl);
      this.imvalids[id_target].push(true);
    }

    const image = document.createElement("img");
    image.src = dataUrl;
    image.style.cssText = "max-width: 300px; max-height: 50px; margin-top: 5px;";
    image.id = `${id_target}_${this.imbase64arr[id_target].length}image`;
    gallery.appendChild(image);

    const xbutton = document.createElement("button");
    xbutton.innerHTML = "x";
    xbutton.className = "imclosebutton";
    xbutton.id = `${id_target}_${this.imbase64arr[id_target].length}xbutton`;

    xbutton.addEventListener("click", () => {
      this.shadowRoot.getElementById(image.id).remove();
      this.shadowRoot.getElementById(xbutton.id).remove();

      let image_idx = parseInt(image.id.split("_")[1].split("image")[0]) - 1;
      this.imvalids[id_target][image_idx] = false; // mark the image as invalid -> don't send it to the model
      // console.log("Closing image");
      if (this.imvalids[id_target].every((val) => val === false)){
        // console.log("Clearing gallery.");
        this.clearGallery(id_target);
      }
    });
    gallery.appendChild(xbutton);
  }

  clearGallery(id_target){
    const gallery = this.shadowRoot.getElementById(id_target + "imageGallery");
    gallery.innerHTML = "";

    // Reset the global image array
    this.imbase64arr[id_target] = [];
    this.imvalids[id_target] = [];

    this.shadowRoot.getElementById(id_target + "galleryLabel").style.display = "none";
  }

  clearButton(id_target) {
    this.shadowRoot.getElementById(id_target + "clearButton").addEventListener("click", () => {
      this.clearGallery(id_target);
    });
  }

  enableImageSupport(id_target){
    this.shadowRoot.getElementById(id_target + "upload").style.display = "inline-block";
    this.shadowRoot.getElementById(id_target + "screenshot").style.display = "inline-block";
    this.shadowRoot.getElementById(id_target + "imageGallery").style.display = "block";

    if (this.imbase64arr[id_target] && this.imbase64arr[id_target].length > 0 && this.imvalids[id_target].some((val) => val === true)){
      this.shadowRoot.getElementById(id_target + "galleryLabel").style.display = "block";
    }
  }

  disableImageSupport(id_target){
    let uploadButton = this.shadowRoot.getElementById(id_target + "upload");
    let galleryLabel = this.shadowRoot.getElementById(id_target + "galleryLabel");
    let imageGallery = this.shadowRoot.getElementById(id_target + "imageGallery");
    let screenshotButton = this.shadowRoot.getElementById(id_target + "screenshot");
    uploadButton.style.display = "none";
    galleryLabel.style.display = "none";
    imageGallery.style.display = "none";
    screenshotButton.style.display = "none";
    // galleryLabel.whiteSpace = "nowrap";
  }

  imageUpload(id_target) {
    const uploadButton = this.shadowRoot.getElementById(id_target + "upload");
    if (!uploadButton.listener) {  
      const reader = new FileReader();
      reader.onloadend = function (e) {
        const base64 = e.target.result //.split(",")[1];
        this.caller.addImageToGallery(id_target, base64);
      };

      // Listen for file upload
      this.shadowRoot.getElementById(id_target + "file").addEventListener("change", (e) => {
        const file = e.target.files[0];
        reader.caller = this;
        reader.readAsDataURL(file);
      });

      uploadButton.addEventListener("click", () => {
        // Trigger file upload behavior
        this.shadowRoot.getElementById(id_target + "file").click();
        this.shadowRoot.getElementById(id_target + "file").value = "";        
      });
    }
  }

  stopButton(id_target) {
    this.shadowRoot.getElementById(id_target + "stop").addEventListener("click", () => {
      this.stop_stream = id_target;
      this.toggleRunStop(id_target);
    });
  }

  toggleRunStop(id_target) {
    if (this.shadowRoot.getElementById(id_target + "submit")) {
      this.shadowRoot.getElementById(id_target + "submit").classList.toggle("hide");
      this.shadowRoot.getElementById(id_target + "stop").classList.toggle("hide");
    }
  }
  copyButtonListener(id_target) {
    this.shadowRoot.getElementById("copy_to_clipboard" + id_target).addEventListener("click", () => {
      this.copyToClipboard(this.shadowRoot.getElementById(id_target + "text").innerText);
      this.shadowRoot.getElementById("copy_to_clipboard" + id_target).classList.toggle("invertcolor");
      setTimeout(() => {
        this.shadowRoot.getElementById("copy_to_clipboard" + id_target).classList.toggle("invertcolor");
      }, 500);
    });
  }
  togglerModelChat(id_target, id_symbol) {
    //prevent double click to propagate to the parent
    const symbolElement = this.shadowRoot.getElementById(id_symbol);
    symbolElement.addEventListener("dblclick", (event) => {
      event.stopPropagation();
    });

    symbolElement.addEventListener("click", (event) => {
      // toggle across the models, updating  element.bodyData.model
      const element = this.shadowRoot.getElementById(id_target);
      const model = element.bodyData.model;
      if (model === "gpt-4") {
        element.bodyData.model = "gpt-4-turbo";
        symbolElement.innerHTML = models["gpt-4-turbo"];
      } else if (model == "gpt-4-turbo") {
        element.bodyData.model = "gpt-4o";
        symbolElement.innerHTML = models["gpt-4o"];
      } else if (model == "gpt-4o") {
        element.bodyData.model = "gpt-4o-mini";
        symbolElement.innerHTML = models["gpt-4o-mini"];
      } else if (model == "gpt-4o-mini") {
        element.bodyData.model = "gpt-3.5-turbo";
        symbolElement.innerHTML = models["gpt-3.5-turbo"];
      } else if (model === "gpt-3.5-turbo") {
        element.bodyData.model = "gpt-4";
        symbolElement.innerHTML = models["gpt-4"];
      }

      if (element.bodyData.model in VISION_SUPPORTED_MODELS) {
        this.enableImageSupport(id_target);
      }
      else {
        this.disableImageSupport(id_target);
      }

      symbolElement.title = element.bodyData.model;
    });
  }
  togglerModel(id_target, id_symbol) {
    //prevent double click to propagate to the parent
    const symbolElement = this.shadowRoot.getElementById(id_symbol);
    symbolElement.addEventListener("dblclick", (event) => {
      event.stopPropagation();
    });

    symbolElement.addEventListener("click", (event) => {
      // toggle across the models, updating  element.bodyData.model
      const element = this.shadowRoot.getElementById(id_target);
      const model = element.bodyData.model;
      if (model === "gpt-4") {
        element.bodyData.model = "gpt-3.5-turbo";
        symbolElement.innerHTML = models["gpt-3.5-turbo"];
      } else if (model === "gpt-3.5-turbo") {
        element.bodyData.model = "gpt-4-turbo";
        symbolElement.innerHTML = models["gpt-4-turbo"];
      } else if (model === "gpt-4-turbo") {
        element.bodyData.model = "gpt-4o";
        symbolElement.innerHTML = models["gpt-4o"];
      } else if (model == "gpt-4o") {
        element.bodyData.model = "gpt-4o-mini";
        symbolElement.innerHTML = models["gpt-4o-mini"];
      } else if (model === "gpt-4o-mini") {
        element.bodyData.model = "gpt-4";
        symbolElement.innerHTML = models["gpt-4"];
      } else {
        // default
        element.bodyData.model = "gpt-4-turbo";
        symbolElement.innerHTML = models["gpt-4-turbo"];
      }

      if (element.bodyData.model in VISION_SUPPORTED_MODELS) {
        this.enableImageSupport(id_target);
      }
      else {
        this.disableImageSupport(id_target);
      }

      symbolElement.title = element.bodyData.model;
    });
  }

  showAdd2CompletionButton(id_target) {
    // select the ${id}text of the popup, and detect if text is added
    const mainElem = this.shadowRoot.getElementById(id_target);
    const targetNode = this.shadowRoot.getElementById(id_target + "text");
    const add2comp = this.shadowRoot.getElementById(id_target + "add2comp");
    const textarea = this.shadowRoot.getElementById(id_target + "textarea");
    // get copy to clipboard button
    const copyButton = this.shadowRoot.getElementById(`copy_to_clipboard${id_target}`);
    // let highlightId = 0;

    add2comp.addEventListener("click", () => {
      // console.log(" textarea.innerHTML", textarea.innerHTML.replace("\n", "*"));
      // console.log("preText", mainElem.preText.replace("\n", "*"));
      // console.log(" targetNode.innerHTML", targetNode.innerHTML.replace("\n", "*"));
      textarea.value += mainElem.preText + targetNode.innerText;
      mainElem.preText = "";
      targetNode.innerText = "";
      this.putCursorAtTheEnd(textarea);

      // add2comp.classList.add('hide');
      copyButton.classList.add("hide");
      // trigger input event to update the textarea
    });

    const observer = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          // if text is added
          add2comp.classList.remove("hide");
        } else if (mutation.type === "childList" && mutation.removedNodes.length) {
          // if text is removed
          add2comp.classList.add("hide");
        }
      }
    });

    const config = { childList: true };
    observer.observe(targetNode, config);
  }

  putCursorAtTheEnd(textarea) {
    const event = new Event("input");
    textarea.dispatchEvent(event);
    textarea.focus();
    textarea.selectionEnd = textarea.selectionStart = textarea.value.length;
  }

  updateTemperature(id_target) {
    // read the temperature from the element.bodyData.temperature
    const element = this.shadowRoot.getElementById(id_target);
    const temperature = element.bodyData.temperature;
    // update the temperature slider
    const temperatureSlider = this.shadowRoot.getElementById(id_target + "temperature");
    temperatureSlider.value = temperature;
    temperatureSlider.style.setProperty("--thumb-color", `hsl(${240 - temperature * 120}, 100%, 50%)`);
    // update the temperatureSlider title
    temperatureSlider.title = "Temperature: " + temperature;
    // update the temperature listner
    temperatureSlider.addEventListener("input", function () {
      var value = this.value;
      var thumb = this.previousElementSibling;
      // parse the value as 2 decimal float
      value = parseFloat(value).toFixed(2);
      this.title = "Temperature: " + value;
      thumb.textContent = value;
      // update the temperature in the element.bodyData.temperature as float
      element.bodyData.temperature = parseFloat(value);
      //color the thumb
      this.style.setProperty("--thumb-color", `hsl(${240 - this.value * 120}, 100%, 50%)`);
    });
  }

  buttonForPopUp(id_target) {
    const id_pin = `pin${id_target}`;
    const id_close = `mclose${id_target}`;
    const id_minimize = `minimize${id_target}`;
    this.pinButtons(id_target, id_pin);
    this.minimizeButtons(id_target, id_minimize);
    this.closeButtons(id_target, id_close);
    this.doubleClick(id_target);
    this.copyButtonListener(id_target);
    this.keysShortcuts(id_target);
  }

  keysShortcuts(id_target) {
    let popupElement = this.shadowRoot.getElementById(id_target);
    popupElement.tabIndex = -1; // allow the element to receive focus and listen to keyboard events even if it is not in the natural tab order of the document
    popupElement.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closePopup(id_target);
      } else if (event.key === "Tab") {
        // if the user press tab and the element microphone exists, click on it
        event.preventDefault();
        if (this.shadowRoot.getElementById(id_target + "microphone")) {
          this.shadowRoot.getElementById(id_target + "microphone").click();
        } 
      } else if (event.altKey) {
        event.preventDefault();
        if (event.key === "c") {
          this.clickCopyToClipboard(id_target);
        } else if (event.key === "Enter") {
          this.regenerateOrRun(id_target);
        }
      }
      // capture the event and prevent it from bubbling up
      event.stopPropagation();
    });
  }

  showCopyToClipboardBtn(target_id) {
    this.shadowRoot.getElementById("copy_to_clipboard" + target_id).classList.remove("hide");
  }

  updatePopupHeader(request, targetId) {
    // reset
    this.probabilities = [];
    this.clearnewlines = true;
    this.tokens = 0;
    // console.log("request.tokens_sent", request.tokens_sent);
    // transfer the tokens_sent to integer
    this.tokens_sent = parseInt(request.tokens_sent);

    chrome.storage.sync.get(["advancedSettings"], (result) => {
      this.showProbabilities = result.advancedSettings.showProb;
      this.autoAdd = result.advancedSettings.autoAdd;
      // this.autoAdd = true;
    });

    const element = this.shadowRoot.getElementById(targetId);
    element.bodyData = request.bodyData;
    element.text = request.text;
    element.preText = "";
    this.updateTemperature(targetId);

    const symbol = symbolFromModel(request.bodyData.model);
    this.shadowRoot.getElementById(`${targetId}symbol`).innerHTML = symbol;
    this.shadowRoot.getElementById(`${targetId}symbol`).title = request.bodyData.model;
    let lastElementIndex = request.text.length - 1;
    let content = request.text[lastElementIndex].content;
    let header_content;

    if (Array.isArray(content)) {
        header_content = JSON.stringify(content[0].text || "");
    } else {
        header_content = JSON.stringify(content || "");
    }
    this.shadowRoot.getElementById(`${targetId}header`).innerHTML = `<i> ${ 
      header_content
    } </i>`;

    if (this.shadowRoot.getElementById(`regenerate${targetId}`)) {
      if (!this.alreadyCalled[targetId]) {
        this.regenerateButton(targetId, element);
        this.alreadyCalled[targetId] = true;
      }
    }
  }

  regenerateButton(targetId, element) {
    this.shadowRoot.getElementById(`regenerate${targetId}`).addEventListener("click", () => {
      if (this.stream_on == true) {
        this.stop_stream = true;
      } //stop the actual stream if it is on, and then restart it (remains on)
      const textElement = this.shadowRoot.getElementById(`${targetId}text`);
      textElement.innerHTML = "";

      this.removeHideFromCompletion(targetId);
      this.clearProbability(targetId);
      console.log("regenerate", element.text);
      var promptDict = {
        prompt: element.text,
        model: element.bodyData.model,
        temperature: element.bodyData.temperature,
        max_tokens: element.bodyData.max_tokens,
        popupID: targetId,
      };
      chrome.runtime.sendMessage({ text: "launchGPT", prompt: promptDict });
      // remove hide from the id text element
    });
  }

  copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // console.log('Text copied to clipboard');
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  computeProbability(message) {
    if (this.showProbabilities && message.choices[0].logprobs) {
      // get logprobs
      var logprobs = message.choices[0].logprobs.token_logprobs[0];
      // convert logprobs to probabilities
      var probs = Math.exp(logprobs);
      // add to list this.probabilities
      // check that probs is not NaN
      if (probs !== undefined) {
        this.probabilities.push(probs);
      }
    }
  }

  updateProbability(id, return_prob = false) {
    if (this.probabilities.length > 0 && this.showProbabilities) {
      const probability = (100 * this.probabilities.reduce((a, b) => a + b, 0)) / this.probabilities.length;
      const tokens = this.tokens;
      this.shadowRoot.getElementById(id).innerHTML = tokens + " tokens - avg. prob.: " + probability.toFixed(2) + "%";
      if (return_prob) {
        return probability.toFixed(2);
      }
    }
  }

  updatepopup(message, target_id, stream) {
    /*
    Update the given popup with a message from the model.
    */

    const textarea = this.shadowRoot.getElementById(target_id + "textarea");
    const chatarea = this.shadowRoot.getElementById(target_id + "chat");
    const element = this.shadowRoot.getElementById(target_id);
    const promptarea = this.shadowRoot.getElementById(target_id + "text");
    var specialCase = false;
    if (textarea && this.autoAdd) {
      specialCase = true;
    }

    //if stream is true
    if (stream) {
      this.stream_on = true;
      var text = "";
      // if choices is a key in message, it means usual stream
      if (message.choices) {
        // check if choices[0] has text or message
        const envelope = message.choices[0];
        if (envelope.delta) {
          if (envelope.delta.content) {
            text = envelope.delta.content;
          } else if (envelope.delta.role) {
            text = "";
            return;
          } else {
            text = "";
          }
        }
        else if (envelope.text) {
          text = envelope.text;
        } else if (envelope.message){
          text = envelope.message.content;
        }
        // if the first charcters are newlines character, we don't add it to the popup, but save it in a string
        if (this.clearnewlines && (text == "\n" || text == "\n\n")) {
          element.preText += text;
          if (specialCase) {
            // add text to textarea
            textarea.value += text;
            element.preText = "";
          }
          return;
        } 
        
        else {
          this.computeProbability(message);
          this.updateProbability(this.ids + "probability");
          this.clearnewlines = false;
          // check if element {target_id}textarea exists
          if (specialCase && textarea) {
            // add text to textarea
            textarea.value += text;
            const event = new Event("input");
            textarea.dispatchEvent(event);
          } else {
            // add text to usual completion
            //check the bodyData of the element

            promptarea.innerText += text;
            // check for markdown

            promptarea.scrollIntoView({ behavior: "auto", block: "end" });
          }
        }
      }
      // if message has a key "error"
      else if (message.error) {
        var text = message.error.message;
        var type = message.error.type;
        promptarea.innerHTML += type + "<br>" + text;
        this.tokens = 0;
        this.stream_on = false;
        //show run button and hide stop button
        this.toggleRunStop(target_id);
      }
      // each message should be 1 token
      this.tokens++;
    } 
    else {    // Not streaming!
      if (specialCase && textarea) {
        // do nothing
      } 
      else {
        updateMarkdownContent(promptarea, promptarea.innerText);
        // scroll to the end of the promptarea
        promptarea.scrollIntoView({ behavior: "auto", block: "end" });
      }
      // if stream is false, it means that the stream is over
      this.stream_on = false;
      // compute the probability, get average of element in this.probabilities
      const final_prob = this.updateProbability(target_id + "probability", true);
      // show run button and hide stop button
      this.toggleRunStop(target_id);
      const complete_completion = promptarea.innerText;
      
      //save prompt to local storage
      const bodyData = JSON.parse(message.bodyData);
      const model = bodyData.model;
      const cost = computeCost(this.tokens + this.tokens_sent, model);
      // update in bodyData the final probability in logprobs
      if (final_prob !== undefined){
          bodyData.logprobs = final_prob + " %";
      }

      // focus depending on the case
      if (textarea) {
        textarea.focus();
      } else if (chatarea) {
        chatarea.focus();
        this.showCopyToClipboardBtn(target_id);
        element.previousMessages.push({ role: "assistant", content: complete_completion });
      } else {
        element.focus();
      }

      if (specialCase) {
        this.putCursorAtTheEnd(textarea);
      } else {
        this.showCopyToClipboardBtn(target_id);
      }

      // save the completion in the history
      chrome.storage.local.get("history", function (items) {
        if (typeof items.history !== "undefined") {
          items.history.push([JSON.stringify(bodyData), complete_completion, cost]); // add the result to the history
          chrome.storage.local.set({ history: items.history });
        } else {
          items.history = [[JSON.stringify(bodyData), complete_completion, cost]]; // initialize the history array
          chrome.storage.local.set({ history: items.history });
        }
      });
    }
  }
}

function getImage(src, id){
  const img = new Image();
  img.src = src
  img.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%;";
  img.id = id;

  // Disable pointer events in the document
  // document.body.style.pointerEvents = "none";
  // Disable dragging of the image
  img.ondragstart = () => false;

  return img;
}

function handleMouseMove(e, startX, startY, brightenedImg) {
  // Undo brightness filter within the selection
  
  // Calculate the minimum and maximum x and y values
  const minX = Math.min(e.clientX, startX);
  const maxX = Math.max(e.clientX, startX);
  const minY = Math.min(e.clientY, startY);
  const maxY = Math.max(e.clientY, startY);

  // Calculate the top, right, bottom, and left offsets for the inset
  const top = minY + 'px';
  const right = (window.innerWidth - maxX) + 'px';
  const bottom = (window.innerHeight - maxY) + 'px';
  const left = minX + 'px';

  // Set the clipPath style
  brightenedImg.style.clipPath = `inset(${top} ${right} ${bottom} ${left})`;

  if (brightenedImg.style.display === "none") {
    // console.log("Displaying brightened image.");
    brightenedImg.style.display = "block";
  }  
}

function handleMouseUp(e, startX, startY, targetId, img, brightenedImg, mouseMoveHandler, mouseUpHandler, screenshotCancelHandler, imgKeyDownHandler, popupParent) {
  // console.log("Mousing up.");
  // console.log(mouseMoveHandler, mouseUpHandler);

  const endX = e.clientX;
  const endY = e.clientY;
  const xScale = img.naturalWidth / img.width;
  const yScale = img.naturalHeight / img.height;
  const width = Math.abs(endX - startX) * xScale;
  const height = Math.abs(endY - startY) * yScale;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, xScale * Math.min(startX, endX), yScale * Math.min(startY, endY), width, height, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/png");

  popupParent.addImageToGallery(targetId, dataUrl);

  // Restore all popups
  for (const element of popupParent.shadowRoot.querySelectorAll("div[name='fullpopup']")) {
    element.classList.toggle("hide");
  }

  document.removeEventListener("mousemove", mouseMoveHandler);
  document.removeEventListener("mouseup", mouseUpHandler);
  document.removeEventListener("cancel", screenshotCancelHandler);
  document.removeEventListener("keydown", imgKeyDownHandler);

  // Restore document
  document.body.style.cursor = "default";
  document.body.removeChild(img);
  document.body.removeChild(brightenedImg);
  document.body.style.overflow = "auto";
  document.body.style.userSelect = "auto";
}

function handleScreenshotCancel(img, targetId, brightenedImg, mouseMoveHandler, mouseUpHandler, screenshotCancelHandler, imgKeyDownHandler, popupParent) {
  // console.log("Cancelling screenshot.");
  
  // Restore all popups
  for (const element of popupParent.shadowRoot.querySelectorAll("div[name='fullpopup']")) {
    element.classList.toggle("hide");
  }
  // Restore document
  document.body.style.cursor = "default";
  document.body.removeChild(img);
  document.body.removeChild(brightenedImg);
  document.body.style.overflow = "auto";
  document.body.style.userSelect = "auto";

  // Remove event listeners
  if (mouseMoveHandler) document.removeEventListener("mousemove", mouseMoveHandler);
  if (mouseUpHandler) document.removeEventListener("mouseup", mouseUpHandler);
  document.removeEventListener("cancel", screenshotCancelHandler);
  document.removeEventListener("keydown", imgKeyDownHandler);
}

function updateMarkdownContent(markdownContainer, markdownText) {
  // Wait for the renderMarkdown function to be available
  function waitForRenderMarkdown() {
    if (window.renderMarkdown) {
      // Use the renderMarkdown function to convert the Markdown text to HTML
      const renderedHtml = window.renderMarkdown(markdownText);

      // Find the Markdown container in the chat popup element and update its content
      if (markdownContainer) {
        markdownContainer.innerHTML = renderedHtml;
      }
    } else {
      // If the renderMarkdown function is not yet available, try again after a short delay
      setTimeout(waitForRenderMarkdown, 100);
    }
  }

  // Start waiting for the renderMarkdown function
  waitForRenderMarkdown();
}

window.customElements.define("mini-popup", popUpClass);

async function transcribeWithWhisper(audio) {
  return new Promise(async (resolve, reject) => {
    const arrayBuffer = await audio.arrayBuffer();
    const wavBuffer = await convertToWav(arrayBuffer);
    const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
    const wavUrl = URL.createObjectURL(wavBlob);
    chrome.runtime.sendMessage({ action: "transcribeAudio", audio: wavUrl }, (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

import WavEncoder from "wav-encoder";

async function convertToWav(arrayBuffer) {
  // Use the 'audio/webm' format to create an audio buffer from the input arrayBuffer
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Create a WAV file from the audio buffer
  // const wavEncoder = new WavEncoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate);
  const wavBuffer = await WavEncoder.encode({
    sampleRate: audioBuffer.sampleRate,
    channelData: [audioBuffer.getChannelData(0)],
  });
  return wavBuffer;
}
