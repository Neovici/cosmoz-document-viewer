const TARGET_WIDTH = 1240;
const pagesCache = new Map();
export const loadPdfPages = (url) => {
    // pdf.js fetches the bytes on its worker thread, where relative URLs
    // resolve against the worker's own location — resolve against the
    // document's base so it works from dev, tests and static deploys.
    const absoluteUrl = new URL(url, document.baseURI).href;
    let pages = pagesCache.get(absoluteUrl);
    if (pages) {
        return pages;
    }
    pages = (async () => {
        const pdfjs = await import('pdfjs-dist');
        // Range requests make pdf.js fetch the document twice; for a
        // small- to mid-size document a single full fetch is cheaper.
        const doc = await pdfjs.getDocument({
            url: absoluteUrl,
            disableRange: true,
            disableAutoFetch: true,
        }).promise;
        const numPages = doc.numPages;
        const renderPage = async (pageIndex) => {
            const page = await doc.getPage(pageIndex + 1);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('Could not create a 2d canvas context');
            }
            await page.render({ canvasContext: context, viewport }).promise;
            // The browser encodes on its own threads via toBlob and calls back
            // on a task — toDataURL does the encode synchronously here, inside
            // pdf.js's rAF continuation, and drops frames per page.
            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => blob
                    ? resolve(URL.createObjectURL(blob))
                    : reject(new Error('JPEG encode failed')), 'image/jpeg', 0.85);
            });
        };
        const ratios = await Promise.all(Array.from({ length: numPages }, async (_, i) => {
            const base = (await doc.getPage(i + 1)).getViewport({ scale: 1 });
            return base.height / base.width;
        }));
        const firstUrl = await renderPage(0);
        return Array.from({ length: numPages }, (_, i) => ({
            render: () => (i === 0 ? Promise.resolve(firstUrl) : renderPage(i)),
            ratio: ratios[i],
        }));
    })();
    // The cache key must match the get() key, or every caller refetches.
    pagesCache.set(absoluteUrl, pages);
    return pages;
};
