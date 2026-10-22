# cosmoz-component

Template for creating Neovici public web components using pionjs and lit-html.

## Installation

```bash
npm install
```

## Available Scripts

- `npm run lint` - Run ESLint and TypeScript type checking
- `npm run build` - Build TypeScript to dist/
- `npm run test` - Run all tests (unit + storybook)
- `npm run test:unit` - Run unit tests only (fast, jsdom)
- `npm run test:storybook` - Run storybook interaction tests only (browser)
- `npm run test:watch` - Run tests in watch mode
- `npm run storybook:start` - Start Storybook development server
- `npm run storybook:build` - Build static Storybook

## Usage

Import the component:

```javascript
import '@neovici/cosmoz-component';
```

Use in HTML:

```html
<cosmoz-component greeting="Hi"></cosmoz-component>
```

## Development

1. Clone the repository
2. Run `npm install`
3. Start development with `npm run storybook:start`
4. Make changes and verify with tests

## Testing

This template uses Vitest with two test projects:

### Unit Tests (`test:unit`)

Fast tests that run in jsdom. Use for testing:

- Utility functions
- Pure logic
- Data transformations

**Note**: Unit tests cannot import Pion/Lit components or use `renderHook` from `@neovici/testing` due to ESM resolution issues in jsdom. For testing hooks and components, use Storybook interaction tests instead.

```typescript
// test/example.test.ts
import { describe, expect, it } from 'vitest';
import { myFunction } from '../src/utils';

describe('myFunction', () => {
	it('does something', () => {
		expect(myFunction()).toBe(expected);
	});
});
```

### Storybook Tests (`test:storybook`)

Browser-based tests using Playwright. Use for testing:

- Component rendering
- User interactions
- Visual behavior

Tests are written as `play` functions in story files.

### Important: Imports in Story Files

**Never import from `'vitest'` in story files:**

```typescript
import { expect } from 'vitest'; // Crashes deployed Storybook
```

**Use `'storybook/test'` instead:**

```typescript
import { expect } from 'storybook/test'; // Works everywhere
```

Vitest's `expect` requires an active test context and crashes when stories run in the deployed Storybook UI.

## Publishing

This package uses Changesets for automated versioning and publishing. Add a changeset with `npm run changeset`, then open a release PR to publish.
