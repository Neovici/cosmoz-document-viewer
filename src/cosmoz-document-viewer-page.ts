import '@neovici/cosmoz-spinner';
import { component, css, html, useEffect, useState } from '@pionjs/pion';

const styles = css`
	:host {
		display: block;
	}

	.page-container {
		position: relative;
		/* Container for slotted overlay content: sizing in cqi units scales
		 * layers (stamps, text layers) with the page's rendered size. */
		container-type: inline-size;
		background: var(--cz-color-bg-primary);
		isolation: isolate;
	}

	.page-container img {
		display: block;
		width: 100%;
		height: auto;
		filter: var(--cosmoz-document-viewer-page-filter, none);
		mix-blend-mode: var(--cosmoz-document-viewer-page-blend-mode, multiply);
		transition: opacity 0.2s ease;
	}

	.spinner-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--cz-color-bg-primary);
	}

	.placeholder {
		background: var(--cz-color-bg-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
	}
`;

/** Width a page reports before it is measured; larger natural widths are
 *  capped at it, so the viewer's pre-ready estimate never needs re-scaling. */
export const DEFAULT_NATURAL_WIDTH = 1240;

const A4_RATIO = 297 / 210;

interface Props {
	/** The page: a ready URL, or a renderer resolving one lazily. A renderer
	 *  is invoked the first time one of its instances mounts; the result is
	 *  memoized on the renderer itself. */
	page?: string | (() => Promise<string>);
	width?: number;
	/** Strip position, echoed in `page-ready` so the viewer maps a load's
	 *  ratio onto the right page. */
	index?: number;
}

/** A rendered page element inside the viewer's virtualized strip. */
export type CosmozDocumentViewerPageElement = HTMLElement & Props;

type Host = HTMLElement & Props;

interface RenderEntry {
	promise: Promise<string>;
	state: 'pending' | 'done' | 'error';
	value?: string;
}

/** Lazy-renderer results, memoized per renderer identity: a page element
 *  that re-mounts (page leaves the rendered window) reuses the result instead
 *  of re-invoking the renderer. Done results are readable synchronously, so a
 *  re-mounted instance boots straight to its image. */
const pageResults = new WeakMap<() => Promise<string>, RenderEntry>();

const bootFromCache = (input: string | (() => Promise<string>) | undefined) => {
	const entry =
		typeof input === 'function' ? pageResults.get(input) : undefined;
	return entry?.state === 'done' ? entry.value : undefined;
};

const CosmozDocumentViewerPage = (host: Host) => {
	const [naturalRatio, setNaturalRatio] = useState(0);
	const [loadedUrl, setLoadedUrl] = useState<string>();
	// Boot synchronously from a done memo: no placeholder frame for pages
	// that already rendered once.
	const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(() =>
		bootFromCache(host.page),
	);

	const width = host.width ?? 0;
	const displayHeight = naturalRatio ? naturalRatio * width : width * A4_RATIO;
	const input = host.page;
	const url = typeof input === 'string' ? input : resolvedUrl;
	const loaded = !!url && loadedUrl === url;

	useEffect(() => {
		if (typeof input !== 'function') return;
		let entry = pageResults.get(input);
		if (!entry) {
			entry = { promise: Promise.resolve(input()), state: 'pending' };
			pageResults.set(input, entry);
		}
		let live = true;
		entry.promise.then(
			(resolved) => {
				entry.state = 'done';
				entry.value = resolved;
				if (live) {
					setResolvedUrl(resolved);
				}
			},
			// Renderer errors keep the slot's placeholder.
			() => {
				entry!.state = 'error';
			},
		);
		return () => {
			live = false;
		};
	}, [input]);

	const onLoad = (e: Event) => {
		const img = e.target as HTMLImageElement;
		const nw = img.naturalWidth;
		if (nw === 0) return;
		const ratio = img.naturalHeight / nw;
		host.dispatchEvent(
			new CustomEvent('page-ready', {
				detail: {
					index: host.index,
					ratio,
					naturalWidth: Math.min(nw, DEFAULT_NATURAL_WIDTH),
				},
				bubbles: true,
				composed: true,
			}),
		);
		setNaturalRatio(ratio);
		setLoadedUrl(img.getAttribute('src') ?? undefined);
	};

	return html`
		<div
			class="page-container"
			style="width: ${width}px; height: ${displayHeight}px;"
		>
			${url
				? html`<img
							src="${url}"
							@load="${onLoad}"
							style="width: 100%; height: auto; opacity: ${loaded ? 1 : 0};"
						/>
						${!loaded
							? html`<div class="spinner-overlay">
									<cosmoz-spinner></cosmoz-spinner>
								</div>`
							: ''}`
				: html`<div class="placeholder" style="height: ${displayHeight}px;">
						<cosmoz-spinner></cosmoz-spinner>
					</div>`}
			<slot></slot>
		</div>
	`;
};

const cosmozDocumentViewerPage = component(CosmozDocumentViewerPage, {
	styleSheets: [styles],
});

customElements.define('cosmoz-document-viewer-page', cosmozDocumentViewerPage);

export { CosmozDocumentViewerPage, cosmozDocumentViewerPage };
export type { Props as PageProps };
