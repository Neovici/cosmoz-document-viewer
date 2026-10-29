/** The donor's multiplicative zoom model, shared by the viewer's wheel
 *  announcements and the view's zoom controls: multiply by a step, round
 *  to the nearest 5% (multiply by 20, round, divide by 20). */
export declare const ZOOM_OUT_STEP = 0.8;
export declare const ZOOM_IN_STEP = 1.25;
export declare const roundToStep: (z: number) => number;
