/**
 * Storybook demo shell for the document viewer: a small pion "app"
 * demonstrating the viewer's contract — zoom/current-page state lifted from
 * events, zoom controls driving the property back, and a resizable viewport
 * showing fit-mode refollow while dragging.
 */
import {
	component,
	css,
	html,
	useEffect,
	useRef,
	useState,
} from '@pionjs/pion';
import { ref } from 'lit-html/directives/ref.js';
import { roundToStep, ZOOM_IN_STEP, ZOOM_OUT_STEP } from '../src/zoom-model';
import { loadPdfPages } from './pdf';

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
		color: #fff;
		font-family: system-ui, sans-serif;
		font-size: 13px;
		z-index: 2;
	}
	.titlebar .title {
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

	.shell[annotate] {
		cursor: crosshair;
	}

	.stamp {
		position: absolute;
		z-index: 1;
		transform: translate(-50%, -50%) rotate(-8deg);
		padding: 0.5cqi 1.2cqi;
		border: 0.35cqi double #b3261e;
		border-radius: 0.4cqi;
		color: #b3261e;
		font-family: 'Courier New', monospace;
		font-size: clamp(10px, 1.5cqi, 24px);
		font-weight: 700;
		letter-spacing: 0.2cqi;
		text-transform: uppercase;
		opacity: 0.85;
		mix-blend-mode: multiply;
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
	/** Annotation mode: clicking a page drops a review stamp on it. */
	annotate?: boolean;
}

interface Stamp {
	id: number;
	page: number;
	x: number;
	y: number;
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
	const [stamps, setStamps] = useState<Stamp[]>([]);
	const stampId = useRef(0);
	const shellRef = useRef<HTMLDivElement>();

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

	const onAnnotate = (e: MouseEvent) => {
		if (e.target instanceof HTMLElement && e.target.closest('button')) {
			return;
		}
		const path = e.composedPath();
		const container = path.find(
			(el) =>
				el instanceof HTMLElement &&
				(el as HTMLElement).classList?.contains('page-container'),
		) as HTMLElement | undefined;
		const pageEl = path.find(
			(el) =>
				el instanceof HTMLElement &&
				el.localName === 'cosmoz-document-viewer-page',
		) as HTMLElement | undefined;
		const wrapper = pageEl?.parentElement;
		if (!container || !wrapper?.dataset?.page) return;

		const rect = container.getBoundingClientRect();
		stampId.current += 1;
		setStamps([
			...stamps,
			{
				id: stampId.current,
				page: Number(wrapper.dataset.page),
				x: ((e.clientX - rect.left) / rect.width) * 100,
				y: ((e.clientY - rect.top) / rect.height) * 100,
			},
		]);
	};

	return html`
		<style>
			${styles}
		</style>
		<div
			class="shell"
			?annotate=${host.annotate}
			@click=${host.annotate ? onAnnotate : null}
			${ref((el) => (shellRef.current = el))}
		>
			<cosmoz-document-viewer
				style="flex: 1"
				.pages=${thunks ?? []}
				.zoomMode=${'fit'}
				.zoom=${zoom}
				@zoom-changed=${onZoomChanged}
				@fit-zoom-changed=${(e: CustomEvent) =>
					setFitZoom(e.detail?.value ?? 0)}
				@current-page-changed=${(e: CustomEvent) =>
					setCurrentPage(e.detail?.value)}
				@pages-changed=${(e: CustomEvent) => setPageCount(e.detail?.value ?? 0)}
			>
				${(host.annotate ? stamps : []).map(
					(st) => html`
						<span
							class="stamp"
							slot="page-${st.page}-overlay"
							style="left: ${st.x}%; top: ${st.y}%;"
						>
							Reviewed
						</span>
					`,
				)}
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
				${host.annotate && stamps.length
					? html`<button @click=${() => setStamps([])}>Clear</button>`
					: ''}
			</div>
			<div
				class="resize-handle"
				@pointerdown=${onHandleDown}
				title="Drag to resize"
			></div>
		</div>
	`;
};

const demo = component(Demo, { styleSheets: [styles] });

customElements.define('cosmoz-document-viewer-demo', demo);

export { demo };
