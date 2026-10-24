# cosmoz-document-viewer

Continuously scrolling, zoomable, multi-page document viewer.

Layout is bespoke and proportional rather than a generic virtualizer: all
pages share one width, page height is aspect-ratio × width, and positions
are prefix sums of the ratio array. Zooming is therefore exact and closed
form — the anchored restore is arithmetic, not measurement, and panning or
pinching stays stable at any scroll depth. The component owns rendering,
scroll anchoring and pan; zoom and the current page are owned by the
embedding view (the component announces its intent with events, the view
owns the state).

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

| Property      | Type                                           | Description                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages`       | `Array<string \| { render, ratio? }>`          | The document's pages: a ready image URL, or a lazy page `{ render: () => Promise<string>, ratio?: number }`. A `render` runs when its page first enters the viewport; the result is memoized on the object. When `ratio` is provided (PDF loaders can know it upfront), the layout is exact and stable from mount; otherwise the ratio is measured when the page loads. |
| `zoom`        | `number` (owned by the view)                   | Zoom factor owned by the view. Until the view sets it, pages display fitted to the container width; `@zoom-changed` announcements (Ctrl+wheel or `fit` follow) are applied back through this property. Zoom `1` = the page's natural raster width.                                                                                                                      |
| `zoomMode`    | `'fit' \| 'manual'`                            | How the zoom factor was chosen. `fit` width-follows the container: any container resize reports `@zoom-changed` with `reason: 'fit-follow'`.                                                                                                                                                                                                                            |
| `gestures`    | `boolean` (default `true`)                     | `false` suspends the strip's pan/pinch/tap gestures so annotation layers own the pointer; wheel and property zoom keep working.                                                                                                                                                                                                                                         |
| `currentPage` | `number` (read and write; announced on change) | The page at (or above) the viewport's vertical midpoint. Writing it jumps to that page.                                                                                                                                                                                                                                                                                 |
| `fitZoom`     | `number` (readonly)                            | The zoom factor that fits the container's width, capped at `1` — the unscaled fit never upscales past the rasters.                                                                                                                                                                                                                                                      |
| `pageCount`   | `number` (readonly)                            | The rendered document's page count.                                                                                                                                                                                                                                                                                                                                     |
| `ready`       | `boolean` (readonly)                           | `true` once the first page has loaded and laid out.                                                                                                                                                                                                                                                                                                                     |

### Events

| Event                  | `detail.value`                       | Description                                                                                                                                          |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zoom-changed`         | `number`, `detail.reason`            | Cancelable intent announcement: Ctrl+wheel (`reason: 'wheel'`), two-finger pinch release (`reason: 'pinch'`) or fit follow (`reason: 'fit-follow'`). |
| `fit-zoom-changed`     | `number`, `detail.path: 'fitZoom'`   | The fit zoom changed (`useProperty` announcement; cancelable — `lift()` it or ignore).                                                               |
| `page-count-changed`   | `number`, `detail.path: 'pageCount'` | The page count changed (new document).                                                                                                               |
| `current-page-changed` | `number`                             | The current page changed while scrolling.                                                                                                            |
| `page-ready`           | `{ index, ratio, naturalWidth }`     | (bubbled from a page) A page image finished loading and reported its aspect ratio; also sets the viewer's `ready` once the first page lays out.      |

### Per-page overlays

Each page has a named slot for layering content on it. Slot content sits
inside a **size container** (`container-type: inline-size`): position layers
in percent of the page and size them in `cqi` units (1% of the page's
rendered width) and they scale along with zooming and container resizing.

```html
<cosmoz-document-viewer .pages="${pages}">
	<!-- annotation layer: unit-space rect, scales with the page -->
	<span
		slot="page-0-overlay"
		style="left: 10%; top: 12%; width: 40%; height: 6%; background: yellow"
	></span>
</cosmoz-document-viewer>
```

Element methods pair with overlays:

| Method                                                  | Description                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pageAtPoint(x, y): PagePoint \| null`                  | Inverse locator: a client point (viewport coords) → the page index plus the point in unit space. Annotation layers use it to convert pointer events into page-anchored shapes. |
| `jumpToRegion(page, rect: {x, y, width, height}): void` | Centers a unit-space region's center at the viewport's center at the current zoom; regions at the document's edges clamp (no overscroll).                                      |

### Theming

Consumes design tokens (`--cz-color-*` from `@neovici/cosmoz-tokens`) and
exposes per-page image styling hooks:

- `--cosmoz-document-viewer-page-filter` (CSS filter on page images, default `none`)
- `--cosmoz-document-viewer-page-blend-mode` (default `multiply`)

## Zoom steps

Zoom follows the multiplicative model shared by the wheel and the controls:
`zoom * 0.8` (out) / `zoom * 1.25` (in), rounded to the nearest 5% —
`roundToStep`, `ZOOM_IN_STEP`, `ZOOM_OUT_STEP` are exported for consuming
views.

## Upstream

The strip layout is bespoke (prefix-summed proportional page positions with a
virtual window) and has no runtime dependency on `@lit-labs/virtualizer`.
Generalizations of pieces explored here are being upstreamed to
[lit/lit](https://github.com/lit/lit/pulls) (#5414, #5416, #5417); the component
already follows the same behaviors and does not need patches when a consumer
uses a released virtualizer.

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
