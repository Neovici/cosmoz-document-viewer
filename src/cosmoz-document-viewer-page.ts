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
}

/** A rendered page element inside the viewer's virtualized strip. */
export type CosmozDocumentViewerPageElement = HTMLElement & Props;

type Host = HTMLElement & Props;

/** Lazy-renderer results, memoized per renderer identity: a page element
 *  that re-mounts (virtualizer window changes) reuses the result instead of
 *  re-invoking the renderer. */
const pageResults = new WeakMap<() => Promise<string>, Promise<string>>();

const CosmozDocumentViewerPage = (host: Host) => {
	const [naturalRatio, setNaturalRatio] = useState(0);
	const [loadedUrl, setLoadedUrl] = useState<string>();
	const [resolvedUrl, setResolvedUrl] = useState<string>();

	const width = host.width ?? 0;
	const displayHeight = naturalRatio ? naturalRatio * width : width * A4_RATIO;
	const input = host.page;
	const url = typeof input === 'string' ? input : resolvedUrl;
	const loaded = !!url && loadedUrl === url;

	useEffect(() => {
		if (typeof input !== 'function') return;
		let live = true;
		const pending = pageResults.get(input) ?? Promise.resolve(input());
		pageResults.set(input, pending);
		pending.then(
			(resolved) => live && setResolvedUrl(resolved),
			// Renderer errors keep the slot's placeholder.
			() => {
				/* placeholder stays */
			},
		);
		return () => {
			live = false;
		};
	}, [input]);

	const onLoad = (e: Event) => {
		const img = e.target as HTMLImageElement;
		const nw = img.naturalWidth;
		if (nw > 0) {
			host.dispatchEvent(
				new CustomEvent('page-ready', {
					detail: { naturalWidth: Math.min(nw, DEFAULT_NATURAL_WIDTH) },
					bubbles: true,
					composed: true,
				}),
			);
		}
		setNaturalRatio(img.naturalHeight / nw);
		setLoadedUrl(img.getAttribute('src') ?? undefined);
	};

	return html`
		<style>
			${styles}
		</style>
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
