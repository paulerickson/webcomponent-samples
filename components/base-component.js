/**
 * Simple data-binding custom element
 *
 * Subclasses MUST defined a class-level `template` attribute with a template node.  Example:
 *   MyComponent.template = document.currentScript.ownerDocument.getElementById('my-component-template');
 *
 * It provides basic two-way data binding between data attributes (i.e. attributes starting with 'data-'*) and dom
 * elements with a corresponding name (i.e. '[name="bind-data-X"]'.  If a 'change' event is dispatched from such an
 * element, the matching attribute will be updated.
 *
 * 1. Declare observed attributes (only 'data-[a-z]*' attributes get data binding)
 *   static get observedAttributes() {
 *     return ['data-spam', 'data-eggs', 'data-ham', 'somethingElse'];
 *   }
 *
 * 2. Bind elements of the dom by name (the bound attribute will go in value and textContent)
 *   <template id="my-template">
 *       <h1 name="bind-data-spam"></h1>
 *       <input name="bind-data-spam">
 *   </template>
 *
 * *Caveat: only attributes with a lowercase single-word suffix will be bound; 'data-score' is okay, but
 * 'data-high-score' or 'data-highScore' won't work.
 */
BaseComponent = typeof BaseComponent !== 'undefined' ? BaseComponent : class extends HTMLElement {

  constructor(config) {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
    for (const key in config) {
      this.dataset[key] = config[key];
      // FIXME: FF doesn't invoke the callback on data- attributes, so we call it explicitly here; duplicate in Chrome
      this.attributeChangedCallback(`data-${key}`, undefined, config[key]);
    }
    this.shadowRoot.addEventListener('change', event => {
      if (!event.target.name) {
        return;
      }
      const match = event.target.name.match(/^(?:bind-data-)([a-z]*)$/);
      if (!match || !match[1]) {
        return;
      }
      this.dataset[match[1]] = event.target.value;
    });
  }

  // subclasses should override this
  static get observedAttributes() {
    return [];
  }

  /**
   * Extends the standard API to include source, to support subscriptions to other elements
   *
   * @param name
   * @param oldValue
   * @param newValue
   * @param source
   */
  attributeChangedCallback(name, oldValue, newValue, source) {
    //console.log(`${this.constructor.name}: ${source} changed attribute ${name} from ${oldValue} to ${newValue}`);
    if (newValue === oldValue) {
      return;
    }
    this
      .shadowRoot
      .querySelectorAll(`[name="bind-${name}"]`)
      .forEach(element => {
        element.textContent = newValue;
        element.value = newValue;
      })
    ;
    if (this.subscribers && this.subscribers[name]) {
      this.subscribers[name].forEach(subscriber => subscriber.attributeChangedCallback(name, oldValue, newValue, this));
    }
  }

  observeAttribute(attributeName, subscriber) {
    if (this.subscribers === undefined) {
      this.subscribers = {};
    }
    if (this.subscribers[attributeName] === undefined) {
      this.subscribers[attributeName] = [];
    }
    this.subscribers[attributeName].push(subscriber);
    return this;
  }

};
