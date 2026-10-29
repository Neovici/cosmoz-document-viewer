type ZoomMode = 'fit' | 'manual';
/** A page is a ready URL, or a lazy renderer that resolves to one. The
 *  renderer form may carry the page's aspect ratio upfront (PDF loaders
 *  know it before rasterizing), which keeps the layout fully stable on
 *  mount. */
export interface LazyPage {
    /** Invoked when the page first enters the viewport; the result is
     *  memoized on this object. */
    render: () => Promise<string>;
    /** Height/width ratio of the rendered page. */
    ratio?: number;
}
export type PageInput = string | LazyPage | (() => Promise<string>);
interface Props {
    /** The document's pages. */
    pages?: PageInput[];
    /** Zoom factor; owned by the embedding view (two-way via `zoom-changed`). */
    zoom?: number;
    /** How the zoom factor was chosen: `fit` width-follows the container. */
    zoomMode?: ZoomMode;
}
/** A region in page unit space: every edge is a 0..1 fraction of the page. */
export interface RegionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
/** `pageAtPoint`'s result: the page index plus the point in unit space,
 *  and the page's unit box for convenience. */
export type PagePoint = {
    page: number;
} & Required<RegionRect>;
export interface CosmozDocumentViewerElement extends HTMLElement, Props {
    /** Centers the unit-space region on the viewport. */
    jumpToRegion(page: number, rect: RegionRect): void;
    /** The page under a client point, in unit space. */
    pageAtPoint(x: number, y: number): PagePoint | null;
}
type Host = CosmozDocumentViewerElement;
/**
 * Continuously vertically scrolling document viewer built on a proportional
 * strip layout (`strip-layout`): all pages share one width and positions
 * are prefix sums of per-page aspect ratios, so zooming is exact and
 * anchored restore is closed-form. Page rendering and scroll tracking live
 * here; scrolling is the container's native behavior and zoom plus the
 * current page are owned by the embedding view and passed as properties —
 * Ctrl+wheel announces intent with a `zoom-changed` event so the view lifts
 * it into its state.
 */
declare const CosmozDocumentViewer: (host: Host) => import("lit-html").TemplateResult<1>;
declare const cosmozDocumentViewer: import("@pionjs/pion/lib/component.js").ComponentConstructor<CosmozDocumentViewerElement>;
export { CosmozDocumentViewer, cosmozDocumentViewer };
export type { ZoomMode };
