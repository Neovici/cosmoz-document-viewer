import{b as d,D as pe,A as N}from"./iframe-BYkMVtM7.js";import{a as ue,s as se,b as _,d as X,e as T,f as A,h as k,n as U,i as ge,l as me,r as be,Z as ve,j as fe,c as we,u as q,p as ye,k as le,P as xe,g as oe}from"./shared-BXl6Q-0G.js";import"./preload-helper-PPVm8Dsz.js";const re=(e,o)=>ue(()=>e,o),G=se(_`
	/*
	 * Use border-box sizing for all elements.
	 * This is safe and doesn't conflict with child component styles.
	 */
	*,
	::before,
	::after,
	::backdrop,
	::file-selector-button {
		box-sizing: border-box;
	}

	/*
	 * Reset margins and padding on elements that typically have browser defaults.
	 * This is more targeted than using * to avoid affecting custom elements.
	 */
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	p,
	blockquote,
	pre,
	ul,
	ol,
	li,
	dl,
	dt,
	dd,
	figure,
	figcaption,
	fieldset,
	legend,
	form,
	hr,
	table,
	th,
	td {
		margin: 0;
		padding: 0;
	}

	/*
	 * Reset borders on elements that typically have them.
	 */
	fieldset,
	hr,
	iframe {
		border: 0 solid;
	}

	/*
	 * 1. Use a consistent sensible line-height in all browsers.
	 * 2. Prevent adjustments of font size after orientation changes in iOS.
	 * 3. Use a more readable tab size.
	 * 4. Use the configured font-family.
	 * 5. Disable tap highlights on iOS.
	 */
	:host {
		line-height: 1.5;
		-webkit-text-size-adjust: 100%;
		tab-size: 4;
		font-family: var(--cz-font-body);
		-webkit-tap-highlight-color: transparent;
	}

	/*
	 * Reset links to optimize for opt-in styling.
	 */
	a {
		color: inherit;
		text-decoration: inherit;
	}

	/*
	 * Add the correct font weight in Edge and Safari.
	 */
	b,
	strong {
		font-weight: bolder;
	}

	/*
	 * 1. Use the configured mono font-family.
	 * 2. Correct the odd em font sizing in all browsers.
	 */
	code,
	kbd,
	samp,
	pre {
		font-family: var(--cz-font-mono);
		font-size: 1em;
	}

	/*
	 * Add the correct font size in all browsers.
	 */
	small {
		font-size: 80%;
	}

	/*
	 * Prevent sub and sup from affecting line height.
	 */
	sub,
	sup {
		font-size: 75%;
		line-height: 0;
		position: relative;
		vertical-align: baseline;
	}

	sub {
		bottom: -0.25em;
	}

	sup {
		top: -0.5em;
	}

	/*
	 * 1. Make replaced elements display: block by default.
	 * 2. Add vertical-align: middle for better alignment.
	 */
	img,
	svg,
	video,
	canvas,
	audio,
	iframe,
	embed,
	object {
		display: block;
		vertical-align: middle;
	}

	/*
	 * Constrain images and videos to parent width.
	 */
	img,
	video {
		max-width: 100%;
		height: auto;
	}

	/*
	 * Reset form controls:
	 * 1. Inherit font styles in all browsers.
	 * 2. Remove default margins, padding, and borders.
	 * 3. Remove border radius.
	 * 4. Remove background color.
	 */
	button,
	input,
	select,
	optgroup,
	textarea,
	::file-selector-button {
		margin: 0;
		padding: 0;
		border: 0 solid;
		font: inherit;
		font-feature-settings: inherit;
		font-variation-settings: inherit;
		letter-spacing: inherit;
		color: inherit;
		border-radius: 0;
		background-color: transparent;
	}

	/*
	 * Reset placeholder opacity in Firefox.
	 */
	::placeholder {
		opacity: 1;
		color: var(--cz-color-text-placeholder, currentcolor);
	}

	/*
	 * Prevent horizontal textarea resize.
	 */
	textarea {
		resize: vertical;
	}

	/*
	 * Remove the inner padding in Chrome and Safari on macOS.
	 */
	::-webkit-search-decoration {
		-webkit-appearance: none;
	}

	/*
	 * Correct the inability to style the border radius in iOS Safari.
	 */
	button,
	input:where([type='button'], [type='reset'], [type='submit']),
	::file-selector-button {
		appearance: button;
	}

	/*
	 * Make elements with hidden attribute stay hidden.
	 */
	[hidden]:where(:not([hidden='until-found'])) {
		display: none !important;
	}
`);function V(e,o,r){return e?o(e):r?.(e)}const ze=_`
	:host {
		display: flex;
		flex-direction: column;
		gap: var(--cosmoz-tooltip-gap, var(--cz-spacing));
		font-family: var(--cz-font-body);
	}

	::slotted([slot='heading']) {
		display: block;
	}

	::slotted([slot='description']) {
		margin: 0;
	}
`;customElements.define("cosmoz-tooltip-content",X(()=>d`
			<slot name="heading"></slot>
			<slot name="description"></slot>
			<slot></slot>
		`,{styleSheets:[G,ze]}));const Z=se(_`
	.cosmoz-tooltip-popover {
		position: fixed;
		inset: unset;
		pointer-events: none;
		text-align: left;
		margin: calc(var(--cz-spacing) * 2);
		position-try-fallbacks:
			flip-block,
			flip-inline,
			flip-block flip-inline;

		/* Reset popover defaults */
		border: none;
		white-space: normal;
		padding: var(--cosmoz-tooltip-padding, calc(var(--cz-spacing) * 2) calc(var(--cz-spacing) * 3));
		border-radius: var(--cosmoz-tooltip-border-radius, var(--cz-radius-sm));
		max-width: var(--cosmoz-tooltip-max-width, 20rem);
		box-shadow: var(--cosmoz-tooltip-box-shadow, var(--cz-shadow-lg));
		background: var(--cosmoz-tooltip-bg-color, var(--cz-color-gray-900));
		font-size: var(--cosmoz-tooltip-font-size, var(--cz-text-xs));
		font-weight: var(--cosmoz-tooltip-font-weight, 400);
		line-height: var(--cosmoz-tooltip-line-height, var(--cz-text-xs-line-height));
		color: var(--cosmoz-tooltip-text-color, var(--cz-color-white));

		cosmoz-tooltip-content strong {
			font-weight: var(
	 			--cosmoz-tooltip-heading-font-weight,
	 			var(--cz-font-weight-semibold)
	 		);

			color: var(--cosmoz-tooltip-heading-color);
		}

		/* Animation - open state */
		opacity: 1;
		transform: translateY(0) scale(1);

		transition:
			opacity 150ms ease-out,
			transform 150ms ease-out,
			overlay 150ms ease-out allow-discrete,
			display 150ms ease-out allow-discrete;
	}

	@starting-style {
		.cosmoz-tooltip-popover:popover-open {
			opacity: 0;
			transform: translateY(4px) scale(0.96);
		}
	}

	.cosmoz-tooltip-popover:not(:popover-open) {
		opacity: 0;
		transform: translateY(4px) scale(0.96);
	}

	@media (prefers-reduced-motion: reduce) {
		.cosmoz-tooltip-popover {
			transition: none;
		}
	}
`),ne=(e,o,r)=>pe(d`<cosmoz-tooltip-content>
			${V(o,()=>d`<strong slot="heading">${o}</strong>`)}
			${V(r,()=>d`<p slot="description">${r}</p>`)}
		</cosmoz-tooltip-content>`,e),ke=(e,o)=>{const{for:r,heading:i,description:c,placement:p="top",delay:s=300,disabled:u=!1}=o,g=T(),E=!!(i||c)&&!u;A(()=>{if(!r||!E)return;const b=e.getRootNode(),v=b.adoptedStyleSheets??[];v.includes(Z)||(b.adoptedStyleSheets=[...v,Z]);const n=document.createElement("div");n.setAttribute("popover","manual"),n.setAttribute("role","tooltip"),n.classList.add("cosmoz-tooltip-popover"),e.after(n),g.current=n,ne(n,i,c);const z=`[name="${r}"]`,f=`--tooltip-anchor-${r}`;let P;const $=y=>{u||(clearTimeout(P),y.style.anchorName=f,n.style.positionAnchor=f,n.style.positionArea=p,P=window.setTimeout(()=>n.showPopover(),s))},B=()=>{clearTimeout(P),n.hidePopover()},m=y=>{const w=y.target.closest?.(z);w&&$(w)},Y=y=>{const w=y.target.closest?.(z);if(!w)return;const D=y.relatedTarget;D&&w.contains(D)||B()},L=y=>{const w=y.target.closest?.(z);w&&$(w)},R=y=>{y.target.closest?.(z)&&B()};return b.addEventListener("pointerover",m),b.addEventListener("pointerout",Y),b.addEventListener("focusin",L),b.addEventListener("focusout",R),()=>{clearTimeout(P),b.removeEventListener("pointerover",m),b.removeEventListener("pointerout",Y),b.removeEventListener("focusin",L),b.removeEventListener("focusout",R),n.hidePopover(),n.remove(),g.current=void 0}},[r,p,s,E]),A(()=>{!r||!g.current||ne(g.current,i,c)},[i,c,r]),A(()=>{!u||!g.current||g.current.hidePopover()},[u])},Ee=e=>{const[o,r]=k(!1);return A(()=>{const i=e.current;if(!i)return;const c=()=>{r(i.assignedElements().length>0)};return c(),i.addEventListener("slotchange",c),()=>i.removeEventListener("slotchange",c)},[e.current]),o},$e=_`
	:host {
		display: inline-block;
		anchor-name: --tooltip-anchor;
	}

	:host([for]) {
		display: contents;
		anchor-name: unset;
	}

	.cosmoz-tooltip-popover {
		position-anchor: --tooltip-anchor;
	}
`,Se=e=>{const{heading:o,description:r,for:i,placement:c="top",delay:p=300,disabled:s=!1}=e,u=T(),g=T(),x=T(),E=Ee(x),v=!!(o||r||E)&&!s,n=re(()=>{v&&(clearTimeout(g.current),g.current=window.setTimeout(()=>{u.current?.showPopover()},p))},[p,v]);A(()=>{s&&(clearTimeout(g.current),u.current?.hidePopover())},[s]);const z=re(()=>{clearTimeout(g.current),u.current?.hidePopover()},[]);return A(()=>{if(i)return;const f=P=>{const $=P.relatedTarget;$&&e.contains($)||z()};return e.addEventListener("pointerover",n),e.addEventListener("pointerout",f),()=>{e.removeEventListener("pointerover",n),e.removeEventListener("pointerout",f)}},[i,n,z]),ke(e,{for:i,heading:o,description:r,placement:c,delay:p,disabled:s}),i?N:v?d`
		<slot @focusin=${n} @focusout=${z}></slot>
		<div
			class="cosmoz-tooltip-popover"
			popover="manual"
			role="tooltip"
			style="position-area: ${c}"
			${U(u)}
		>
			<cosmoz-tooltip-content>
				${V(o,()=>d`<strong slot="heading">${o}</strong>`)}
				${V(r,()=>d`<p slot="description">${r}</p>`)}
				<slot name="content" ${U(x)}></slot>
			</cosmoz-tooltip-content>
		</div>
	`:d`
			<slot></slot>
			<slot name="content" ${U(x)} hidden></slot>
		`};customElements.define("cosmoz-tooltip",X(Se,{styleSheets:[G,Z,$e],observedAttributes:["heading","description","for","placement","delay","disabled"]}));const a=e=>e??N,ae=(e,o)=>{e.type="submit",e.hidden=!0,e.disabled=!!(o.disabled||o.formDisabled),e.name=o.name??"",e.value=o.value??"";for(const r of["form","formaction","formenctype","formmethod","formnovalidate","formtarget"])o.hasAttribute(r)?e.setAttribute(r,o.getAttribute(r)):e.removeAttribute(r)};class Ae extends HTMLElement{static formAssociated=!0;#o=this.attachInternals();#e;get form(){return this.#o.form}syncFormButton(){if(!this.isConnected||this.type!=="submit"||this.href!=null){this.#e?.remove(),this.#e=void 0;return}this.#e?ae(this.#e,this):(this.#e=document.createElement("button"),ae(this.#e,this),this.append(this.#e))}formAssociatedCallback(){this.syncFormButton()}formDisabledCallback(o){this.formDisabled=o,this.syncFormButton()}connectedCallback(){this.addEventListener("click",this.#t),this.syncFormButton()}disconnectedCallback(){this.removeEventListener("click",this.#t),this.#e?.remove(),this.#e=void 0}#t=o=>{this.#e&&o.composedPath().includes(this.#e)||setTimeout(()=>{if(o.defaultPrevented||!this.isConnected||this.disabled||this.formDisabled||this.href!=null)return;const r=this.form;r&&(this.type==="reset"?r.reset():this.type==="submit"&&(this.syncFormButton(),this.#e&&r.requestSubmit(this.#e)))},0)}}const Pe=_`
	:host {
		display: inline-flex;

		--_wash: var(--cz-color-bg-glass, var(--cz-color-bg-tertiary));
		--_wash-strong: var(
			--cz-color-bg-glass-hover,
			var(--cz-color-bg-secondary-hover)
		);
		--_hairline: var(--cz-color-border-glass, var(--cz-color-border-primary));
		--_sheen: var(--cz-glass-action-sheen, var(--cz-action-sheen, none));
		--_lift: var(--cz-shadow-xs);
		--_pressed-bg: var(
			--cz-color-bg-glass-action-pressed,
			var(--cz-color-bg-action-solid-hover)
		);
	}

	:host([full-width]) {
		display: flex;
		width: 100%;
	}

	:host([hidden]) {
		display: none;
	}

	/* Keeps the inner control stretching with host-driven sizing. */
	:host > cosmoz-tooltip {
		display: flex;
		width: 100%;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: var(--cosmoz-button-justify-content, center);
		gap: 6px;
		width: 100%;
		height: var(--cz-control-height-md);
		padding: 0 14px;
		border: 1px solid transparent;
		border-radius: var(--cz-radius-md);
		font-family: var(--cz-font-body);
		font-size: calc((var(--cz-text-sm) + var(--cz-text-xs)) / 2);
		font-weight: var(--cz-font-weight-regular);
		line-height: 1.25;
		letter-spacing: normal;
		text-align: center;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		outline: 2px solid transparent;
		outline-offset: 2px;
		transition:
			background-color 120ms ease-out,
			color 120ms ease-out,
			box-shadow 120ms ease-out,
			outline-color 120ms ease-out;

		background:
			var(
				--cz-glass-button-action-sheen,
				var(--cz-glass-action-sheen, var(--cz-action-sheen, none))
			),
			var(--cz-color-bg-glass-action, var(--cz-color-bg-action-solid));
		border-color: var(--cz-color-border-glass-action, transparent);
		backdrop-filter: var(--cz-backdrop-filter-glass, none);
		color: var(--cz-color-text-on-glass-action, var(--cz-color-text-on-action));
		box-shadow: var(
			--cz-shadow-glass-button-action,
			var(--cz-shadow-glass-action, var(--cz-shadow-action))
		);

		&:hover {
			background-color: var(
				--cz-color-bg-glass-action-hover,
				var(--cz-color-bg-action-solid-hover)
			);
		}

		&:focus-visible {
			outline-color: var(--cz-color-focus-ring);
		}
	}

	::slotted(iron-icon) {
		pointer-events: none;
		width: 20px;
		height: 20px;
		flex: none;
	}

	::slotted(svg) {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	::slotted([slot='prefix']) {
		margin-inline-start: -2px;
	}

	::slotted([slot='suffix']) {
		margin-inline-end: -2px;
	}

	/* Sizes */

	:host([size='sm']) .button {
		height: var(--cz-control-height-sm);
		padding: 0 12px;
		font-size: var(--cz-text-xs);
	}

	:host([size='sm']) ::slotted(svg) {
		width: 14px;
		height: 14px;
	}

	:host([size='lg']) .button {
		height: var(--cz-control-height-lg);
		padding: 0 16px;
		font-size: var(--cz-text-sm);
	}

	:host([size='xl']) .button {
		height: var(--cz-control-height-xl);
		padding: 0 18px;
		gap: 8px;
		font-size: var(--cz-text-sm);
	}

	:host([size='xl']) ::slotted(svg) {
		width: 18px;
		height: 18px;
	}

	:host([icon-only]) .button {
		border-radius: var(--cz-radius-full);
		width: var(--cz-control-height-md);
		padding: 0;
	}

	:host([icon-only][size='sm']) .button {
		width: var(--cz-control-height-sm);
	}

	:host([icon-only][size='lg']) .button {
		width: var(--cz-control-height-lg);
	}

	:host([icon-only][size='xl']) .button {
		width: var(--cz-control-height-xl);
	}

	:host([icon-only]) ::slotted(svg) {
		margin: 0;
	}

	/* Preserve the supplied geometry of standalone icons. */
	:host([icon-only]) ::slotted(svg[width]) {
		width: auto;
	}

	:host([icon-only]) ::slotted(svg[height]) {
		height: auto;
	}

	/* Variants */

	:host([variant='secondary']) .button {
		--_pressed-bg: var(
			--cz-color-bg-glass-pressed,
			var(--cz-color-bg-secondary-hover)
		);
		background:
			var(--cz-glass-button-sheen, var(--cz-glass-sheen, none)),
			var(
				--cz-color-bg-glass-button,
				var(--cz-color-bg-glass, var(--cz-color-bg-tertiary))
			);
		color: var(--cz-color-text-primary);
		border-color: var(
			--cz-color-border-glass-button,
			var(--cz-color-border-glass, var(--cz-color-border-primary))
		);
		box-shadow: var(
			--cz-shadow-glass-button,
			var(--cz-shadow-glass, var(--cz-shadow-xs))
		);
		backdrop-filter: var(--cz-backdrop-filter-glass, none);

		&:hover {
			background-color: var(
				--cz-color-bg-glass-hover,
				var(--cz-color-bg-secondary-hover)
			);
		}
	}

	:host([variant='tertiary']) .button {
		background: transparent;
		border-color: transparent;
		backdrop-filter: none;
		color: var(--cz-color-text-secondary);
		box-shadow: none;

		&:hover {
			background: var(--cz-color-bg-tertiary);
			color: var(--cz-color-text-primary);
		}
	}

	:host([variant='tertiary']) .button:active {
		background: var(--cz-color-bg-quaternary);
		box-shadow: none;
	}

	:host([variant='destructive']) .button {
		--_pressed-bg: var(
			--cz-color-bg-glass-destructive-pressed,
			var(--cz-color-bg-error-solid-hover)
		);
		background:
			var(--_sheen),
			var(--cz-color-bg-glass-destructive, var(--cz-color-bg-error-solid));
		color: var(--cz-color-white);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.06),
			inset 0 0 0 1px light-dark(rgb(10 13 18 / 0.2), transparent),
			var(--_lift);

		&:hover {
			background-color: var(
				--cz-color-bg-glass-destructive-hover,
				var(--cz-color-bg-error-solid-hover)
			);
		}

		&:focus-visible {
			outline-color: var(--cz-color-error-500);
		}
	}

	:host([variant='link']) .button {
		height: auto;
		padding: 0;
		background: transparent;
		border-color: transparent;
		backdrop-filter: none;
		color: var(--cz-color-text-link);
		box-shadow: none;
		border-radius: var(--cz-radius-xs);
		outline-offset: 3px;
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 3px;
		transition-property: color, text-decoration-color, outline-color;

		&:hover {
			color: var(--cz-color-text-link-hover);
			text-decoration-color: currentColor;
		}
	}

	:host([icon-only][variant='secondary']) .button,
	:host([icon-only][variant='tertiary']) .button {
		color: var(--cz-color-text-primary);

		&:hover {
			color: var(--cz-color-text-primary);
		}
	}

	:host(:not([variant='tertiary']):not([variant='link']))
		.button:active:not(:disabled) {
		background-color: var(--_pressed-bg);
		background-image: none;
		box-shadow: var(--cz-shadow-glass-pressed, var(--cz-shadow-pressed-3d));
	}

	/* Toggled (aria-pressed) */

	:host([variant='secondary'][aria-pressed='true']) .button {
		background: var(--_wash-strong);
		color: var(--cz-color-text-primary);
		box-shadow: var(--cz-shadow-glass-pressed, var(--cz-shadow-pressed-3d));
	}

	:host([variant='tertiary'][aria-pressed='true']) .button {
		background: var(--cz-color-bg-quaternary);
		color: var(--cz-color-text-primary);
	}

	:host(:not([variant])[aria-pressed='true']) .button,
	:host([variant='primary'][aria-pressed='true']) .button,
	:host([variant='destructive'][aria-pressed='true']) .button {
		background-image: none;
		box-shadow: var(--cz-shadow-glass-pressed, var(--cz-shadow-pressed-3d));
	}

	:host([variant='link'][aria-pressed='true']) .button {
		text-decoration-color: currentColor;
	}

	/* Disabled keeps the variant's look, just quieter. */

	:host([disabled]) .button,
	:host(:disabled) .button,
	.button:disabled {
		opacity: var(--cz-opacity-disabled, 0.45);
		cursor: not-allowed;
		pointer-events: none;
		box-shadow: none;
	}

	@media (forced-colors: active) {
		:host .button,
		:host([variant]) .button {
			border-color: ButtonText;
			background: ButtonFace;
			color: ButtonText;
		}
		:host([aria-pressed='true']) .button {
			outline: 2px solid Highlight;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.button {
			transition: none;
		}
	}
`,Re=["variant","size","disabled","full-width","icon-only","tooltip","tooltip-placement","type","value","href","target","rel","download","aria-expanded","aria-label","title","aria-pressed","aria-controls","aria-haspopup","aria-description","aria-busy","aria-current","control-role","tabindex","name","form","formaction","formenctype","formmethod","formnovalidate","formtarget"],Te=e=>{const{disabled:o=!1,tooltip:r,tooltipPlacement:i,type:c="button",href:p,target:s,rel:u,download:g}=e,x=!!(o||e.formDisabled);A(()=>{e.syncFormButton()}),A(()=>{const v=n=>{(e.disabled||e.formDisabled)&&(n.preventDefault(),n.stopImmediatePropagation())};return e.addEventListener("click",v,{capture:!0}),()=>e.removeEventListener("click",v,{capture:!0})},[e.disabled,e.formDisabled]),ge(()=>{const v=e.shadowRoot?.querySelector(".button");v&&"ariaControlsElements"in v&&(v.ariaControlsElements=e.ariaControlsElements)});const E=d`
		<slot name="prefix"></slot>
		<slot></slot>
		<slot name="suffix"></slot>
	`,b=V(p!=null,()=>d`
			<a
				role=${a(e.controlRole)}
				tabindex=${a(e.getAttribute("tabindex")??void 0)}
				aria-controls=${a(e.getAttribute("aria-controls")??void 0)}
				aria-haspopup=${a(e.getAttribute("aria-haspopup")??void 0)}
				aria-description=${a(e.getAttribute("aria-description")??void 0)}
				aria-busy=${a(e.getAttribute("aria-busy")??void 0)}
				aria-current=${a(e.getAttribute("aria-current")??void 0)}
				href=${p}
				class="button"
				part="button"
				aria-disabled=${x?"true":N}
				aria-expanded=${a(e.getAttribute("aria-expanded")??void 0)}
				aria-label=${a(e.getAttribute("aria-label")??(e.iconOnly&&e.title?e.title:void 0))}
				target=${a(s)}
				rel=${a(u)}
				download=${a(g)}
				>${E}</a
			>
		`,()=>d`
			<button
				role=${a(e.controlRole)}
				tabindex=${a(e.getAttribute("tabindex")??void 0)}
				aria-controls=${a(e.getAttribute("aria-controls")??void 0)}
				aria-haspopup=${a(e.getAttribute("aria-haspopup")??void 0)}
				aria-description=${a(e.getAttribute("aria-description")??void 0)}
				aria-busy=${a(e.getAttribute("aria-busy")??void 0)}
				aria-current=${a(e.getAttribute("aria-current")??void 0)}
				type=${c}
				class="button"
				part="button"
				?disabled=${x}
				aria-expanded=${a(e.getAttribute("aria-expanded")??void 0)}
				aria-label=${a(e.getAttribute("aria-label")??(e.iconOnly&&e.title?e.title:void 0))}
				aria-pressed=${a(e.getAttribute("aria-pressed")??void 0)}
			>
				${E}
			</button>
		`);return d`<cosmoz-tooltip
		heading=${a(r??void 0)}
		placement=${a(i??void 0)}
		?disabled=${x}
	>
		${b}
	</cosmoz-tooltip>`};customElements.define("cosmoz-button",X(Te,{baseElement:Ae,observedAttributes:Re,styleSheets:[G,Pe],shadowRootInit:{mode:"open",delegatesFocus:!0}}));const Ce=d`<svg
	width="16"
	height="16"
	viewBox="0 0 24 24"
	fill="currentColor"
>
	<path
		d="M15.8 3.2a2.5 2.5 0 0 1 3.5 0l1.5 1.5a2.5 2.5 0 0 1 0 3.5L11.2 17.8l-5.5 1.1 1.1-5.5 9-10.2z"
	/>
</svg>`,ce=_`
	:host {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.shell {
		position: relative;
		max-width: 100%;
		height: 100%;
		overflow: hidden;
		border: 1px solid var(--cz-color-border-primary, #ccc);
		border-radius: 8px;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
		background: var(--cz-color-bg-tertiary, #eee);
	}

	/* While the draw mode is armed, the viewer's scroller stands down:
	 * touch-action is decided at gesture start, so drawing on touch needs
	 * the handoff — otherwise native scrolling owns the gesture. */
	cosmoz-document-viewer[data-draw-armed]::part(scroll-container) {
		touch-action: none;
	}

	.titlebar {
		position: absolute;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: calc(100% - 24px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 14px;
		border-radius: 999px;
		background: rgba(20, 20, 20, 0.72);
		backdrop-filter: blur(8px);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.28);
		color-scheme: dark;
		color: #fff;
		font-family: system-ui, sans-serif;
		font-size: 13px;
		z-index: 2;
	}
	.titlebar .title {
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		opacity: 0.85;
	}
	.titlebar button {
		border: 0;
		border-radius: 6px;
		padding: 4px 9px;
		background: rgba(255, 255, 255, 0.14);
		color: #fff;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	.titlebar button:hover {
		background: rgba(255, 255, 255, 0.26);
	}
	.page-indicator {
		white-space: nowrap;
	}
	.titlebar button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	/* Annotations live in their own piece of chrome — the highlighter's
	 * home, grown with content: marker entry always, nav and Clear once
	 * highlights exist. Thumb-reached at the bottom on phones. */
	.annotation-bar {
		position: absolute;
		bottom: calc(12px + env(safe-area-inset-bottom, 0px));
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: calc(100% - 24px);
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 6px 14px;
		border-radius: 999px;
		background: rgba(20, 20, 20, 0.72);
		backdrop-filter: blur(8px);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.28);
		/* Dark glass chrome: cosmoz-button tokens resolve light-dark() here.
		 * Without it the icon buttons render near-black on the dark pill. */
		color-scheme: dark;
		z-index: 2;
	}
	.annotation-bar[data-armed] {
		box-shadow:
			0 2px 12px rgba(0, 0, 0, 0.28),
			0 0 0 2px var(--cz-color-bg-highlight, #3b82f6);
	}
	.highlight-indicator {
		color: #fff;
		font-family: system-ui, sans-serif;
		font-size: 13px;
		white-space: nowrap;
	}
	.zoom-pct {
		min-width: 44px;
		text-align: center;
		opacity: 0.7;
	}
	/* Phone-viewport hygiene: roomier tap targets and a compact pill. */
	@media (pointer: coarse), (max-width: 480px) {
		.titlebar {
			top: 8px;
			gap: 8px;
			padding: 5px 10px;
		}
		.titlebar button {
			padding: 7px 13px;
			font-size: 13px;
		}
		.zoom-pct {
			min-width: 36px;
		}
		.annotation-bar {
			bottom: calc(10px + env(safe-area-inset-bottom, 0px));
			gap: 14px;
			padding: 8px 16px;
		}
	}
	.titlebar .title {
		min-width: 0;
	}
	/* On touch, the resize handle is chrome from another era. */
	@media (pointer: coarse) {
		.resize-handle {
			display: none;
		}
	}
	@media (max-width: 400px) {
		.titlebar .title {
			display: none;
		}
	}

	.resize-handle {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 24px;
		height: 24px;
		cursor: nwse-resize;
		touch-action: none;
		z-index: 2;
		border-top-left-radius: 8px;
		background: linear-gradient(
			135deg,
			transparent 0 9px,
			rgba(0, 0, 0, 0.4) 9px 10.5px,
			transparent 10.5px 13px,
			rgba(0, 0, 0, 0.4) 13px 14.5px,
			transparent 14.5px 17px,
			rgba(0, 0, 0, 0.4) 17px 18.5px,
			transparent 18.5px
		);
	}
	.resize-handle:hover {
		background: linear-gradient(
			135deg,
			transparent 0 9px,
			rgba(0, 0, 0, 0.65) 9px 10.5px,
			transparent 10.5px 13px,
			rgba(0, 0, 0, 0.65) 13px 14.5px,
			transparent 14.5px 17px,
			rgba(0, 0, 0, 0.65) 17px 18.5px,
			transparent 18.5px
		);
	}

	.hl {
		position: absolute;
		z-index: 1;
		background: rgba(255, 221, 0, 0.35);
		border: 1px solid rgba(191, 144, 0, 0.8);
		border-radius: 2px;
		pointer-events: none;
	}

	.hl.active {
		background: rgba(255, 221, 0, 0.5);
		border: 2px solid var(--cz-color-bg-highlight, #3b82f6);
	}

	/* The touch-mode toggle only says something where touch exists. */
	@media (pointer: fine) {
		.touch-toggle {
			display: none;
		}
	}
		pointer-events: none;
		user-select: none;
	}

	.loading {
		position: absolute;
		inset: 0;
		z-index: 3;
		background: var(--cz-color-bg-tertiary, #eee);
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
		justify-content: center;
		color: var(--cz-color-fg-secondary, #444);
		font-family: system-ui, sans-serif;
		font-size: 14px;
	}
`,Me=e=>e?`${Math.round(e*100)}%`:"—",De=e=>{const[o,r]=k(null),[i,c]=k(void 0),[p,s]=k(0),[u,g]=k(0),[x,E]=k(0),[b,v]=k(""),[n,z]=k([]),[f,P]=k(!1),[$,B]=k(null),[m,Y]=k(null),L=T(null),R=t=>{L.current=t,Y(t)},y=T(0),w=T(),D=T();A(()=>{if(!e.url)return;let t=!1;return r(null),me(e.url).then(l=>{t||r(l)},l=>{t||v(String(l))}),()=>{t=!0}},[e.url]);const de=t=>{c(t.detail?.value)},K=t=>{c(be((i||p||1)*t))},he=t=>{const l=w.current;if(!l)return;t.preventDefault();const h=l.offsetWidth,j=l.offsetHeight,F=t.clientX,O=t.clientY,S=t.currentTarget;S.setPointerCapture(t.pointerId);const ee=te=>{l.style.width=`${Math.max(160,h+te.clientX-F)}px`,l.style.height=`${Math.max(120,j+te.clientY-O)}px`},W=()=>{S.removeEventListener("pointermove",ee),S.removeEventListener("pointerup",W),S.removeEventListener("pointercancel",W)};S.addEventListener("pointermove",ee),S.addEventListener("pointerup",W),S.addEventListener("pointercancel",W)},J=()=>[...n].sort((t,l)=>t.page-l.page||t.y-l.y),Q=t=>{const l=D.current;if(!l||!n.length)return;const h=J(),j=h.findIndex(S=>S.id===$);let F;j<0?F=t>0?0:h.length-1:F=(j+(t>0?1:-1)+h.length)%h.length;const O=h[F];B(O.id),l.jumpToRegion(O.page,O)};return d`
		<style>
			${ce}
		</style>
		<div
			class="shell"
			?annotate=${f}
			@pointerdown=${t=>{if(!f||t.target instanceof Element&&t.target.closest("button, cosmoz-button"))return;const h=D.current?.pageAtPoint(t.clientX,t.clientY);if(h){R({page:h.page,x0:h.x,y0:h.y});try{w.current?.setPointerCapture(t.pointerId)}catch{}}}}
			@pointermove=${t=>{const l=L.current;if(!l)return;const h=D.current?.pageAtPoint(t.clientX,t.clientY);!h||h.page!==l.page||R({...l,x1:Math.min(1,Math.max(0,h.x)),y1:Math.min(1,Math.max(0,h.y))})}}
			@pointerup=${()=>{const t=L.current;if(!t||t.x1==null){R(null);return}const l=Math.min(t.x0,t.x1),h=Math.min(t.y0,t.y1??0);z([...n,{id:y.current++,page:t.page,x:l,y:h,width:Math.abs(t.x1-t.x0),height:Math.abs((t.y1??0)-t.y0)}]),R(null)}}
			${U(t=>w.current=t)}
		>
			<cosmoz-document-viewer
				style="flex: 1"
				${U(t=>D.current=t)}
				.pages=${o??[]}
				.zoomMode=${"fit"}
				.zoom=${i}
				?data-draw-armed=${f}
				@zoom-changed=${de}
				@fit-zoom-changed=${t=>s(t.detail?.value??0)}
				@current-page-changed=${t=>g(t.detail?.value)}
				@page-count-changed=${t=>E(t.detail?.value??0)}
			>
				${n.map(t=>d`
						<span
							class="hl ${t.id===$?"active":""}"
							slot="page-${t.page}-overlay"
							style="left: ${t.x*100}%; top: ${t.y*100}%; width: ${t.width*100}%; height: ${t.height*100}%;"
						></span>
					`)}
				${m?d`<span
							class="hl drawing"
							slot="page-${m.page}-overlay"
							style="left: ${Math.min(m.x0,m.x1??m.x0)*100}%; top: ${Math.min(m.y0,m.y1??m.y0)*100}%; width: ${Math.abs((m.x1??m.x0)-m.x0)*100}%; height: ${Math.abs((m.y1??m.y0)-m.y0)*100}%;"
						></span>`:""}
			</cosmoz-document-viewer>
			${o?"":d`<div class="loading">
						${b?d`<span>Failed to load: ${b}</span>`:"Loading document…"}
					</div>`}
			<div class="titlebar">
				<span class="title">${e.heading??"Document"}</span>
				<button @click=${()=>K(ve)}>−</button>
				<span class="zoom-pct">${Me(i||p)}</span>
				<button @click=${()=>K(fe)}>+</button>
				<button @click=${()=>c(p)} ?disabled=${!p}>
					Fit
				</button>
				<span class="page-indicator"
					>${x?`${u+1} / ${x}`:""}</span
				>
			</div>
			<div
				class="resize-handle"
				@pointerdown=${he}
				title="Drag to resize"
			></div>
			<div class="annotation-bar" ?data-armed=${f}>
				<cosmoz-button
					variant=${f?"primary":"tertiary"}
					size="sm"
					aria-pressed=${f?"true":"false"}
					label="Toggle highlight mode"
					title="Highlight mode: drag on a page to draw a rectangle"
					@click=${()=>{P(!f),R(null)}}
					>${Ce}</cosmoz-button
				>
				${n.length?d`
							<cosmoz-button
								variant="tertiary"
								size="sm"
								label="Previous highlight"
								@click=${()=>Q(-1)}
							>
								‹
							</cosmoz-button>
							<span class="highlight-indicator"
								>${Math.max(1,J().findIndex(t=>t.id===$)+1)}
								/ ${n.length}</span
							>
							<cosmoz-button
								variant="tertiary"
								size="sm"
								label="Next highlight"
								@click=${()=>Q(1)}
							>
								›
							</cosmoz-button>
							<cosmoz-button
								variant="tertiary"
								size="sm"
								label="Clear highlights"
								@click=${()=>{z([]),B(null)}}
								>Clear</cosmoz-button
							>
						`:""}
			</div>
		</div>
	`},Le=X(De,{styleSheets:[ce]});customElements.define("cosmoz-document-viewer-demo",Le);const{expect:ie}=__STORYBOOK_MODULE_TEST__,I=e=>e?.querySelector("cosmoz-document-viewer-demo"),H=e=>I(e)?.shadowRoot?.querySelector("cosmoz-document-viewer"),Ue={title:"CosmozDocumentViewer",component:"cosmoz-document-viewer",parameters:{docs:{description:{component:"Continuously scrolling, zoomable multi-page document viewer with a bespoke proportional strip layout. **The component is the viewer only — no chrome:** you get the virtualized zoomable page strip, the zoom/current-page event contract and per-page overlay slots; toolbars, zoom controls and page readouts are application chrome (the *Showcase* story is a demo shell built on the public API)."}}},decorators:[we]},C={name:"01 - Showcase (highlights, zoom, resize)",parameters:{docs:{description:{story:"What surrounds the viewer is **not the component**: toolbar (marker mode, highlight next/prev, zoom controls, fit, page readout) and the resizable viewport are a demo shell built on the public API — the component itself is the bare viewer strip with no chrome."}}},render:()=>d`<cosmoz-document-viewer-demo
            .annotate=${!0}
            .heading=${"Alice’s Adventures in Wonderland"}
            .url=${xe}
        ></cosmoz-document-viewer-demo>`,play:async({canvasElement:e,step:o})=>{await q(()=>H(e)?.ready===!0);const r=H(e),i=le(r),c=i?.querySelector('slot[name="page-0-overlay"]');ie(c.assignedElements().length).toBe(0),await o("Marker button arms highlight draw mode",async()=>{const p=I(e)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]');p?.dispatchEvent(new MouseEvent("click",{bubbles:!0,composed:!0})),await q(()=>{const s=H(e)?.shadowRoot?.querySelector(".scroll-container");return p?.getAttribute("aria-pressed")==="true"&&s!=null&&getComputedStyle(s).touchAction==="none"},5e3,"(armed: scroller hands the pointer over)")}),await o("Marquee in highlight mode adds an overlay rect",async()=>{const s=(i?.shadowRoot?.querySelector(".page-container")).getBoundingClientRect(),u=I(e)?.shadowRoot?.querySelector(".shell");u?.dispatchEvent(new PointerEvent("pointerdown",{bubbles:!0,composed:!0,clientX:s.left+s.width*.4,clientY:s.top+s.height*.2})),u?.dispatchEvent(new PointerEvent("pointermove",{bubbles:!0,composed:!0,clientX:s.left+s.width*.6,clientY:s.top+s.height*.35})),u?.dispatchEvent(new PointerEvent("pointerup",{bubbles:!0,composed:!0})),await q(()=>c.assignedElements().length>0,5e3,"(overlay rect committed)");const[g]=c.assignedElements();ie(g.getBoundingClientRect().height).toBeGreaterThan(0),I(e)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]')?.dispatchEvent(new MouseEvent("click",{bubbles:!0,composed:!0})),await q(()=>I(e)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]')?.getAttribute("aria-pressed")==="false",5e3,"(play leaves draw disarmed)")})}},M={render:()=>d`<cosmoz-document-viewer .pages=${ye}></cosmoz-document-viewer>`,play:async({canvasElement:e})=>{await q(()=>oe(e)?.ready===!0),await q(()=>le(oe(e))?.shadowRoot?.querySelector("img")?.src?.startsWith("blob:")===!0)}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: '01 - Showcase (highlights, zoom, resize)',
  parameters: {
    docs: {
      description: {
        story: 'What surrounds the viewer is **not the component**: toolbar (marker mode, highlight next/prev, zoom controls, fit, page readout) and the resizable viewport are a demo shell built on the public API — the component itself is the bare viewer strip with no chrome.'
      }
    }
  },
  render: () => html\`<cosmoz-document-viewer-demo
            .annotate=\${true}
            .heading=\${'Alice\\u2019s Adventures in Wonderland'}
            .url=\${PDF_URL}
        ></cosmoz-document-viewer-demo>\`,
  play: async ({
    canvasElement,
    step
  }) => {
    await until(() => getDemoViewer(canvasElement)?.ready === true);
    const viewer = getDemoViewer(canvasElement);
    const pageEl = getFirstPage(viewer);
    const namedSlot = pageEl?.querySelector('slot[name="page-0-overlay"]') as HTMLSlotElement;
    expect(namedSlot.assignedElements().length).toBe(0);
    await step('Marker button arms highlight draw mode', async () => {
      const marker = getDemoEl(canvasElement)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]');
      marker?.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        composed: true
      }));
      // Armed = the scroller hands the pointer over (the draw layer owns
      // touch-action through the part, since it's decided at gesture start).
      await until(() => {
        const sc = getDemoViewer(canvasElement)?.shadowRoot?.querySelector('.scroll-container');
        return marker?.getAttribute('aria-pressed') === 'true' && sc != null && getComputedStyle(sc).touchAction === 'none';
      }, 5_000, '(armed: scroller hands the pointer over)');
    });
    await step('Marquee in highlight mode adds an overlay rect', async () => {
      const container = pageEl?.shadowRoot?.querySelector('.page-container');
      const rect = container!.getBoundingClientRect();
      const shell = getDemoEl(canvasElement)?.shadowRoot?.querySelector('.shell');
      // Mode first (the marker toggle), then a drag = a rectangle.
      shell?.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        composed: true,
        clientX: rect.left + rect.width * 0.4,
        clientY: rect.top + rect.height * 0.2
      }));
      shell?.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        composed: true,
        clientX: rect.left + rect.width * 0.6,
        clientY: rect.top + rect.height * 0.35
      }));
      shell?.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        composed: true
      }));
      await until(() => namedSlot.assignedElements().length > 0, 5_000, '(overlay rect committed)');
      const [rect2] = namedSlot.assignedElements();
      expect(rect2.getBoundingClientRect().height).toBeGreaterThan(0);

      // The preview runs play() on load: leave the demo in a neutral,
      // touchable state — disarm the draw mode (keep the highlight; the
      // bar still shows it). An armed crosshair on a fresh visit reads
      // as a broken viewer.
      getDemoEl(canvasElement)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]')?.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        composed: true
      }));
      await until(() => getDemoEl(canvasElement)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]')?.getAttribute('aria-pressed') === 'false', 5_000, '(play leaves draw disarmed)');
    });
  }
}`,...C.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  render: () => html\`<cosmoz-document-viewer .pages=\${pdfPages}></cosmoz-document-viewer>\`,
  play: async ({
    canvasElement
  }) => {
    await until(() => getViewer(canvasElement)?.ready === true);
    await until(() =>
    // Rasters are object-URLs since toBlob (data: URLs long-tasked rAF).
    getFirstPage(getViewer(canvasElement))?.shadowRoot?.querySelector('img')?.src?.startsWith('blob:') === true);
  }
}`,...M.parameters?.docs?.source}}};const Ve=["Showcase","Default"];C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: '01 - Showcase (highlights, zoom, resize)',
  parameters: {
    docs: {
      description: {
        story: 'What surrounds the viewer is **not the component**: toolbar (marker mode, highlight next/prev, zoom controls, fit, page readout) and the resizable viewport are a demo shell built on the public API — the component itself is the bare viewer strip with no chrome.'
      }
    }
  },
  render: () => html\`<cosmoz-document-viewer-demo
            .annotate=\${true}
            .heading=\${'Alice\\u2019s Adventures in Wonderland'}
            .url=\${PDF_URL}
        ></cosmoz-document-viewer-demo>\`,
  play: async ({
    canvasElement,
    step
  }) => {
    await until(() => getDemoViewer(canvasElement)?.ready === true);
    const viewer = getDemoViewer(canvasElement);
    const pageEl = getFirstPage(viewer);
    const namedSlot = pageEl?.querySelector('slot[name="page-0-overlay"]') as HTMLSlotElement;
    expect(namedSlot.assignedElements().length).toBe(0);
    await step('Marker button arms highlight draw mode', async () => {
      const marker = getDemoEl(canvasElement)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]');
      marker?.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        composed: true
      }));
      // Armed = the scroller hands the pointer over (the draw layer owns
      // touch-action through the part, since it's decided at gesture start).
      await until(() => {
        const sc = getDemoViewer(canvasElement)?.shadowRoot?.querySelector('.scroll-container');
        return marker?.getAttribute('aria-pressed') === 'true' && sc != null && getComputedStyle(sc).touchAction === 'none';
      }, 5_000, '(armed: scroller hands the pointer over)');
    });
    await step('Marquee in highlight mode adds an overlay rect', async () => {
      const container = pageEl?.shadowRoot?.querySelector('.page-container');
      const rect = container!.getBoundingClientRect();
      const shell = getDemoEl(canvasElement)?.shadowRoot?.querySelector('.shell');
      // Mode first (the marker toggle), then a drag = a rectangle.
      shell?.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        composed: true,
        clientX: rect.left + rect.width * 0.4,
        clientY: rect.top + rect.height * 0.2
      }));
      shell?.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        composed: true,
        clientX: rect.left + rect.width * 0.6,
        clientY: rect.top + rect.height * 0.35
      }));
      shell?.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        composed: true
      }));
      await until(() => namedSlot.assignedElements().length > 0, 5_000, '(overlay rect committed)');
      const [rect2] = namedSlot.assignedElements();
      expect(rect2.getBoundingClientRect().height).toBeGreaterThan(0);

      // The preview runs play() on load: leave the demo in a neutral,
      // touchable state — disarm the draw mode (keep the highlight; the
      // bar still shows it). An armed crosshair on a fresh visit reads
      // as a broken viewer.
      getDemoEl(canvasElement)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]')?.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        composed: true
      }));
      await until(() => getDemoEl(canvasElement)?.shadowRoot?.querySelector('cosmoz-button[label="Toggle highlight mode"]')?.getAttribute('aria-pressed') === 'false', 5_000, '(play leaves draw disarmed)');
    });
  }
}`,...C.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  render: () => html\`<cosmoz-document-viewer .pages=\${pdfPages}></cosmoz-document-viewer>\`,
  play: async ({
    canvasElement
  }) => {
    await until(() => getViewer(canvasElement)?.ready === true);
    await until(() =>
    // Rasters are object-URLs since toBlob (data: URLs long-tasked rAF).
    getFirstPage(getViewer(canvasElement))?.shadowRoot?.querySelector('img')?.src?.startsWith('blob:') === true);
  }
}`,...M.parameters?.docs?.source}}};export{M as Default,C as Showcase,Ve as __namedExportsOrder,Ue as default};
