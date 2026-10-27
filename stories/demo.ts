/**
 * Storybook demo shell for the document viewer: a small pion "app"
 * demonstrating the viewer's contract — zoom/current-page state lifted from
 * events, zoom controls driving the property back, and a resizable viewport
 * showing fit-mode refollow while dragging.
 */
import '@neovici/cosmoz-button';
import '@neovici/cosmoz-tokens/semantic';
import {
	component,
	css,
	html,
	useEffect,
	useRef,
	useState,
} from '@pionjs/pion';
import { ref } from 'lit-html/directives/ref.js';
import type { CosmozDocumentViewerElement } from '../src/cosmoz-document-viewer';
import { roundToStep, ZOOM_IN_STEP, ZOOM_OUT_STEP } from '../src/zoom-model';
import { loadPdfPages } from './pdf';

const MARKER_SVG = html`<svg
	width="16"
	height="16"
	viewBox="0 0 24 24"
	fill="currentColor"
>
	<path
		d="M15.8 3.2a2.5 2.5 0 0 1 3.5 0l1.5 1.5a2.5 2.5 0 0 1 0 3.5L11.2 17.8l-5.5 1.1 1.1-5.5 9-10.2z"
	/>
</svg>`;

const styles = css`
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
`;

interface Props {
	/** Title shown in the demo title bar. */
	heading?: string;
	/** Same-origin PDF asset URL. */
	url?: string;
	/** Highlight mode: a marker button arms drawing; drag paints a
	 *  unit-space yellow rectangle clamped to one page. */
	annotate?: boolean;
}

interface Highlight {
	id: number;
	page: number;
	/** Unit space (0..1) — overlays are %-positioned, scale with zoom. */
	x: number;
	y: number;
	width: number;
	height: number;
}

type Host = HTMLElement & Props;

const fmtPercent = (z?: number) => (z ? `${Math.round(z * 100)}%` : '—');

const Demo = (host: Host) => {
	const [thunks, setThunks] = useState<(() => Promise<string>)[] | null>(null);
	const [zoom, setZoom] = useState<number>(undefined);
	const [fitZoom, setFitZoom] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState(0);
	const [pageCount, setPageCount] = useState(0);
	const [loadError, setLoadError] = useState('');
	const [highlights, setHighlights] = useState<Highlight[]>([]);
	const [highlightMode, setHighlightMode] = useState(false);
	const [activeId, setActiveId] = useState<number | null>(null);
	const [draw, setDrawRender] = useState<{
		page: number;
		x0: number;
		y0: number;
		x1?: number;
		y1?: number;
	} | null>(null);
	const drawRef = useRef<{
		page: number;
		x0: number;
		y0: number;
		x1?: number;
		y1?: number;
	} | null>(null);
	// Closure state lags a render behind sync event chains (pointer
	// down→move→up can share one frame) — handlers read the ref, the
	// state only paints the preview.
	const setDraw = (d: typeof drawRef.current) => {
		drawRef.current = d;
		setDrawRender(d);
	};
	const highlightId = useRef(0);
	const shellRef = useRef<HTMLDivElement>();
	const viewerRef = useRef<CosmozDocumentViewerElement>();

	useEffect(() => {
		if (!host.url) return;
		let cancelled = false;
		setThunks(null);
		loadPdfPages(host.url).then(
			(t) => {
				if (!cancelled) setThunks(t);
			},
			(e) => {
				if (!cancelled) setLoadError(String(e));
			},
		);
		return () => {
			cancelled = true;
		};
	}, [host.url]);

	// Lift the viewer's announcements into the demo's state.
	const onZoomChanged = (e: CustomEvent) => {
		setZoom(e.detail?.value);
	};

	const zoomStep = (step: number) => {
		setZoom(roundToStep((zoom || fitZoom || 1) * step));
	};

	const onHandleDown = (e: PointerEvent) => {
		const el = shellRef.current;
		if (!el) return;
		e.preventDefault();
		const startWidth = el.offsetWidth;
		const startHeight = el.offsetHeight;
		const startX = e.clientX;
		const startY = e.clientY;
		const handle = e.currentTarget as HTMLElement;
		handle.setPointerCapture(e.pointerId);
		const onMove = (ev: PointerEvent) => {
			el.style.width = `${Math.max(160, startWidth + ev.clientX - startX)}px`;
			el.style.height = `${Math.max(120, startHeight + ev.clientY - startY)}px`;
		};
		const onUp = () => {
			handle.removeEventListener('pointermove', onMove);
			handle.removeEventListener('pointerup', onUp);
			handle.removeEventListener('pointercancel', onUp);
		};
		handle.addEventListener('pointermove', onMove);
		handle.addEventListener('pointerup', onUp);
		handle.addEventListener('pointercancel', onUp);
	};

	// ── highlight draw mode ──────────────────────────────────────────────

	/** Reading order (page, then vertical position) for the next/prev walk. */
	const sorted = () =>
		[...highlights].sort((a, b) => a.page - b.page || a.y - b.y);

	const jump = (dir: number) => {
		const viewer = viewerRef.current;
		if (!viewer || !highlights.length) {
			return;
		}
		const list = sorted();
		const i = list.findIndex((h) => h.id === activeId);
		let at: number;
		if (i < 0) {
			// Nothing active yet: ‹ lands on the last read first, › on the first.
			at = dir > 0 ? 0 : list.length - 1;
		} else {
			at = (i + (dir > 0 ? 1 : -1) + list.length) % list.length;
		}
		const h = list[at];
		// Region centers on the viewport center; page-edge highlights clamp
		// on the document's boundary instead of overscrolling.
		setActiveId(h.id);
		viewer.jumpToRegion(h.page, h);
	};

	const onPointerDown = (e: PointerEvent) => {
		if (!highlightMode) {
			return;
		}
		// Toolbar clicks bubble through the shell — don't draw from them.
		if (
			e.target instanceof Element &&
			e.target.closest('button, cosmoz-button')
		) {
			return;
		}
		const viewer = viewerRef.current;
		const at = viewer?.pageAtPoint(e.clientX, e.clientY);
		if (!at) {
			return;
		}
		setDraw({ page: at.page, x0: at.x, y0: at.y });
		try {
			// Real pointers capture so drags continue outside the shell;
			// synthetic events (id 0) have no active pointer to capture.
			shellRef.current?.setPointerCapture(e.pointerId);
		} catch {
			/* nothing to capture */
		}
	};

	const onPointerMove = (e: PointerEvent) => {
		const d = drawRef.current;
		if (!d) {
			return;
		}
		const at = viewerRef.current?.pageAtPoint(e.clientX, e.clientY);
		// Rects clamp to the page they started on — no cross-page spans,
		// and a corner dragged past the page edge clamps to the edge.
		if (!at || at.page !== d.page) {
			return;
		}
		setDraw({
			...d,
			x1: Math.min(1, Math.max(0, at.x)),
			y1: Math.min(1, Math.max(0, at.y)),
		});
	};

	const onPointerUp = () => {
		const d = drawRef.current;
		if (!d || d.x1 == null) {
			setDraw(null);
			return;
		}
		const x = Math.min(d.x0, d.x1);
		const y = Math.min(d.y0, d.y1 ?? 0);
		setHighlights([
			...highlights,
			{
				id: highlightId.current++,
				page: d.page,
				x,
				y,
				width: Math.abs(d.x1 - d.x0),
				height: Math.abs((d.y1 ?? 0) - d.y0),
			},
		]);
		setDraw(null);
	};

	return html`
		<style>
			${styles}
		</style>
		<div
			class="shell"
			?annotate=${highlightMode}
			@pointerdown=${onPointerDown}
			@pointermove=${onPointerMove}
			@pointerup=${onPointerUp}
			${ref((el) => (shellRef.current = el as HTMLDivElement))}
		>
			<cosmoz-document-viewer
				style="flex: 1"
				${ref((el) => (viewerRef.current = el as CosmozDocumentViewerElement))}
				.pages=${thunks ?? []}
				.zoomMode=${'fit'}
				.zoom=${zoom}
				?data-draw-armed=${highlightMode}
				@zoom-changed=${onZoomChanged}
				@fit-zoom-changed=${(e: CustomEvent) =>
					setFitZoom(e.detail?.value ?? 0)}
				@current-page-changed=${(e: CustomEvent) =>
					setCurrentPage(e.detail?.value)}
				@page-count-changed=${(e: CustomEvent) =>
					setPageCount(e.detail?.value ?? 0)}
			>
				${highlights.map(
					(h) => html`
						<span
							class="hl ${h.id === activeId ? 'active' : ''}"
							slot="page-${h.page}-overlay"
							style="left: ${h.x * 100}%; top: ${h.y * 100}%; width: ${h.width *
							100}%; height: ${h.height * 100}%;"
						></span>
					`,
				)}
				${draw
					? html`<span
							class="hl drawing"
							slot="page-${draw.page}-overlay"
							style="left: ${Math.min(draw.x0, draw.x1 ?? draw.x0) *
							100}%; top: ${Math.min(draw.y0, draw.y1 ?? draw.y0) *
							100}%; width: ${Math.abs((draw.x1 ?? draw.x0) - draw.x0) *
							100}%; height: ${Math.abs((draw.y1 ?? draw.y0) - draw.y0) *
							100}%;"
						></span>`
					: ''}
			</cosmoz-document-viewer>
			${!thunks
				? html`<div class="loading">
						${loadError
							? html`<span>Failed to load: ${loadError}</span>`
							: 'Loading document…'}
					</div>`
				: ''}
			<div class="titlebar">
				<span class="title">${host.heading ?? 'Document'}</span>
				<button @click=${() => zoomStep(ZOOM_OUT_STEP)}>−</button>
				<span class="zoom-pct">${fmtPercent(zoom || fitZoom)}</span>
				<button @click=${() => zoomStep(ZOOM_IN_STEP)}>+</button>
				<button @click=${() => setZoom(fitZoom)} ?disabled=${!fitZoom}>
					Fit
				</button>
				<span class="page-indicator"
					>${pageCount ? `${currentPage + 1} / ${pageCount}` : ''}</span
				>
			</div>
			<div
				class="resize-handle"
				@pointerdown=${onHandleDown}
				title="Drag to resize"
			></div>
			<div class="annotation-bar" ?data-armed=${highlightMode}>
				<cosmoz-button
					variant=${highlightMode ? 'primary' : 'tertiary'}
					size="sm"
					aria-pressed=${highlightMode ? 'true' : 'false'}
					label="Toggle highlight mode"
					title="Highlight mode: drag on a page to draw a rectangle"
					@click=${() => {
						setHighlightMode(!highlightMode);
						setDraw(null);
					}}
					>${MARKER_SVG}</cosmoz-button
				>
				${highlights.length
					? html`
							<cosmoz-button
								variant="tertiary"
								size="sm"
								label="Previous highlight"
								@click=${() => jump(-1)}
							>
								‹
							</cosmoz-button>
							<span class="highlight-indicator"
								>${Math.max(
									1,
									sorted().findIndex((h) => h.id === activeId) + 1,
								)}
								/ ${highlights.length}</span
							>
							<cosmoz-button
								variant="tertiary"
								size="sm"
								label="Next highlight"
								@click=${() => jump(1)}
							>
								›
							</cosmoz-button>
							<cosmoz-button
								variant="tertiary"
								size="sm"
								label="Clear highlights"
								@click=${() => {
									setHighlights([]);
									setActiveId(null);
								}}
								>Clear</cosmoz-button
							>
						`
					: ''}
			</div>
		</div>
	`;
};

const demo = component(Demo, { styleSheets: [styles] });

customElements.define('cosmoz-document-viewer-demo', demo);

export { demo };
