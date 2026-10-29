/** Strip layout: positions and extent derived purely from per-page aspect
 *  ratios and the page width. No DOM measurement — zoom recomputes exactly
 *  (every position scales by width-new / width-old), which is what makes
 *  anchored zoom restore closed-form. */
/** Default per-page ratio before a page reports its own. */
export declare const DEFAULT_RATIO: number;
/**
 * @param ratios aspect ratio (height/width) per page; entries default to A4.
 * @param pageWidth rendered page width in css px (all pages share it).
 * @returns prefix positions per page, the strip's total height, and a
 *   range resolver for virtualized windows. Positions grow monotonically;
 *   page i occupies [positions[i], positions[i] + height(i)).
 */
export declare const stripLayout: (ratios: number[], pageWidth: number) => {
    positions: number[];
    totalHeight: number;
    pageAt: (y: number) => number;
    /** Page range intersecting [y0, y1]; [from, to) semantics via lastInclusive. */
    range: (y0: number, y1: number) => {
        from: number;
        lastInclusive: number;
    };
    /** The page's rendered height: its band of the positions' prefix. */
    pageHeight: (i: number) => number;
};
export type StripLayout = ReturnType<typeof stripLayout>;
