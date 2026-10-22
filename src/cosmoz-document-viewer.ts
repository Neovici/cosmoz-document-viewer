import { flow } from '@lit-labs/virtualizer/layouts/flow.js';
import {
	virtualize,
	VirtualizerHostElement,
	virtualizerRef,
} from '@lit-labs/virtualizer/virtualize.js';
import {
	component,
	css,
	html,
	useEffect,
	useRef,
	useState,
} from '@pionjs/pion';
import { useProperty } from '@pionjs/pion/lib/use-property';
import { ref } from 'lit-html/directives/ref.js';
import { DEFAULT_NATURAL_WIDTH } from './cosmoz-document-viewer-page';
import { useCurrentPage } from './use-current-page';
import { useDragPan } from './use-drag-pan';
import { usePinchZoom } from './use-pinch-zoom';
import { useZoomAnchor } from './use-zoom-anchor';
import { roundToStep, ZOOM_IN_STEP, ZOOM_OUT_STEP } from './zoom-model';

type ZoomMode = 'fit' | 'manual';

/** A page is either a ready URL (image) or a lazy renderer returning one. */
type PageInput = string | (() => Promise<string>);

interface Props {
	/** The document's pages: image URLs or thunks that resolve to one. */
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

const emptyPages: PageInput[] = [];

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
		display: flex;
		flex-direction: column;
		padding: 0;
		min-height: 100%;
	}

	.page-wrapper {
		/* Sizing note: fit zoom makes a page exactly the container's width. For
		 * widths past fit this wrapper grows to the page instead of clipping it
		 * invisibly (width: 100% would keep the overflow out of the scroll
		 * container's reach — the touch pan user-visible bug). */
		min-width: 100%;
		width: max-content;
		display: flex;
		justify-content: center;
	}
`;

/**
 * Continuously vertically scrolling document viewer (lit-virtualizer).
 * Page rendering, scroll anchoring and pan live here; zoom and the
 * page choice are owned by the embedding view and passed as properties —
 * every internal flip (Ctrl+wheel) is announced with a cancelable
 * `*-changed` event so the view can lift it into its state.
 */
const CosmozDocumentViewer = (host: Host) => {
	const [naturalWidth, setNaturalWidth] = useState(DEFAULT_NATURAL_WIDTH);
	const [containerWidth, setContainerWidth] = useState(0);
	const [currentPage, setCurrentPage] = useProperty<number>(
		'currentPage',
		() => 0,
	);
	const [, setReady] = useProperty<boolean>('ready', () => false);
	const [pages, setPages] = useState<(string | (() => Promise<string>))[]>([]);
	const scrollRef = useRef<HTMLElement>();
	const pagesRef = useRef<VirtualizerHostElement>();
	const pinchBusy = useRef(false);

	// Refs kept in sync with state so ResizeObserver / event closures see
	// current values without needing to re-register.
	const naturalWidthRef = useRef(DEFAULT_NATURAL_WIDTH);
	naturalWidthRef.current = naturalWidth;
	const zoomRef = useRef<number>(1.0);
	zoomRef.current = host.zoom ?? 1.0;

	// Read reactively (render-tracking) so a post-mount zoomMode change works;
	// host properties are not attribute-mapped (no zoom-mode="" attribute).
	const zoomMode = host.zoomMode as ZoomMode | undefined;
	const source = host.pages ?? emptyPages;

	// ── derived ──────────────────────────────────────────────────────────

	const zoom = host.zoom ?? 1.0;
	const fitZoom = containerWidth > 0 ? containerWidth / naturalWidth : 1.0;
	// Until the view owns zoom, pages display fitted to the container.
	let pageWidth = naturalWidth;
	if (host.zoom != null) {
		pageWidth = naturalWidth * zoom;
	} else if (containerWidth > 0) {
		pageWidth = Math.min(naturalWidth, containerWidth);
	}

	// ── hooks ────────────────────────────────────────────────────────────

	const emitZoom = (value: number, reason?: string) =>
		host.dispatchEvent(
			new CustomEvent('zoom-changed', {
				detail: reason ? { value, reason } : { value },
				bubbles: true,
				composed: true,
			}),
		);

	const zoomAnchor = useZoomAnchor({
		scrollRef,
		pagesRef,
		zoom,
		pageWidth,
		containerWidth,
		pinchBusy,
	});
	useCurrentPage(scrollRef, pagesRef, pages, setCurrentPage, currentPage);
	useDragPan(scrollRef);
	usePinchZoom({
		scrollRef,
		pagesRef,
		naturalWidthRef,
		emitZoom,
		pinchBusy,
		anchorRef: zoomAnchor.anchorRef,
	});

	// ── document change ──────────────────────────────────────────────────

	useEffect(() => {
		setPages(source);
	}, [source]);

	useEffect(() => {
		setNaturalWidth(DEFAULT_NATURAL_WIDTH);
		setReady(false);
	}, [source]);

	// ── change events ────────────────────────────────────────────────────

	useEffect(() => {
		emit(host, 'fit-zoom-changed', fitZoom);
	}, [fitZoom]);

	// Page count for the strip's "N of M" readout.
	useEffect(() => {
		emit(host, 'pages-changed', pages.length);
	}, [pages.length]);

	// In fit mode the zoom factor follows the container — reported, not owned.
	useEffect(() => {
		if (containerWidth === 0 || zoomMode !== 'fit') return;
		host.dispatchEvent(
			new CustomEvent('zoom-changed', {
				detail: { value: fitZoom, reason: 'fit-follow' },
				bubbles: true,
				composed: true,
			}),
		);
	}, [containerWidth, naturalWidth, zoomMode]);

	// ── container width ──────────────────────────────────────────────────

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				// Capture the scroll anchor before the container width changes so
				// manual-mode zooms keep the focal point steady.
				zoomAnchor.capture(el);
				setContainerWidth(entry.contentRect.width);
			}
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// ── page-ready: base width + ready flag ──────────────────────────────

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const onPageReady = (e: Event) => {
			const detail = (e as CustomEvent<{ naturalWidth: number }>).detail;
			if (naturalWidthRef.current === DEFAULT_NATURAL_WIDTH) {
				setNaturalWidth(detail.naturalWidth);
			}
			setReady(true);
		};
		el.addEventListener('page-ready', onPageReady);
		return () => el.removeEventListener('page-ready', onPageReady);
	}, []);

	// ── remeasure when the natural width lands (page base size) ───────────

	useEffect(() => {
		// Optional on virtualizer versions without invalidateAndRemeasure
		// (patched in this repo until lit/lit#5417 releases): without it,
		// ResizeObserver reflows still cover rendered pages.
		pagesRef.current?.[virtualizerRef]?.invalidateAndRemeasure?.();
	}, [naturalWidth]);

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

	const renderPage = (page: string | (() => Promise<string>), index: number) =>
		html`<div class="page-wrapper" data-page="${index}">
			<cosmoz-document-viewer-page .page=${page} .width=${pageWidth ?? 0}>
				<slot name="page-${index}-overlay"></slot>
			</cosmoz-document-viewer-page>
		</div>`;

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
				${ref((el) => {
					pagesRef.current = el as VirtualizerHostElement;
				})}
			>
				${virtualize({
					items: pages,
					keyFunction: (_, i) => String(i),
					renderItem: (item, index) => renderPage(item, index),
					layout: flow({ estimatedItemHeight: 1200 }),
				})}
			</div>
		</div>
	`;
};

const cosmozDocumentViewer = component(CosmozDocumentViewer, {
	styleSheets: [styles],
});

customElements.define('cosmoz-document-viewer', cosmozDocumentViewer);

export { CosmozDocumentViewer, cosmozDocumentViewer };
export type { PageInput, ZoomMode };
