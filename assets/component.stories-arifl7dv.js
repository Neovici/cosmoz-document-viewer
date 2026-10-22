import{D,e as I}from"./iframe-BFsWXv7J.js";import"./preload-helper-PPVm8Dsz.js";let _,L=0;function k(e){_=e}function R(){_=null,L=0}function Q(){return L++}const v=Symbol("haunted.phase"),y=Symbol("haunted.hook"),T=Symbol("haunted.update"),B=Symbol("haunted.commit"),f=Symbol("haunted.effects"),w=Symbol("haunted.layoutEffects"),S="haunted.context";class G{update;host;virtual;[y];[f];[w];constructor(t,s){this.update=t,this.host=s,this[y]=new Map,this[f]=[],this[w]=[]}run(t){k(this);let s=t();return R(),s}_runEffects(t){let s=this[t];k(this);for(let n of s)n.call(this);R()}runEffects(){this._runEffects(f)}runLayoutEffects(){this._runEffects(w)}teardown(){this[y].forEach(s=>{typeof s.teardown=="function"&&s.teardown(!0)})}}class U extends Error{constructor(t){const s=t?` <${t}>`:"";super(`Infinite update loop detected in component${s}. This usually means a hook (useEffect, useMemo, useCallback) has dependencies that create new references on every render, such as [{}], [[]], or [Promise.resolve()]. Make sure your dependency arrays contain stable references.`),this.name="InfiniteLoopError"}}const K=100,X=Promise.resolve().then.bind(Promise.resolve());function z(){let e=[],t;function s(){t=null;let n=e;e=[];for(var r=0,p=n.length;r<p;r++)n[r]()}return function(n){e.push(n),t==null&&(t=X(s))}}const Y=z(),P=z();class C{renderer;host;state;[v];_updateQueued;_active;_updateCount;_processing;static maxUpdates=K;constructor(t,s){this.renderer=t,this.host=s,this.state=new G(this.update.bind(this),s),this[v]=null,this._updateQueued=!1,this._active=!1,this._updateCount=0,this._processing=!1}_checkForInfiniteLoop(){if(this._processing||(this._updateCount=0),this._updateCount++,this._updateCount>C.maxUpdates){const t=this.host instanceof HTMLElement?this.host.tagName.toLowerCase():void 0;throw this._active=!1,new U(t)}}update(){this._active&&(this._updateQueued||(this._checkForInfiniteLoop(),this._processing=!0,Y(()=>{let t=this.handlePhase(T);P(()=>{this.handlePhase(B,t),P(()=>{this.handlePhase(f),this._updateQueued||(this._processing=!1)})}),this._updateQueued=!1}),this._updateQueued=!0))}handlePhase(t,s){switch(this[v]=t,t){case B:this.commit(s),this.runEffects(w);return;case T:return this.render();case f:return this.runEffects(f)}}render(){return this.state.run(()=>this.renderer.call(this.host,this.host))}runEffects(t){this.state._runEffects(t)}teardown(){this.state.teardown(),this._updateCount=0,this._processing=!1}pause(){this._active=!1}resume(){this._active=!0,this._updateCount=0}}const Z=(...e)=>{const t=new CSSStyleSheet;return t.replaceSync(e.join("")),t},q=e=>e?.map(t=>typeof t=="string"?Z(t):t),J=(e="")=>e.replace(/-+([a-z])?/g,(t,s)=>s?s.toUpperCase():"");function V(e){class t extends C{frag;renderResult;constructor(r,p,b){super(r,b||p),this.frag=p}commit(r){this.renderResult=e(r,this.frag)}}function s(n,r,p){const b=(p||r||{}).baseElement||HTMLElement,{observedAttributes:A=[],useShadowDOM:M=!0,shadowRootInit:N={},styleSheets:W}=p||r||{},E=q(n.styleSheets||W);class x extends b{_scheduler;static get observedAttributes(){return n.observedAttributes||A||[]}constructor(){if(super(),M===!1)this._scheduler=new t(n,this);else{const a=this.attachShadow({mode:"open",...N});E&&(a.adoptedStyleSheets=E),this._scheduler=new t(n,a,this)}}connectedCallback(){this._scheduler.resume(),this._scheduler.update(),this._scheduler.renderResult?.setConnected(!0)}disconnectedCallback(){this._scheduler.pause(),this._scheduler.teardown(),this._scheduler.renderResult?.setConnected(!1)}attributeChangedCallback(a,u,o){if(u===o)return;let i=o===""?!0:o;Reflect.set(this,J(a),i)}}function $(c){let a=c,u=!1;return Object.freeze({enumerable:!0,configurable:!0,get(){return a},set(o){u&&a===o||(u=!0,a=o,this._scheduler&&this._scheduler.update())}})}const j=new Proxy(b.prototype,{getPrototypeOf(c){return c},set(c,a,u,o){let i;return a in c?(i=Object.getOwnPropertyDescriptor(c,a),i&&i.set?(i.set.call(o,u),!0):(Reflect.set(c,a,u,o),!0)):(typeof a=="symbol"||a[0]==="_"?i={enumerable:!0,configurable:!0,writable:!0,value:u}:i=$(u),Object.defineProperty(o,a,i),i.set&&i.set.call(o,u),!0)}});return Object.setPrototypeOf(x.prototype,j),x}return s}class m{id;state;constructor(t,s){this.id=t,this.state=s}}function tt(e,...t){let s=Q(),n=_[y],r=n.get(s);return r||(r=new e(s,_,...t),n.set(s,r)),r.update(...t)}function g(e){return tt.bind(null,e)}function F(e){return g(class extends m{callback;lastValues;values;_teardown;constructor(t,s,n,r){super(t,s),e(s,this)}update(t,s){this.callback=t,this.values=s}call(){const t=!this.values||this.hasChanged();this.lastValues=this.values,t&&this.run()}run(){this.teardown(),this._teardown=this.callback.call(this.state)}teardown(t){typeof this._teardown=="function"&&(this._teardown(),this._teardown=void 0),t&&(this.lastValues=this.values=void 0)}hasChanged(){return!this.lastValues||this.values.some((t,s)=>this.lastValues[s]!==t)}})}function O(e,t){e[f].push(t)}F(O);const et=e=>e instanceof Element?e:e.startNode||e.endNode||e.parentNode,st=g(class extends m{Context;value;_ranEffect;_unsubscribe;constructor(e,t,s){super(e,t),this._updater=this._updater.bind(this),this._ranEffect=!1,this._unsubscribe=null,O(t,this)}update(e){return this.Context!==e&&(this._subscribe(e),this.Context=e),this.value}call(){this._ranEffect||(this._ranEffect=!0,this._unsubscribe&&this._unsubscribe(),this._subscribe(this.Context),this.state.update())}_updater(e){this.value=e,this.state.update()}_subscribe(e){const t={Context:e,callback:this._updater};et(this.state.host).dispatchEvent(new CustomEvent(S,{detail:t,bubbles:!0,cancelable:!0,composed:!0}));const{unsubscribe:n=null,value:r}=t;this.value=n?r:e.defaultValue,this._unsubscribe=n}teardown(){this._unsubscribe&&this._unsubscribe()}});function nt(e){return t=>{const s={Provider:class extends HTMLElement{listeners;_value;constructor(){super(),this.style.display="contents",this.listeners=new Set,this.addEventListener(S,this)}disconnectedCallback(){this.removeEventListener(S,this)}handleEvent(n){const{detail:r}=n;r.Context===s&&(r.value=this.value,r.unsubscribe=this.unsubscribe.bind(this,r.callback),this.listeners.add(r.callback),n.stopPropagation())}unsubscribe(n){this.listeners.delete(n)}set value(n){this._value=n;for(let r of this.listeners)r(n)}get value(){return this._value}},Consumer:e(function({render:n}){const r=st(s);return n(r)},{useShadowDOM:!1}),defaultValue:t};return s}}g(class extends m{value;values;constructor(e,t,s,n){super(e,t),this.value=s(),this.values=n}update(e,t){return this.hasChanged(t)&&(this.values=t,this.value=e()),this.value}hasChanged(e=[]){return e.some((t,s)=>this.values[s]!==t)}});function rt(e,t){e[w].push(t)}F(rt);const at=g(class extends m{args;constructor(e,t,s){super(e,t),this.updater=this.updater.bind(this),typeof s=="function"&&(s=s()),this.makeArgs(s)}update(){return this.args}updater(e){const[t]=this.args;typeof e=="function"&&(e=e(t)),!Object.is(t,e)&&(this.makeArgs(e),this.state.update())}makeArgs(e){this.args=Object.freeze([e,this.updater])}});g(class extends m{reducer;currentState;constructor(e,t,s,n,r){super(e,t),this.dispatch=this.dispatch.bind(this),this.currentState=r!==void 0?r(n):n}update(e){return this.reducer=e,[this.currentState,this.dispatch]}dispatch(e){this.currentState=this.reducer(this.currentState,e),this.state.update()}});const ot=/([A-Z])/gu;g(class extends m{property;eventName;constructor(e,t,s,n){if(super(e,t),this.state.virtual)throw new Error("Can't be used with virtual components.");this.updater=this.updater.bind(this),this.property=s,this.eventName=s.replace(ot,"-$1").toLowerCase()+"-changed",this.state.host[this.property]==null&&(typeof n=="function"&&(n=n()),n!=null&&this.updater(n))}update(e,t){return[this.state.host[this.property],this.updater]}resolve(e){const t=this.state.host[this.property],s=typeof e=="function"?e:void 0,n=s?s(t):e;return[t,n,s]}notify(e,t){const s=new CustomEvent(this.eventName,{detail:{value:e,updater:t,path:this.property},cancelable:!0});return this.state.host.dispatchEvent(s),s}updater(e){const[t,s,n]=this.resolve(e);this.notify(s,n).defaultPrevented||Object.is(t,s)||(this.state.host[this.property]=s)}});g(class extends m{update(){return this.state.host}});function it({render:e}){const t=V(e),s=nt(t);return{component:t,createContext:s}}const{component:ut}=it({render:D}),ct=e=>{const[t,s]=at(0),{greeting:n="Hello"}=e;return I`
		<p>${n}, World! Count: ${t}</p>
		<button @click=${()=>s(t+1)}>Increment</button>
	`};customElements.define("cosmoz-component",ut(ct,{observedAttributes:["greeting"]}));const{waitFor:H}=__STORYBOOK_MODULE_TEST__,lt={title:"CosmozComponent",component:"cosmoz-component",tags:["autodocs"],argTypes:{greeting:{control:"text",description:"Greeting text"}},args:{greeting:"Hello"}},h={render:e=>I`<cosmoz-component greeting=${e.greeting}></cosmoz-component>`,play:async({canvas:e,step:t,userEvent:s})=>{await t("Renders with default greeting",async()=>{await e.findByShadowText(/Hello, World!/u)}),await t("Clicking increment updates counter",async()=>{const n=e.getByShadowRole("button",{name:/Increment/u});await s.click(n),await H(()=>{e.getByShadowText(/Count: 1/u)})}),await t("Clicking increment again updates counter",async()=>{const n=e.getByShadowRole("button",{name:/Increment/u});await s.click(n),await H(()=>{e.getByShadowText(/Count: 2/u)})})}},d={args:{greeting:"Hi there"},play:async({canvas:e,step:t})=>{await t("Renders with custom greeting",async()=>{await e.findByShadowText(/Hi there, World!/u)})}},l={args:{greeting:""},play:async({canvas:e,step:t})=>{await t("Renders with empty greeting",async()=>{await e.findByShadowText(/, World!/u)})}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: args => html\`<cosmoz-component greeting=\${args.greeting}></cosmoz-component>\`,
  play: async ({
    canvas,
    step,
    userEvent
  }) => {
    await step('Renders with default greeting', async () => {
      await canvas.findByShadowText(/Hello, World!/u);
    });
    await step('Clicking increment updates counter', async () => {
      const button = canvas.getByShadowRole('button', {
        name: /Increment/u
      });
      await userEvent.click(button);
      await waitFor(() => {
        canvas.getByShadowText(/Count: 1/u);
      });
    });
    await step('Clicking increment again updates counter', async () => {
      const button = canvas.getByShadowRole('button', {
        name: /Increment/u
      });
      await userEvent.click(button);
      await waitFor(() => {
        canvas.getByShadowText(/Count: 2/u);
      });
    });
  }
}`,...h.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    greeting: 'Hi there'
  },
  play: async ({
    canvas,
    step
  }) => {
    await step('Renders with custom greeting', async () => {
      await canvas.findByShadowText(/Hi there, World!/u);
    });
  }
}`,...d.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    greeting: ''
  },
  play: async ({
    canvas,
    step
  }) => {
    await step('Renders with empty greeting', async () => {
      await canvas.findByShadowText(/, World!/u);
    });
  }
}`,...l.parameters?.docs?.source}}};const pt=["Default","CustomGreeting","NoGreeting"];h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: args => html\`<cosmoz-component greeting=\${args.greeting}></cosmoz-component>\`,
  play: async ({
    canvas,
    step,
    userEvent
  }) => {
    await step('Renders with default greeting', async () => {
      await canvas.findByShadowText(/Hello, World!/u);
    });
    await step('Clicking increment updates counter', async () => {
      const button = canvas.getByShadowRole('button', {
        name: /Increment/u
      });
      await userEvent.click(button);
      await waitFor(() => {
        canvas.getByShadowText(/Count: 1/u);
      });
    });
    await step('Clicking increment again updates counter', async () => {
      const button = canvas.getByShadowRole('button', {
        name: /Increment/u
      });
      await userEvent.click(button);
      await waitFor(() => {
        canvas.getByShadowText(/Count: 2/u);
      });
    });
  }
}`,...h.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    greeting: 'Hi there'
  },
  play: async ({
    canvas,
    step
  }) => {
    await step('Renders with custom greeting', async () => {
      await canvas.findByShadowText(/Hi there, World!/u);
    });
  }
}`,...d.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    greeting: ''
  },
  play: async ({
    canvas,
    step
  }) => {
    await step('Renders with empty greeting', async () => {
      await canvas.findByShadowText(/, World!/u);
    });
  }
}`,...l.parameters?.docs?.source}}};export{d as CustomGreeting,h as Default,l as NoGreeting,pt as __namedExportsOrder,lt as default};
