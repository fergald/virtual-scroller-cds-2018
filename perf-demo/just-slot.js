// This element just slots it children and then positions them
// absolutely.

const TEMPLATE = `
<style>
  :host {
    display: block;
    position: relative;
    contain: strict;
    height: 150px;
    overflow: auto;
  }
  :host([hidden]) {
    display: none;
  }
  ::slotted(*) {
    box-sizing: border-box;
  }
  :host([layout=vertical]) ::slotted(*) {
    width: 100%;
  }
  :host([layout=horizontal]) ::slotted(*) {
    height: 100%;
  }
</style>
<slot></slot>
`;


export class JustSlot extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = TEMPLATE;
    this.position();
    new MutationObserver((records) => {this.position()});
  }

  position() {
    let y = 0;
    for (const e of this.children) {
      e.style = `position: absolute; transform: translate(0px, ${y}px)`;
      y += 150;
    }
  }
}

customElements.define('virtual-scroller', JustSlot);
