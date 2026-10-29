import { html } from '@pionjs/pion';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';
import { canvasDecorator, getViewer, pdfPages, until } from './shared';

/**
 * Behavior stories: vitest fixtures, not documentation. Each story's
 * play() IS the test, run against the bare component; excluded from the
 * docs sidebar. Reader-facing stories: cosmoz-document-viewer.stories.ts.
 */
const meta: Meta = {
	title: 'CosmozDocumentViewer/Behavior',
	component: 'cosmoz-document-viewer',
	decorators: [canvasDecorator],
};

export default meta;

type Story = StoryObj;

export const CurrentPageTracking: Story = {
	name: 'Page jump + tracking',
	parameters: { excludeFromSidebar: true },
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
	parameters: { excludeFromSidebar: true },
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
