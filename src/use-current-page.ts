import {
	VirtualizerHostElement,
	virtualizerRef,
} from '@lit-labs/virtualizer/virtualize.js';
import { useEffect, useRef } from '@pionjs/pion';

/**
 * Tracks the current page while the document scrolls: the page whose top
 * edge last passed the scroll container's vertical midpoint. Dispatches
 * nothing itself — the viewer owns the property/events.
 */
export const useCurrentPage = (
	scrollRef: { current: HTMLElement | undefined },
	pagesRef: { current: VirtualizerHostElement | undefined },
	pages: unknown[],
	setCurrentPage: (p: number) => void,
	currentPage: number,
) => {
	const lastPublishedRef = useRef(0);
	/** An in-flight view-driven jump: `target` gates the scroll tracking's
	 *  publishes (estimate-phase positions are not state; publishing them
	 *  would clobber the jump request before its own effect sees it) and
	 *  `cancelled` lets a newer request retire an older loop. */
	const jumpRef = useRef<{ target: number; cancelled: boolean } | null>(null);

	// Publish the page containing the container's vertical midpoint.
	useEffect(() => {
		// A new document takes over: no pending jump survives it.
		jumpRef.current = null;
		const container = scrollRef.current;
		if (!container || pages.length === 0) return;

		const update = () => {
			const midpoint = container.scrollTop + container.clientHeight / 2;
			const containerTop = container.getBoundingClientRect().top;
			const pageEls = container.querySelectorAll<HTMLElement>('[data-page]');
			let current = 0;
			for (const el of pageEls) {
				const elTop =
					el.getBoundingClientRect().top - containerTop + container.scrollTop;
				if (elTop <= midpoint) {
					current = Number(el.dataset.page ?? 0);
				} else {
					break;
				}
			}
			if (current === lastPublishedRef.current) {
				// Nothing new: never republish (and never let a settling scroll
				// clobber a newer external currentPage write).
				return;
			}
			if (jumpRef.current && current !== jumpRef.current.target) {
				// Mid-jump: estimates and transient positions are not state.
				return;
			}
			jumpRef.current = null;
			lastPublishedRef.current = current;
			setCurrentPage(current);
		};

		container.addEventListener('scroll', update);
		update();
		return () => container.removeEventListener('scroll', update);
	}, [pages]);

	// External currentPage writes (view-driven navigation) land outside the
	// scroll tracking: bring the target page into place — proportional
	// estimate first, then the exact page top once rendered (element(index)
	// only resolves rendered pages, so the estimate gets it rendered).
	useEffect(() => {
		if (pages.length === 0 || currentPage == null) return;
		if (currentPage === lastPublishedRef.current) return;
		if (jumpRef.current) jumpRef.current.cancelled = true;
		const jump = {
			target: Math.min(Math.max(currentPage, 0), pages.length - 1),
			cancelled: false,
		};
		jumpRef.current = jump;

		(async () => {
			for (let pass = 0; pass < 4 && !jump.cancelled; pass++) {
				const container = scrollRef.current;
				const pagesEl = pagesRef.current;
				const virtualizer = pagesEl?.[virtualizerRef];
				if (!container?.isConnected || !virtualizer) return;
				if (pass > 0) {
					const targetNode = pagesEl.querySelector<HTMLElement>(
						`[data-page="${jump.target}"]`,
					);
					if (targetNode?.isConnected) {
						// The laid-out node's position is authoritative: align its
						// top with the container's (deterministic, no animation).
						container.scrollTop +=
							targetNode.getBoundingClientRect().top -
							container.getBoundingClientRect().top;
						return;
					}
				}
				container.scrollTop =
					(container.scrollHeight * jump.target) / pages.length;
				// layoutComplete rejects with 'disconnected' when the element is
				// torn down mid-jump; treat it as cancellation.
				await virtualizer.layoutComplete.catch(() => {
					jump.cancelled = true;
				});
			}
		})();
	}, [currentPage, pages.length]);
};
