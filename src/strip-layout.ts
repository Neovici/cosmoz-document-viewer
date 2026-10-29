/** Strip layout: positions and extent derived purely from per-page aspect
 *  ratios and the page width. No DOM measurement — zoom recomputes exactly
 *  (every position scales by width-new / width-old), which is what makes
 *  anchored zoom restore closed-form. */

const A4_RATIO = 297 / 210;

/** Default per-page ratio before a page reports its own. */
export const DEFAULT_RATIO = A4_RATIO;

/**
 * @param ratios aspect ratio (height/width) per page; entries default to A4.
 * @param pageWidth rendered page width in css px (all pages share it).
 * @returns prefix positions per page, the strip's total height, and a
 *   range resolver for virtualized windows. Positions grow monotonically;
 *   page i occupies [positions[i], positions[i] + height(i)).
 */
export const stripLayout = (ratios: number[], pageWidth: number) => {
	const positions = new Array<number>(ratios.length);
	let total = 0;
	for (let i = 0; i < ratios.length; i++) {
		positions[i] = total;
		total +=
			(Number.isFinite(ratios[i]) && ratios[i] > 0
				? ratios[i]
				: DEFAULT_RATIO) * pageWidth;
	}
	const totalHeight = total;
	/** The page whose band contains y in strip px, or the last page past it. */
	const pageAt = (y: number) => {
		let lo = 0;
		let hi = positions.length - 1;
		while (lo < hi) {
			const mid = lo + Math.ceil((hi - lo) / 2);
			if (positions[mid] <= y) {
				lo = mid;
			} else {
				hi = mid - 1;
			}
		}
		return lo;
	};
	return {
		positions,
		totalHeight,
		pageAt,
		/** Page range intersecting [y0, y1]; [from, to) semantics via lastInclusive. */
		range: (y0: number, y1: number) => ({
			from: pageAt(Math.max(y0, 0)),
			lastInclusive: Math.min(pageAt(Math.max(y1, 0)), ratios.length - 1),
		}),
		/** The page's rendered height: its band of the positions' prefix. */
		pageHeight: (i: number) =>
			(i + 1 < positions.length ? positions[i + 1] : totalHeight) -
			positions[i],
	};
};

export type StripLayout = ReturnType<typeof stripLayout>;
