import { describe, expect, it } from 'vitest';
import { roundToStep, ZOOM_IN_STEP, ZOOM_OUT_STEP } from '../src/zoom-model';

describe('zoom model', () => {
	it('rounds to the nearest 5% step', () => {
		expect(roundToStep(1.02)).toBe(1);
		expect(roundToStep(1.04)).toBe(1.05);
		expect(roundToStep(1.13)).toBe(1.15);
		expect(roundToStep(0.97)).toBe(0.95);
	});

	it('applies multiplicative zoom steps', () => {
		expect(roundToStep(1 * ZOOM_IN_STEP)).toBe(1.25);
		expect(roundToStep(1 * ZOOM_OUT_STEP)).toBe(0.8);
		expect(roundToStep(2 * ZOOM_IN_STEP)).toBe(2.5);
	});
});
