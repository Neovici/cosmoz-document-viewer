/**
 * PDF page rendering for stories: pages rasterize to JPEG data URLs through
 * pdf.js on demand, feeding the viewer's lazy page renderer extension point.
 * First page renders eagerly, the rest lazily when the virtualizer needs
 * them (mirrors cosmoz-image-viewer's pdf-loader pattern).
 */
import * as pdfjs from 'pdfjs-dist';
// eslint-disable-next-line import/default
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

// Render target: the viewer caps reported natural widths at this, so
// rasterizing at ~1240px keeps the pre-ready estimate honest.
const TARGET_WIDTH = 1240;

const pageThunksCache = new Map<string, Promise<(() => Promise<string>)[]>>();

export const loadPdfPageThunks = (
	url: string,
): Promise<(() => Promise<string>)[]> => {
	// pdf.js fetches the bytes from its worker thread, where relative
	// URLs resolve against the worker's own location — resolve against
	// the document's base so stories work in dev, tests and static deploys.
	const absoluteUrl = new URL(url, document.baseURI).href;
	let thunks = pageThunksCache.get(absoluteUrl);
	if (thunks) return thunks;

	thunks = (async () => {
		// Range requests make pdf.js fetch the document twice; for a
		// small demo document a single full fetch is cheaper.
		const doc = await pdfjs.getDocument(absoluteUrl, {
			disableRange: true,
			disableAutoFetch: true,
		}).promise;
		const numPages = doc.numPages;

		const renderPage = async (pageIndex: number): Promise<string> => {
			const page = await doc.getPage(pageIndex + 1);
			const base = page.getViewport({ scale: 1 });
			const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });
			const canvas = document.createElement('canvas');
			canvas.width = Math.floor(viewport.width);
			canvas.height = Math.floor(viewport.height);
			const context = canvas.getContext('2d');
			await page.render({ canvasContext: context, viewport }).promise;
			return canvas.toDataURL('image/jpeg', 0.85);
		};

		const firstUrl = await renderPage(0);
		const thunks: (() => Promise<string>)[] = [];
		for (let i = 0; i < numPages; i++) {
			thunks.push(
				i === 0 ? () => Promise.resolve(firstUrl) : () => renderPage(i),
			);
		}
		return thunks;
	})();
	pageThunksCache.set(url, thunks);
	return thunks;
};
