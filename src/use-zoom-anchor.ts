import type { VirtualizerHostElement } from '@lit-labs/virtualizer/virtualize.js';
import { useEffect, useRef } from '@pionjs/pion';

/** The scroll focal point: the page containing it, its offset in that page,
 *  and the offset within the viewport — enough to restore the focal point
 *  after a zoom changes page sizes. */
export interface ZoomAnchor {
	pageIndex: number;
	offsetInPageY: number;
	offsetInViewY: number;
	oldZoom: number;
}

/**
 * Owns the scroll anchor used for manual zooming: captures the focal point
 * on container resizes (from wheel zooms and pointer grabs), and applies
 * externally set zoom factors to the page strip — re-measuring (data-min-width
 * on the virtualizer host for pages wider than the container), then restoring
 * the focal point once the new layout lands.
 */
export const useZoomAnchor = (
	scrollRef: { current: HTMLElement | undefined },
	pagesRef: { current: VirtualizerHostElement | undefined },
	zoom: number,
	pageWidth: number,
	containerWidth: number,
) => {
	const zoomRef = useRef(zoom);
	zoomRef.current = zoom;

	const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
	// The last zoom prop the hook applied (see the effect below).
	const zoomPropRef = useRef<number | null>(null);

	const capture = (el: HTMLElement) => {
		const rect = el.getBoundingClientRect();
		const offsetY = el.clientHeight / 2;
		const focalClientY = rect.top + offsetY;
		const pageEls = el.querySelectorAll<HTMLElement>('[data-page]');
		let pageIndex = 0;
		let offsetInPageY = 0;
		for (const pageEl of pageEls) {
			const pageRect = pageEl.getBoundingClientRect();
			if (pageRect.top <= focalClientY) {
				pageIndex = Number(pageEl.dataset.page ?? 0);
				offsetInPageY = focalClientY - pageRect.top;
			} else {
				break;
			}
		}

		zoomAnchorRef.current = {
			pageIndex,
			offsetInPageY: offsetInPageY ?? 0,
			offsetInViewY: offsetY,
			oldZoom: zoomRef.current ?? 1,
		};
	};

	// Host width follows the pages whenever pages exceed the container —
	// stateless in zoom, so even a bare viewer (zoom never set) is pannable.
	useEffect(() => {
		if (containerWidth === 0 || !pagesRef.current || pageWidth == null) return;
		if (pageWidth > containerWidth) {
			pagesRef.current.dataset.minWidth = `${pageWidth}px`;
		} else {
			delete pagesRef.current.dataset.minWidth;
		}
	}, [pageWidth, containerWidth]);

	// Apply an externally set zoom with a scroll anchor: the pages must be
	// re-measured and the focal point kept in place.
	useEffect(() => {
		if (zoom == null || zoom === zoomPropRef.current) return;
		zoomPropRef.current = zoom;

		if (containerWidth === 0 || !pagesRef.current) return;
		if (!zoomAnchorRef.current && scrollRef.current) {
			capture(scrollRef.current);
		}
		const anchor = zoomAnchorRef.current;
		zoomAnchorRef.current = null;

		if (!anchor || !scrollRef.current) return;
		const ratio = zoom / anchor.oldZoom;
		const container = scrollRef.current;
		const ro = new ResizeObserver(() => {
			ro.disconnect();
			const pageEl = container.querySelector<HTMLElement>(
				`[data-page="${anchor.pageIndex}"]`,
			);
			if (pageEl) {
				const containerRect = container.getBoundingClientRect();
				const pageTop =
					pageEl.getBoundingClientRect().top -
					containerRect.top +
					container.scrollTop;
				container.scrollTop =
					pageTop + anchor.offsetInPageY * ratio - anchor.offsetInViewY;
			} else {
				container.scrollTop =
					(container.scrollTop + anchor.offsetInViewY) * ratio -
					anchor.offsetInViewY;
			}
		});
		ro.observe(pagesRef.current);
	}, [zoom, pageWidth, containerWidth]);

	return { capture };
};
