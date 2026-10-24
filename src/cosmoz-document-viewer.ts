import {
	component,
	css,
	html,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@pionjs/pion';
import { useProperty } from '@pionjs/pion/lib/use-property';
import { ref } from 'lit-html/directives/ref.js';
import { DEFAULT_NATURAL_WIDTH } from './cosmoz-document-viewer-page.js';
import { DEFAULT_RATIO, stripLayout } from './strip-layout.js';
import { useDragPan } from './use-drag-pan.js';
import { usePinchZoom } from './use-pinch-zoom.js';
import { useZoomAnchor } from './use-zoom-anchor.js';
import { virtualWindow } from './virtual-window.js';
import { roundToStep, ZOOM_IN_STEP, ZOOM_OUT_STEP } from './zoom-model.js';

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
	/** Suspends the strip's pan/pinch/tap gestures when false — annotation
	 *  layers own the pointer; wheel and property zoom keep working. */
	gestures?: boolean;
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
export type PagePoint = { page: number } & Required<RegionRect>;

export interface CosmozDocumentViewerElement extends HTMLElement, Props {
	/** Centers the unit-space region on the viewport. */
	jumpToRegion(page: number, rect: RegionRect): void;
	/** The page under a client point, in unit space. */
	pageAtPoint(x: number, y: number): PagePoint | null;
}

type Host = CosmozDocumentViewerElement;

/** A page's upfront ratio: LazyPage may carry one; anything else defaults. */
const ratioOf = (p: PageInput): number =>
	typeof p === 'object' ? (p.ratio ?? DEFAULT_RATIO) : DEFAULT_RATIO;

const emptySpecs: readonly PageInput[] = [];

const OVERSCAN = 1200; // strip px rendered beyond the viewport, both sides

const styles = css`
	:host {
		display: flex;
		flex-direction: column;
		position: relative;
		height: 100%;
		width: 100%;
		overflow: hidden;
		background: var(--cz-color-bg-primary);
	}

	.scroll-container {
		flex: 1;
		overflow: auto;
		scrollbar-gutter: stable;
		padding: 0;
		/* Touch pan/pinch is app-owned (use-pinch-zoom); fling decay stands
		 * in for native touch scrolling inertia. */
		touch-action: none;
	}

	.scroll-container[data-ctrl] {
		cursor: grab;
	}

	.scroll-container[data-dragging] {
		cursor: grabbing;
		user-select: none;
	}

	.pages {
		position: relative;
		width: 100%;
		min-height: 100%;
	}

	.page-wrapper {
		position: absolute;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
	}
`;

/**
 * Continuously vertically scrolling document viewer built on a proportional
 * strip layout (`strip-layout`): all pages share one width and positions
 * are prefix sums of per-page aspect ratios, so zooming is exact and
 * anchored restore is closed-form. Page rendering, scroll tracking and pan
 * live here; zoom and the current page are owned by the embedding view and
 * passed as properties — every internal flip (Ctrl+wheel, pinch) is
 * announced with a `zoom-changed` event so the view lifts it into its state.
 */
const CosmozDocumentViewer = (host: Host) => {
	const [naturalWidth, setNaturalWidth] = useState(DEFAULT_NATURAL_WIDTH);
	const [containerWidth, setContainerWidth] = useState(0);
	const [currentPage, setCurrentPage] = useProperty<number>(
		'currentPage',
		() => 0,
	);
	const [, setReady] = useProperty<boolean>('ready', () => false);
	const [fitZoom, setFitZoom] = useProperty<number>('fitZoom', () => 0);
	const [, setPageCount] = useProperty<number>('pageCount', () => 0);
	const [ratios, setRatios] = useState<number[]>([]);
	const [range, setRange] = useState({ from: 0, lastInclusive: -1 });
	// Last scroll-event position. The zoom anchor captures from this mirror,
	// because a DOM read at zoom-render time is already clamped to the new
	// (smaller) layout.
	const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
	const scrollRef = useRef<HTMLElement>();
	const pagesRef = useRef<HTMLElement>();
	const pinchBusy = useRef(false);
	const lastPublishedRef = useRef(0);
	const naturalWidthRef = useRef<number>(DEFAULT_NATURAL_WIDTH);
	naturalWidthRef.current = naturalWidth;

	// Read reactively (render-tracking) so a post-mount zoomMode change
	// works; host properties are not attribute-mapped.
	const zoomMode = host.zoomMode as ZoomMode | undefined;
	const source = host.pages ?? emptySpecs;

	// ── derived ──────────────────────────────────────────────────────────

	// Until the view owns zoom, pages display fitted to the container.
	let pageWidth = naturalWidth;
	if (host.zoom != null) {
		pageWidth = naturalWidth * host.zoom;
	} else if (containerWidth > 0) {
		pageWidth = Math.min(naturalWidth, containerWidth);
	}
	const pageWidthRef = useRef(0);
	pageWidthRef.current = pageWidth;
	const layout = useMemo(
		() => stripLayout(ratios, pageWidth),
		[ratios, pageWidth],
	);

	const emitZoom = (value: number, reason?: string) =>
		host.dispatchEvent(
			new CustomEvent('zoom-changed', {
				detail: reason ? { value, reason } : { value },
				bubbles: true,
				composed: true,
			}),
		);

	// ── hooks ────────────────────────────────────────────────────────────

	const zoomAnchor = useZoomAnchor({
		scrollRef,
		scroll: scrollPos,
		zoom: host.zoom,
		containerWidth,
		pinchBusy,
		fitZoom,
	});
	useDragPan({ scrollRef, enabled: host.gestures !== false });
	usePinchZoom({
		scrollRef,
		pagesRef,
		naturalWidthRef,
		pageWidthRef,
		emitZoom,
		pinchBusy,
		enabled: host.gestures !== false,
	});

	// ── element API: annotation primitives ───────────────────────────────

	// Imperative methods assigned on the host so closures see the current
	// render's layout; pion components don't declare class methods.

	/** Inverse locator: a client point (viewport coords) projected onto the
	 *  strip — the page index plus that point in unit space. Null when
	 *  off-document. Annotation layers draw with this. */
	host.pageAtPoint = (x: number, y: number) => {
		const el = scrollRef.current;
		const pw = pageWidthRef.current;
		if (!el || !pw) {
			return null;
		}
		const b = el.getBoundingClientRect();
		const sy = el.scrollTop + y - b.top;
		if (sy < 0 || sy >= layout.totalHeight) {
			return null;
		}
		const page = layout.pageAt(sy);
		const pageH = layout.pageHeight(page);
		const stripW = Math.max(el.clientWidth, pw);
		const sx = el.scrollLeft + x - b.left - (stripW - pw) / 2;
		return {
			page,
			width: pw,
			height: pageH,
			x: sx / pw,
			y: (sy - layout.positions[page]) / pageH,
		};
	};

	/** Lands the unit-space region's center at the viewport's center at
	 *  the current zoom; page-edge regions clamp instead of overscrolling. */
	host.jumpToRegion = (page: number, rect: RegionRect) => {
		const el = scrollRef.current;
		const pw = pageWidthRef.current;
		if (!el || !pw || layout.positions[page] == null) {
			return;
		}
		const pageH = layout.pageHeight(page);
		const cY = layout.positions[page] + (rect.y + rect.height / 2) * pageH;
		const stripW = Math.max(el.clientWidth, pw);
		const cX = (stripW - pw) / 2 + (rect.x + rect.width / 2) * pw;
		el.scrollTop = Math.max(
			0,
			Math.min(cY - el.clientHeight / 2, el.scrollHeight - el.clientHeight),
		);
		el.scrollLeft = Math.max(
			0,
			Math.min(cX - el.clientWidth / 2, el.scrollWidth - el.clientWidth),
		);
	};

	// One effect owns the whole document lifecycle: ratio seeds from the
	// input, natural-width and ready reset, page count reported.
	useEffect(() => {
		setRatios(source.map(ratioOf));
		setNaturalWidth(DEFAULT_NATURAL_WIDTH);
		setReady(false);
		setPageCount(source.length);
	}, [source]);

	// Fit zoom: derived from the container, reported to consumers. When the
	// view follows (fit mode) the value is lifted into zoom ownership.
	useEffect(() => {
		const fit =
			containerWidth > 0 ? Math.min(1, containerWidth / naturalWidth) : 1.0;
		setFitZoom(fit);
		if (containerWidth === 0 || zoomMode !== 'fit') return;
		emitZoom(fit, 'fit-follow');
	}, [containerWidth, naturalWidth, zoomMode]);

	// ── container width ──────────────────────────────────────────────────

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				// A zoom following this resize (fit-follow adoption) captures
				// its own fresh anchor in useZoomAnchor; pre-capturing here
				// would survive plain scrolls and restore from a stale spot.
				setContainerWidth(entry.contentRect.width);
			}
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// ── virtual window + page tracking ───────────────────────────────────

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const update = () => {
			const { scrollLeft: x, scrollTop: y, clientHeight: h } = el;
			setScrollPos({ x, y });
			setRange(layout.range(y - OVERSCAN, y + h + OVERSCAN));
			// The page at the container's vertical midpoint is the current
			// one; the layout is exact, so this publishes deterministically.
			const page = layout.pageAt(y + h / 2);
			if (page !== lastPublishedRef.current) {
				lastPublishedRef.current = page;
				setCurrentPage(page);
			}
		};
		update();
		el.addEventListener('scroll', update);
		return () => el.removeEventListener('scroll', update);
	}, [layout]);

	// External currentPage writes (view-driven navigation): the layout is
	// exact, so one closed-form assignment lands the jump.
	useEffect(() => {
		if (!source.length || currentPage == null) return;
		if (currentPage === lastPublishedRef.current) return;
		lastPublishedRef.current = currentPage;
		const el = scrollRef.current;
		if (el) el.scrollTop = layout.positions[currentPage] ?? 0;
	}, [currentPage, source.length]);

	// ── page-ready: ratio, base width + ready flag ───────────────────────

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const onPageReady = (e: Event) => {
			const {
				index,
				ratio,
				naturalWidth: nw,
			} = (
				e as CustomEvent<{ index: number; ratio: number; naturalWidth: number }>
			).detail;
			if (
				naturalWidthRef.current === DEFAULT_NATURAL_WIDTH &&
				typeof nw === 'number' &&
				nw > 0
			) {
				setNaturalWidth(nw);
			}
			if (typeof ratio === 'number' && ratio > 0) {
				setRatios((prev) => {
					const next = [...prev];
					next[index] = ratio;
					return next;
				});
			}
			setReady(true);
		};
		el.addEventListener('page-ready', onPageReady);
		return () => el.removeEventListener('page-ready', onPageReady);
	}, []);

	// ── wheel zoom: announce the intent, nothing more ─────────────────────

	const onWheel = (e: WheelEvent) => {
		if (!e.ctrlKey || pinchBusy.current) return;
		e.preventDefault();
		if (scrollRef.current) {
			zoomAnchor.capture(scrollRef.current);
		}
		emitZoom(
			roundToStep(
				(host.zoom ?? fitZoom ?? 1) *
					(e.deltaY > 0 ? ZOOM_OUT_STEP : ZOOM_IN_STEP),
			),
			'wheel',
		);
	};

	const renderPage = (i: number) => {
		const p = source[i];
		const page = typeof p === 'object' ? p.render : p;
		return html`<cosmoz-document-viewer-page
			.page=${page ?? ''}
			.width=${pageWidth ?? 0}
			.index=${i}
		>
			<slot name="page-${i}-overlay"></slot>
		</cosmoz-document-viewer-page>`;
	};

	return html`
		<div
			class="scroll-container"
			${ref((el) => {
				scrollRef.current = el as HTMLElement;
			})}
			@wheel=${onWheel}
		>
			<div
				class="pages"
				style="min-height: ${layout.totalHeight}px; min-width: ${pageWidth}px"
				${ref((el) => {
					pagesRef.current = el as HTMLElement;
				})}
			>
				${virtualWindow({ layout, range, renderItem: renderPage })}
			</div>
		</div>
	`;
};

const cosmozDocumentViewer = component(CosmozDocumentViewer, {
	styleSheets: [styles],
});

customElements.define('cosmoz-document-viewer', cosmozDocumentViewer);

export { CosmozDocumentViewer, cosmozDocumentViewer };
export type { ZoomMode };
