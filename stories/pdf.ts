/**
 * Demo wiring: pdf.js's worker here rides vite's ?worker import; the
 * loader it feeds ships from the package (src/pdf-pages.ts).
 */
import * as pdfjs from 'pdfjs-dist';
// eslint-disable-next-line import/default
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

export { loadPdfPages } from '../src/pdf-pages';
