import { useEffect, useRef } from '@pionjs/pion';

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
	scrollRef: { current: HTMLElement | undefined };
	/** Position as of the last scroll event. Zoom renders apply it here
	 *  because the DOM read is already clamped to the new layout. */
	scroll: { x: number; y: number };
	zoom: number;
	pageWidth: number;
	containerWidth: number;
	/** The zoom that fits the container (the un-owned presentation's zoom). */
	fitZoom: number;
	pinchBusy?: { current?: boolean };
}

/**
 * Owns the scroll anchor used for zooming the strip: Ctrl+wheel captures
 * inline, view-driven zoom echoes capture at effect time from the mirrored
 * scroll position, and zoom changes scale the content anchor directly — no
 * measurement, no observers, exact by construction.
 */
export const useZoomAnchor = ({
	scrollRef,
	scroll,
	zoom,
	fitZoom,
	containerWidth,
	pinchBusy,
}: ZoomAnchorConfig) => {
	const zoomRef = useRef(zoom);
	zoomRef.current = zoom;

	const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
	// The last zoom prop the hook applied (see the effect below).
	const zoomPropRef = useRef<number | null>(null);

	const capture = (
		el: HTMLElement,
		/** The zoom the captured content coords are in — the currently
		 *  *laid-out* one. Defaults to the prop's current render value. */
		oldZoom: number = zoomRef.current ?? 1,
		/** Pre-layout scroll position. Defaults to a live read — pass the
		 *  mirrored one in zoom renders, where the DOM is already clamped. */
		scroll: { x: number; y: number } = { x: el.scrollLeft, y: el.scrollTop },
	) => {
		zoomAnchorRef.current = {
			yContent: scroll.y + el.clientHeight / 2,
			xContent: scroll.x + el.clientWidth / 2,
			offsetInViewY: el.clientHeight / 2,
			offsetInViewX: el.clientWidth / 2,
			oldZoom,
		};
	};

	useEffect(() => {
		if (zoom == null || zoom === zoomPropRef.current) return;
		// The layout is the previous zoom's layout until the restore below;
		// capture before updating the applied-zoom cursor.
		const previousZoom = zoomPropRef.current ?? fitZoom ?? zoom;
		zoomPropRef.current = zoom;
		if (pinchBusy?.current) {
			// The pinch's bake owns this echo; its closed form is exact.
			return;
		}
		if (containerWidth === 0) return;

		if (!zoomAnchorRef.current && scrollRef.current) {
			capture(scrollRef.current, previousZoom, scroll);
		}
		const anchor = zoomAnchorRef.current;
		zoomAnchorRef.current = null;
		const el = scrollRef.current;
		if (!anchor || !el) return;

		const ratio = zoom / anchor.oldZoom;
		el.scrollTop = anchor.yContent * ratio - anchor.offsetInViewY;
		el.scrollLeft = anchor.xContent * ratio - anchor.offsetInViewX;
	}, [zoom, containerWidth]);

	return { capture, anchorRef: zoomAnchorRef };
};
