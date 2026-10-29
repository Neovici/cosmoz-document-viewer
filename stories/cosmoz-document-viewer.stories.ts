import { html } from '@pionjs/pion';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';
import './demo';
import {
	canvasDecorator,
	getFirstPage,
	getViewer,
	PDF_URL,
	pdfPages,
	until,
} from './shared';

const getDemoEl = (canvasElement: Element) =>
	canvasElement?.querySelector('cosmoz-document-viewer-demo');
const getDemoViewer = (canvasElement: Element) =>
	getDemoEl(canvasElement)?.shadowRoot?.querySelector('cosmoz-document-viewer');

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
	decorators: [canvasDecorator],
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
