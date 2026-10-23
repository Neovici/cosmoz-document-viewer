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

interface PageSpec {
	url?: string;
	render?: () => Promise<string>;
	ratio?: number;
}

interface Props {
	/** The document's pages. */
	pages?: PageInput[];
	/** Zoom factor; owned by the embedding view (two-way via `zoom-changed`). */
	zoom?: number;
	/** How the zoom factor was chosen: `fit` width-follows the container. */
	zoomMode?: ZoomMode;
}

export type CosmozDocumentViewerElement = HTMLElement & Props;

type Host = CosmozDocumentViewerElement;

const emit = <T>(host: EventTarget, name: string, value: T) =>
	host.dispatchEvent(
		new CustomEvent(name, { detail: { value }, bubbles: true, composed: true }),
	);

const emptySpecs: readonly PageSpec[] = [];

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
	const [specs, setSpecs] = useState<readonly PageSpec[]>(emptySpecs);
	const [ratios, setRatios] = useState<number[]>([]);
	const [range, setRange] = useState({ from: 0, lastInclusive: -1 });
	// Last scroll-event position. The zoom anchor captures from this mirror,
	// because a DOM read at zoom-render time is already clamped to the new
	// (smaller) layout.
	const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
	const scrollRef = useRef<HTMLElement>();
	const pagesRef = useRef<HTMLElement>();
	const pinchBusy = useRef(false);

	// Refs kept in sync with state so event closures see current values.
	const zoomRef = useRef<number>(1.0);
	zoomRef.current = host.zoom ?? 1.0;
	const lastPublishedRef = useRef(0);
	const naturalWidthRef = useRef<number | undefined>(DEFAULT_NATURAL_WIDTH);
	naturalWidthRef.current = naturalWidth;

	// Read reactively (render-tracking) so a post-mount zoomMode change
	// works; host properties are not attribute-mapped.
	const zoomMode = host.zoomMode as ZoomMode | undefined;
	const source = host.pages ?? emptySpecs;

	// ── derived ──────────────────────────────────────────────────────────

	const zoom = host.zoom ?? 1.0;
	const fitZoom =
		containerWidth > 0 ? Math.min(1, containerWidth / naturalWidth) : 1.0;
	// Until the view owns zoom, pages display fitted to the container.
	let pageWidth = naturalWidth;
	if (host.zoom != null) {
		pageWidth = naturalWidth * zoom;
	} else if (containerWidth > 0) {
		pageWidth = Math.min(naturalWidth, containerWidth);
	}
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
		zoom,
		pageWidth,
		containerWidth,
		pinchBusy,
		fitZoom,
	});
	useDragPan(scrollRef);
	usePinchZoom({
		scrollRef,
		pagesRef,
		naturalWidthRef,
		emitZoom,
		pinchBusy,
	});

	// ── document change ──────────────────────────────────────────────────

	useEffect(() => {
		setSpecs(
			source.map((p) => {
				if (typeof p === 'string') {
					return { url: p };
				}
				if (typeof p === 'function') {
					return { render: p };
				}
				return { render: p.render, ratio: p.ratio };
			}),
		);
	}, [source]);

	useEffect(() => {
		setRatios(specs.map((s) => s.ratio ?? DEFAULT_RATIO));
		setNaturalWidth(DEFAULT_NATURAL_WIDTH);
		setReady(false);
	}, [specs]);

	// ── change events ────────────────────────────────────────────────────

	useEffect(() => {
		emit(host, 'fit-zoom-changed', fitZoom);
	}, [fitZoom]);

	// Page count for the strip's "N of M" readout.
	useEffect(() => {
		emit(host, 'pages-changed', specs.length);
	}, [specs.length]);

	// In fit mode the zoom factor follows the container — reported, not owned.
	useEffect(() => {
		if (containerWidth === 0 || zoomMode !== 'fit') return;
		emitZoom(fitZoom, 'fit-follow');
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
			setScrollPos({ x: el.scrollLeft, y: el.scrollTop });
			const top = el.scrollTop - OVERSCAN;
			const bottom = el.scrollTop + el.clientHeight + OVERSCAN;
			setRange(layout.range(top, bottom));
			// The page at the container's vertical midpoint is the current
			// one; the layout is exact, so this publishes deterministically.
			const page = layout.pageAt(el.scrollTop + el.clientHeight / 2);
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
		if (!specs.length || currentPage == null) return;
		if (currentPage === lastPublishedRef.current) return;
		lastPublishedRef.current = currentPage;
		const el = scrollRef.current;
		if (el) el.scrollTop = layout.positions[currentPage] ?? 0;
	}, [currentPage, specs.length]);

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

	// ── remeasure when the strip's width changes ... (removed; layout is state)

	// ── wheel zoom: announce the intent, nothing more ─────────────────────

	const onWheel = (e: WheelEvent) => {
		if (!e.ctrlKey || pinchBusy.current) return;
		e.preventDefault();
		if (scrollRef.current) {
			zoomAnchor.capture(scrollRef.current);
		}
		emitZoom(
			roundToStep(
				(zoomRef.current ?? 1) * (e.deltaY > 0 ? ZOOM_OUT_STEP : ZOOM_IN_STEP),
			),
			'wheel',
		);
	};

	const renderPage = (i: number) => {
		const spec = specs[i];
		return html`<cosmoz-document-viewer-page
			.page=${spec?.url ?? spec?.render ?? ''}
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
