/** The scroll focal point in content px (pre-zoom layout space) plus its
 *  offsets within the viewport: enough to restore the focal point after a
 *  zoom, because the strip's proportional layout scales exactly with the
 *  page width (positions are prefix sums × the new width). */
export interface ZoomAnchor {
    yContent: number;
    xContent: number;
    offsetInViewY: number;
    offsetInViewX: number;
    oldZoom: number;
}
export interface ZoomAnchorConfig {
    scrollRef: {
        current: HTMLElement | undefined;
    };
    /** Position as of the last scroll event. Zoom renders apply it here
     *  because the DOM read is already clamped to the new layout. */
    scroll: {
        x: number;
        y: number;
    };
    zoom: number | undefined;
    containerWidth: number;
    /** The zoom that fits the container (the un-owned presentation's zoom). */
    fitZoom: number | undefined;
}
/**
 * Owns the scroll anchor used for zooming the strip: Ctrl+wheel captures
 * inline, view-driven zoom echoes capture at effect time from the mirrored
 * scroll position, and zoom changes scale the content anchor directly — no
 * measurement, no observers, exact by construction.
 */
export declare const useZoomAnchor: ({ scrollRef, scroll, zoom, fitZoom, containerWidth, }: ZoomAnchorConfig) => {
    capture: (el: HTMLElement, oldZoom?: number, scroll?: {
        x: number;
        y: number;
    }) => void;
    anchorRef: import("@pionjs/pion").Ref<ZoomAnchor | null>;
};
