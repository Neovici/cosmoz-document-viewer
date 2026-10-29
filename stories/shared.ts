import { html, type TemplateResult } from '@pionjs/pion';
import '../src/index';
import { loadPdfPages } from './pdf';

export const PDF_URL = 'assets/alices-adventures-in-wonderland.pdf';

// Shared, memoized: one document fetch + worker session for all stories.
export const pdfPages = await loadPdfPages(PDF_URL);

/** Plain deadline-poll. Storybook's waitFor has surprising semantics
 *  (callback throws fail fast; timeouts resolve undefined). */
export const until = async (
	cond: () => boolean,
	timeout = 25_000,
	label = '',
) => {
	const deadline = Date.now() + timeout;
	while (!cond()) {
		if (Date.now() > deadline) {
			throw new Error(`condition not met within ${timeout}ms ${label}`);
		}
		await new Promise((r) => setTimeout(r, 100));
	}
};

export const getViewer = (canvasElement: Element) =>
	canvasElement?.querySelector('cosmoz-document-viewer') as
		| (HTMLElement & { ready: boolean; currentPage: number })
		| null;
export const getFirstPage = (viewer: Element) =>
	viewer.shadowRoot?.querySelector('cosmoz-document-viewer-page');

/** The default canvas gives the story no height; clamp one usable story row. */
export const canvasDecorator = (story: () => TemplateResult) =>
	html`<div style="height: clamp(420px, 85dvh, 800px); width: 100%">
		${story()}
	</div>`;
