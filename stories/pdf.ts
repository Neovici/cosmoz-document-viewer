/**
 * Lazily renders the stories' PDF pages to JPEG data URLs through pdf.js.
 * Every page's aspect ratio is read upfront (pdf.js knows it before any
 * rasterization), so the viewer's strip layout is exact and stable from
 * mount; only page rasters resolve as the viewer's window reaches them.
 */
import * as pdfjs from 'pdfjs-dist';
// eslint-disable-next-line import/default
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import type { LazyPage } from '../src/cosmoz-document-viewer';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

// Render target: the viewer caps reported natural widths at this, so
// rasterizing at ~1240px keeps the pre-ready estimate honest.
const TARGET_WIDTH = 1240;

const pagesCache = new Map<string, Promise<LazyPage[]>>();

export const loadPdfPages = (url: string): Promise<LazyPage[]> => {
	// pdf.js fetches the bytes from its worker thread, where relative
	// URLs resolve against the worker's own location — resolve against
	// the document's base so stories work in dev, tests and static deploys.
	const absoluteUrl = new URL(url, document.baseURI).href;
	let pages = pagesCache.get(absoluteUrl);
	if (pages) {
		return pages;
	}

	pages = (async () => {
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

		const ratios = await Promise.all(
			Array.from({ length: numPages }, async (_, i) => {
				const base = (await doc.getPage(i + 1)).getViewport({ scale: 1 });
				return base.height / base.width;
			}),
		);

		const firstUrl = await renderPage(0);
		return Array.from({ length: numPages }, (_, i) => ({
			render: () => (i === 0 ? Promise.resolve(firstUrl) : renderPage(i)),
			ratio: ratios[i],
		}));
	})();
	pagesCache.set(url, pages);
	return pages;
};
