export default {
	stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	staticDirs: [{ from: '../stories/assets', to: '/assets' }],
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-vitest',
		'@neovici/cfg/storybook/preset.mjs',
	],
	framework: {
		name: '@storybook/web-components-vite',
		options: {},
	},
	docs: {
		// No autodocs page: each docs page would inline-render every story's
		// live canvas (virtualizer + pdf.js) and lags hard. The README and
		// the stories' own descriptions carry the documentation; the
		// Showcase story is the interactive landing.
		autodocs: false,
	},
};
