/**
 * virtualWindow — lit-html directive for the strip's virtualized window:
 * only pages intersecting the viewport (+ overscan) exist; entering and
 * leaving pages are the only nodes the DOM sees move, keyed by page index
 * so persisting pages keep their element instance across range shifts.
 *
 * Positions come from the caller's strip layout (pure prefix math); a zoom
 * is a genuine re-render (positions all change), a page-ready ratio update
 * likewise. A re-render with an unchanged range/layout reports noChange —
 * nothing re-diffs, nothing re-renders.
 */
import { html, noChange, type Part, type TemplateResult } from 'lit-html';
import { Directive, directive } from 'lit-html/directive.js';
import { repeat } from 'lit-html/directives/repeat.js';

export interface VirtualWindowRange {
	from: number;
	lastInclusive: number;
}

export interface VirtualWindowConfig {
	/** Strip layout: the pages' absolute top positions. */
	layout: { positions: number[] };
	range: VirtualWindowRange;
	/** Renders one page's content; the positioned wrapper is this module's. */
	renderItem: (index: number) => unknown;
}

const buildWindow = ({ layout, range, renderItem }: VirtualWindowConfig) =>
	html`${repeat(
		Array.from(
			{ length: Math.max(0, range.lastInclusive - range.from + 1) },
			(_, j) => range.from + j,
		),
		(key) => key,
		(key) =>
			html`<div
				class="page-wrapper"
				data-page="${key}"
				style="top: ${layout.positions[key]}px"
			>
				${renderItem(key)}
			</div>`,
	)}`;

const KeyedWindow = class extends Directive {
	declare _last:
		| { layout: unknown; from: number; lastInclusive: number }
		| undefined;

	render(config: VirtualWindowConfig) {
		this.remember(config);
		return buildWindow(config);
	}

	update(_part: Part, [config]: [VirtualWindowConfig]) {
		const { layout, range } = config;
		if (
			this._last &&
			this._last.layout === layout &&
			this._last.from === range.from &&
			this._last.lastInclusive === range.lastInclusive
		) {
			return noChange; // identical window: keep the rendered DOM as-is
		}
		return this.render(config);
	}

	private remember({ layout, range }: VirtualWindowConfig) {
		this._last = {
			layout,
			from: range.from,
			lastInclusive: range.lastInclusive,
		};
	}
};

export const virtualWindow = (config: VirtualWindowConfig): TemplateResult =>
	directive(KeyedWindow)(config) as unknown as TemplateResult;
