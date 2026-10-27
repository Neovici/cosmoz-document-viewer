import { html } from '@pionjs/pion';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';
import '../src/index';
import './demo';
import { loadPdfPages } from './pdf';

const PDF_URL = 'assets/alices-adventures-in-wonderland.pdf';

// Shared, memoized: one document fetch + worker session for all stories.
const pdfPages = await loadPdfPages(PDF_URL);

/** Plain deadline-poll. Storybook's waitFor has surprising semantics
 *  (callback throws fail fast; timeouts resolve undefined). */
const until = async (cond: () => boolean, timeout = 25_000, label = '') => {
	const deadline = Date.now() + timeout;
	while (!cond()) {
		if (Date.now() > deadline) {
			throw new Error(`condition not met within ${timeout}ms ${label}`);
		}
		await new Promise((r) => setTimeout(r, 100));
	}
};

const getDemoEl = (canvasElement: Element) =>
	canvasElement?.querySelector('cosmoz-document-viewer-demo');
const getDemoViewer = (canvasElement: Element) =>
	getDemoEl(canvasElement)?.shadowRoot?.querySelector('cosmoz-document-viewer');
const getViewer = (canvasElement: Element) =>
	canvasElement?.querySelector('cosmoz-document-viewer') as
		| (HTMLElement & { ready: boolean; currentPage: number })
		| null;
const getFirstPage = (viewer: Element) =>
	viewer.shadowRoot?.querySelector('cosmoz-document-viewer-page');

const meta: Meta = {
	title: 'CosmozDocumentViewer',
	component: 'cosmoz-document-viewer',
	parameters: {
		docs: {
			description: {
				component:
					'Continuously scrolling, zoomable multi-page document viewer with a bespoke proportional strip layout. **The component is the viewer only — no chrome:** you get the virtualized zoomable page strip, the zoom/current-page event contract and per-page overlay slots; toolbars, zoom controls and page readouts are application chrome (the *Showcase* story is a demo shell built on the public API).',
			},
		},
	},
	decorators: [
		(story) => html`
			<div style="height: clamp(420px, 85dvh, 800px); width: 100%">
				${story()}
			</div>
		`,
	],
};

export default meta;

type Story = StoryObj;

export const Showcase: Story = {
	name: '01 - Showcase (highlights, zoom, resize)',
	parameters: {
		docs: {
			description: {
				story:
					'What surrounds the viewer is **not the component**: toolbar (marker mode, highlight next/prev, zoom controls, fit, page readout) and the resizable viewport are a demo shell built on the public API — the component itself is the bare viewer strip with no chrome.',
			},
		},
	},
	render: () =>
		html`<cosmoz-document-viewer-demo
			.annotate=${true}
			.heading=${'Alice\u2019s Adventures in Wonderland'}
			.url=${PDF_URL}
		></cosmoz-document-viewer-demo>`,
	play: async ({ canvasElement, step }) => {
		await until(() => getDemoViewer(canvasElement)?.ready === true);
		const viewer = getDemoViewer(canvasElement);
		const pageEl = getFirstPage(viewer);
		const namedSlot = pageEl?.querySelector(
			'slot[name="page-0-overlay"]',
		) as HTMLSlotElement;
		expect(namedSlot.assignedElements().length).toBe(0);

		await step('Marker button arms highlight draw mode', async () => {
			const marker = getDemoEl(canvasElement)?.shadowRoot?.querySelector(
				'cosmoz-button[label="Toggle highlight mode"]',
			);
			marker?.dispatchEvent(
				new MouseEvent('click', { bubbles: true, composed: true }),
			);
			// Armed = the scroller hands the pointer over (the draw layer owns
			// touch-action through the part, since it's decided at gesture start).
			await until(
				() => {
					const sc =
						getDemoViewer(canvasElement)?.shadowRoot?.querySelector(
							'.scroll-container',
						);
					return (
						marker?.getAttribute('aria-pressed') === 'true' &&
						sc != null &&
						getComputedStyle(sc).touchAction === 'none'
					);
				},
				5_000,
				'(armed: scroller hands the pointer over)',
			);
		});

		await step('Marquee in highlight mode adds an overlay rect', async () => {
			const container = pageEl?.shadowRoot?.querySelector('.page-container');
			const rect = container!.getBoundingClientRect();
			const shell =
				getDemoEl(canvasElement)?.shadowRoot?.querySelector('.shell');
			// Mode first (the marker toggle), then a drag = a rectangle.
			shell?.dispatchEvent(
				new PointerEvent('pointerdown', {
					bubbles: true,
					composed: true,
					clientX: rect.left + rect.width * 0.4,
					clientY: rect.top + rect.height * 0.2,
				}),
			);
			shell?.dispatchEvent(
				new PointerEvent('pointermove', {
					bubbles: true,
					composed: true,
					clientX: rect.left + rect.width * 0.6,
					clientY: rect.top + rect.height * 0.35,
				}),
			);
			shell?.dispatchEvent(
				new PointerEvent('pointerup', {
					bubbles: true,
					composed: true,
				}),
			);
			await until(
				() => namedSlot.assignedElements().length > 0,
				5_000,
				'(overlay rect committed)',
			);
			const [rect2] = namedSlot.assignedElements();
			expect(rect2.getBoundingClientRect().height).toBeGreaterThan(0);

			// The preview runs play() on load: leave the demo in a neutral,
			// touchable state — disarm the draw mode (keep the highlight; the
			// bar still shows it). An armed crosshair on a fresh visit reads
			// as a broken viewer.
			getDemoEl(canvasElement)
				?.shadowRoot?.querySelector(
					'cosmoz-button[label="Toggle highlight mode"]',
				)
				?.dispatchEvent(
					new MouseEvent('click', { bubbles: true, composed: true }),
				);
			await until(
				() =>
					getDemoEl(canvasElement)
						?.shadowRoot?.querySelector(
							'cosmoz-button[label="Toggle highlight mode"]',
						)
						?.getAttribute('aria-pressed') === 'false',
				5_000,
				'(play leaves draw disarmed)',
			);
		});
	},
};

export const Default: Story = {
	render: () =>
		html`<cosmoz-document-viewer .pages=${pdfPages}></cosmoz-document-viewer>`,
	play: async ({ canvasElement }) => {
		await until(() => getViewer(canvasElement)?.ready === true);
		await until(
			() =>
				// Rasters are object-URLs since toBlob (data: URLs long-tasked rAF).
				getFirstPage(getViewer(canvasElement))
					?.shadowRoot?.querySelector('img')
					?.src?.startsWith('blob:') === true,
		);
	},
};

export const CurrentPageTracking: Story = {
	name: 'Page jump + tracking',
	render: () =>
		html`<cosmoz-document-viewer .pages=${pdfPages}></cosmoz-document-viewer>`,
	play: async ({ canvasElement, step }) => {
		await until(() => getViewer(canvasElement)?.ready === true);
		const viewer = getViewer(canvasElement);
		await step('Writing currentPage jumps and reports back', async () => {
			viewer.currentPage = 12;
			// The jump settles the strip; scroll tracking publishes the page
			// at the viewport midpoint.
			await until(() => viewer.currentPage === 12, 10_000);
		});
	},
};

export const Zoom: Story = {
	render: () =>
		html`<cosmoz-document-viewer .pages=${pdfPages}></cosmoz-document-viewer>`,
	play: async ({ canvasElement, step }) => {
		await until(() => getViewer(canvasElement)?.ready === true);
		const viewer = getViewer(canvasElement);
		await step('Setting zoom widens pages past the viewport', async () => {
			viewer.zoom = 1.5;
			await until(() => {
				const sc = viewer.shadowRoot.querySelector('.scroll-container');
				return sc.scrollWidth > sc.clientWidth;
			}, 10_000);
		});
	},
};

// Lazy-resolution spy: 60 pages, each a cheap SVG that records its call.
const rasterCalls: number[] = [];
const svgPage = (i: number) =>
	`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1753"><text x="440" y="920" font-size="120">${i}</text></svg>`,
	)}`;
const spyPages = Array.from({ length: 60 }, (_, i) => () => {
	rasterCalls.push(i);
	return Promise.resolve(svgPage(i));
});

export const LazyRenders: Story = {
	name: 'Lazy rendering (spy)',
	parameters: { excludeFromSidebar: true },
	render: () =>
		html`<cosmoz-document-viewer .pages=${spyPages}></cosmoz-document-viewer>`,
	play: async ({ canvasElement, step }) => {
		await until(() => getViewer(canvasElement)?.ready === true);
		await step('Only the mounted window resolves initially', () => {
			expect(rasterCalls.length).toBeGreaterThan(0);
			expect(rasterCalls.length).toBeLessThan(12); // out of 60
		});
		await step('Scrolling resolves pages on demand', async () => {
			getViewer(canvasElement).shadowRoot.querySelector(
				'.scroll-container',
			).scrollTop = 999_999;
			await until(() => Math.max(...rasterCalls) > 55, 10_000);
			// Still bounded — the strip resolves per range, never the document.
			expect(rasterCalls.length).toBeLessThan(35);
		});
	},
};
