import { describe, expect, it } from 'vitest';
import { formatGreeting } from '../src/utils';

describe('formatGreeting', () => {
	it('returns formatted greeting with both arguments', () => {
		expect(formatGreeting('Hello', 'World')).toBe('Hello, World!');
	});

	it('returns only name when greeting is empty', () => {
		expect(formatGreeting('', 'World')).toBe('World');
	});

	it('returns only greeting when name is empty', () => {
		expect(formatGreeting('Hello', '')).toBe('Hello');
	});

	it('returns empty string when both are empty', () => {
		expect(formatGreeting('', '')).toBe('');
	});
});
