---
'@neovici/cosmoz-document-viewer': minor
---

Ship the demo's lazy pdf page loader as `loadPdfPages` from the new `@neovici/cosmoz-document-viewer/pdf-pages` export: lazy per-page rasters (toBlob object-URLs), upfront page ratios for an exact strip layout, memoized per url. pdfjs-dist is a peer dependency; the consumer configures its worker. The dead `./cosmoz-component` export (the file was replaced by the viewer) is dropped.
