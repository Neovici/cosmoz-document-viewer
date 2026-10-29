import { useEffect, useRef } from '@pionjs/pion';
/**
 * Owns the scroll anchor used for zooming the strip: Ctrl+wheel captures
 * inline, view-driven zoom echoes capture at effect time from the mirrored
 * scroll position, and zoom changes scale the content anchor directly — no
 * measurement, no observers, exact by construction.
 */
export const useZoomAnchor = ({ scrollRef, scroll, zoom, fitZoom, containerWidth, }) => {
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;
    const zoomAnchorRef = useRef(null);
    // The last zoom prop the hook applied (see the effect below).
    const zoomPropRef = useRef(null);
    const capture = (el, 
    /** The zoom the captured content coords are in — the currently
     *  *laid-out* one. Un-owned layouts present at fitZoom. */
    oldZoom = zoomRef.current ?? fitZoom ?? 1, 
    /** Pre-layout scroll position. Defaults to a live read — pass the
     *  mirrored one in zoom renders, where the DOM is already clamped. */
    scroll = { x: el.scrollLeft, y: el.scrollTop }) => {
        zoomAnchorRef.current = {
            yContent: scroll.y + el.clientHeight / 2,
            xContent: scroll.x + el.clientWidth / 2,
            offsetInViewY: el.clientHeight / 2,
            offsetInViewX: el.clientWidth / 2,
            oldZoom,
        };
    };
    useEffect(() => {
        if (zoom == null || zoom === zoomPropRef.current)
            return;
        // The layout is the previous zoom's layout until the restore below;
        // capture before updating the applied-zoom cursor.
        const previousZoom = zoomPropRef.current ?? fitZoom ?? zoom;
        zoomPropRef.current = zoom;
        if (containerWidth === 0)
            return;
        if (!zoomAnchorRef.current && scrollRef.current) {
            capture(scrollRef.current, previousZoom, scroll);
        }
        const anchor = zoomAnchorRef.current;
        zoomAnchorRef.current = null;
        const el = scrollRef.current;
        if (!anchor || !el)
            return;
        const ratio = zoom / anchor.oldZoom;
        el.scrollTop = anchor.yContent * ratio - anchor.offsetInViewY;
        el.scrollLeft = anchor.xContent * ratio - anchor.offsetInViewX;
    }, [zoom, containerWidth]);
    return { capture, anchorRef: zoomAnchorRef };
};
