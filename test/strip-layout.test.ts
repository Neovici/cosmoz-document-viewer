import { describe, expect, it } from 'vitest';
import { stripLayout } from '../src/strip-layout';

describe('strip layout', () => {
	it('computes proportional prefix positions', () => {
		const layout = stripLayout([1, 2, 1], 100);
		expect(layout.positions).toEqual([0, 100, 300]);
		expect(layout.totalHeight).toBe(400);
	});

	it('defaults unknown ratios to A4', () => {
		const layout = stripLayout([NaN, -1, 1.5], 100);
		const a4 = (297 / 210) * 100;
		expect(layout.positions).toEqual([0, a4, a4 * 2]);
	});

	it('locates pages and ranges within bounds', () => {
		const layout = stripLayout([1, 2, 1.5, 1], 100);
		expect(layout.pageAt(0)).toBe(0);
		expect(layout.pageAt(99)).toBe(0);
		expect(layout.pageAt(100)).toBe(1);
		expect(layout.pageAt(299)).toBe(1);
		expect(layout.pageAt(350)).toBe(2);
		expect(layout.pageAt(999999)).toBe(3);
		expect(layout.range(-50, 150)).toEqual({ from: 0, lastInclusive: 1 });
		expect(layout.range(120, 130)).toEqual({ from: 1, lastInclusive: 1 });
	});
});
