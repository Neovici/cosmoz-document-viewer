import { html } from '@pionjs/pion';
import type { Meta, StoryObj } from '@storybook/web-components';
import { waitFor } from 'storybook/test';
import '../src/component';

interface StoryArgs {
	greeting: string;
}

const meta: Meta<StoryArgs> = {
	title: 'CosmozComponent',
	component: 'cosmoz-component',
	tags: ['autodocs'],
	argTypes: {
		greeting: { control: 'text', description: 'Greeting text' },
	},
	args: {
		greeting: 'Hello',
	},
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {
	render: (args) =>
		html`<cosmoz-component greeting=${args.greeting}></cosmoz-component>`,
	play: async ({ canvas, step, userEvent }) => {
		await step('Renders with default greeting', async () => {
			await canvas.findByShadowText(/Hello, World!/u);
		});

		await step('Clicking increment updates counter', async () => {
			const button = canvas.getByShadowRole('button', {
				name: /Increment/u,
			});
			await userEvent.click(button);
			await waitFor(() => {
				canvas.getByShadowText(/Count: 1/u);
			});
		});

		await step('Clicking increment again updates counter', async () => {
			const button = canvas.getByShadowRole('button', {
				name: /Increment/u,
			});
			await userEvent.click(button);
			await waitFor(() => {
				canvas.getByShadowText(/Count: 2/u);
			});
		});
	},
};

export const CustomGreeting: Story = {
	args: { greeting: 'Hi there' },
	play: async ({ canvas, step }) => {
		await step('Renders with custom greeting', async () => {
			await canvas.findByShadowText(/Hi there, World!/u);
		});
	},
};

export const NoGreeting: Story = {
	args: { greeting: '' },
	play: async ({ canvas, step }) => {
		await step('Renders with empty greeting', async () => {
			await canvas.findByShadowText(/, World!/u);
		});
	},
};
