import { within as withinShadow } from 'shadow-dom-testing-library';

export default {
	parameters: {
		docs: {
			source: {
				excludeDecorators: true,
				type: 'code',
				transform: (source) => {
					const match = source.match(/html`([\s\S]*?)`/u);
					return match?.[1]?.trim() ?? source;
				},
			},
		},
	},
	decorators: [
		(story, context) => {
			document.documentElement.style.colorScheme =
				context.globals?.theme === 'dark' ? 'dark' : 'light';
			return story();
		},
	],
	globalTypes: {
		theme: {
			name: 'Theme',
			description: 'Global theme for components',
			defaultValue: 'light',
			toolbar: {
				icon: 'circlehollow',
				items: [
					{ value: 'light', icon: 'sun', title: 'Light' },
					{ value: 'dark', icon: 'moon', title: 'Dark' },
				],
				dynamicTitle: true,
			},
		},
	},
	// Augment the canvas with shadow-dom-testing-library queries
	beforeEach({ canvasElement, canvas }) {
		Object.assign(canvas, { ...withinShadow(canvasElement) });
	},
};
