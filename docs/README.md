# cosmoz-document-viewer

Continuously scrolling, zoomable, multi-page document viewer, built on
[`@lit-labs/virtualizer`](https://github.com/lit/lit/tree/main/packages/labs/virtualizer).

Pages render as a vertical strip (laid out by the virtualizer's `flow`
layout). The component owns rendering, scroll anchoring and pan; zoom and
the current page are owned by the embedding view (the component announces
its intent with events, the view owns the state).

## Usage

**The component is the viewer only — it has no chrome.** You get the
virtualized, zoomable page strip and its events; toolbars, zoom controls and
page readouts are application chrome, built by the embedding view from the
component's exported zoom model (`roundToStep`, `ZOOM_IN_STEP`,
`ZOOM_OUT_STEP`) and event contract. The package's Storybook includes such a
demo shell.

```js
import '@neovici/cosmoz-document-viewer';
```

```html
<cosmoz-document-viewer
	.pages="${pages}"
	.zoom="${zoom}"
	.zoomMode="${zoomMode}"
	@zoom-changed="${onZoom}"
	@current-page-changed="${onCurrentPage}"
>
	<!-- Per-page overlay slots for layering content on a page, e.g.
	     <span slot="page-0-overlay">…</span> -->
</cosmoz-document-viewer>
```

### Properties

| Property      | Type                                           | Description                                                                                                                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages`       | `Array<string \| (() => Promise<string>)>`     | The document's pages: ready image URLs or lazy renderers that resolve to one (e.g. PDF pages rasterized on demand). A renderer runs when its page first enters the viewport (the virtualizer's window plus overscan); the result is memoized on the renderer, so remounts reuse it. Pages appear as they render. |
| `zoom`        | `number` (owned by the view)                   | Zoom factor owned by the view. Until the view sets it, pages display fitted to the container width; `@zoom-changed` announcements (Ctrl+wheel or `fit` follow) are applied back through this property. Zoom `1` = the page's natural raster width.                                                               |
| `zoomMode`    | `'fit' \| 'manual'`                            | How the zoom factor was chosen. `fit` width-follows the container: any container resize reports `@zoom-changed` with `reason: 'fit-follow'`.                                                                                                                                                                     |
| `currentPage` | `number` (read and write; announced on change) | The page at (or above) the viewport's vertical midpoint. Writing it jumps to that page.                                                                                                                                                                                                                          |
| `ready`       | `boolean` (readonly)                           | `true` once the first page has loaded and laid out.                                                                                                                                                                                                                                                              |

### Events

| Event                  | `detail.value`            | Description                                                                                   |
| ---------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `zoom-changed`         | `number`, `detail.reason` | Cancelable intent from Ctrl+wheel (`reason: 'wheel'`) or fit follow (`reason: 'fit-follow'`). |
| `fit-zoom-changed`     | `number`                  | The zoom factor that would fit the container's width.                                         |
| `current-page-changed` | `number`                  | The current page changed while scrolling.                                                     |
| `pages-changed`        | `number`                  | The page count changed (readout "N of M" support).                                            |
| `page-ready`           | `{ naturalWidth }`        | (bubbled from a page) A page image finished loading.                                          |

### Per-page overlays

Each page has a named slot for layering content on it:

```html
<cosmoz-document-viewer .pages="${pages}">
	<span slot="page-0-overlay">stamped text</span>
</cosmoz-document-viewer>
```

### Page overlays

Each page's overlay slot content is layered inside a **size container**
(`container-type: inline-size`): size overlay content in `cqi` units (1% of
the page's rendered width) and it scales along with zooming and container
resizing.

### Theming

Consumes design tokens (`--cz-color-*` from `@neovici/cosmaz-tokens`) and
exposes per-page image styling hooks:

- `--cosmoz-document-viewer-page-filter` (CSS filter on page images, default `none`)
- `--cosmoz-document-viewer-page-blend-mode` (default `multiply`)

## Zoom steps

Zoom follows the multiplicative model shared by the wheel and the controls:
`zoom * 0.8` (out) / `zoom * 1.25` (in), rounded to the nearest 5% —
`roundToStep`, `ZOOM_IN_STEP`, `ZOOM_OUT_STEP` are exported for consuming
views.

## Virtualizer patch

Until lit/lit#5414, #5416 and #5417 are released, this repository carries
`patches/@lit-labs+virtualizer+2.1.1.patch` (applied by `patch-package` on
`npm install`) to enable:

- `flow({ estimatedItemHeight })` — a correct initial page height estimate
- `invalidateAndRemeasure()` — cache invalidation + re-measure on container resize
- `data-min-width` host override — zoomed pages wider than the viewport force
  a real horizontal scrollbar

Consuming applications that need the full zoom/resize behavior should carry
the same patch until the upstream release lands; otherwise the viewer still
works, with reflow behavior only driven by the ResizeObserver.

## Available Scripts

- `npm run lint` - Run ESLint and TypeScript type checking
- `npm run build` - Build TypeScript to dist/
- `npm run test` - Run all tests (unit + storybook)
- `npm run test:unit` - Run unit tests only (fast, jsdom)
- `npm run test:storybook` - Run storybook interaction tests only (browser)
- `npm run test:watch` - Run tests in watch mode
- `npm run storybook:start` - Start Storybook development server
- `npm run storybook:build` - Build static Storybook

## Acknowledgements

The continuous scrolling viewer is based on the document viewer in
Neovici's cosmoz-frontend.
