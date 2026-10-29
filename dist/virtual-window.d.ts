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
import { type TemplateResult } from 'lit-html';
export interface VirtualWindowRange {
    from: number;
    lastInclusive: number;
}
export interface VirtualWindowConfig {
    /** Strip layout: the pages' absolute top positions. */
    layout: {
        positions: number[];
    };
    range: VirtualWindowRange;
    /** Renders one page's content; the positioned wrapper is this module's. */
    renderItem: (index: number) => unknown;
}
export declare const virtualWindow: (config: VirtualWindowConfig) => TemplateResult;
