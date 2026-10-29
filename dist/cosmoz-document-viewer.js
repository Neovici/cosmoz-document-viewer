import { component, css, html, useEffect, useMemo, useRef, useState, } from '@pionjs/pion';
import { useProperty } from '@pionjs/pion/lib/use-property';
import { ref } from 'lit-html/directives/ref.js';
import { DEFAULT_NATURAL_WIDTH } from './cosmoz-document-viewer-page.js';
import { DEFAULT_RATIO, stripLayout } from './strip-layout.js';
import { useZoomAnchor } from './use-zoom-anchor.js';
import { virtualWindow } from './virtual-window.js';
import { roundToStep, ZOOM_IN_STEP, ZOOM_OUT_STEP } from './zoom-model.js';
/** A page's upfront ratio: LazyPage may carry one; anything else defaults. */
const ratioOf = (p) => typeof p === 'object' ? (p.ratio ?? DEFAULT_RATIO) : DEFAULT_RATIO;
const emptySpecs = [];
const OVERSCAN = 1200; // strip px rendered beyond the viewport, both sides
const styles = css `
	:host {
		display: flex;
		flex-direction: column;
		position: relative;
		height: 100%;
		width: 100%;
		overflow: hidden;
		background: var(--cz-color-bg-primary);
	}

	.scroll-container {
		flex: 1;
		overflow: auto;
		scrollbar-gutter: stable;
		padding: 0;
	}

	.pages {
		position: relative;
		width: 100%;
		min-height: 100%;
	}

	.page-wrapper {
		position: absolute;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
	}
`;
/**
 * Continuously vertically scrolling document viewer built on a proportional
 * strip layout (`strip-layout`): all pages share one width and positions
 * are prefix sums of per-page aspect ratios, so zooming is exact and
 * anchored restore is closed-form. Page rendering and scroll tracking live
 * here; scrolling is the container's native behavior and zoom plus the
 * current page are owned by the embedding view and passed as properties —
 * Ctrl+wheel announces intent with a `zoom-changed` event so the view lifts
 * it into its state.
 */
const CosmozDocumentViewer = (host) => {
    const [naturalWidth, setNaturalWidth] = useState(DEFAULT_NATURAL_WIDTH);
    const [containerWidth, setContainerWidth] = useState(0);
    const [currentPage, setCurrentPage] = useProperty('currentPage', () => 0);
    const [, setReady] = useProperty('ready', () => false);
    const [fitZoom, setFitZoom] = useProperty('fitZoom', () => 0);
    const [, setPageCount] = useProperty('pageCount', () => 0);
    const [ratios, setRatios] = useState([]);
    const [range, setRange] = useState({ from: 0, lastInclusive: -1 });
    // Last scroll-event position. The zoom anchor captures from this mirror,
    // because a DOM read at zoom-render time is already clamped to the new
    // (smaller) layout.
    const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
    const scrollRef = useRef();
    const lastPublishedRef = useRef(0);
    const naturalWidthRef = useRef(DEFAULT_NATURAL_WIDTH);
    naturalWidthRef.current = naturalWidth;
    // Read reactively (render-tracking) so a post-mount zoomMode change
    // works; host properties are not attribute-mapped.
    const zoomMode = host.zoomMode;
    const source = host.pages ?? emptySpecs;
    // ── derived ──────────────────────────────────────────────────────────
    // Until the view owns zoom, pages display fitted to the container.
    let pageWidth = naturalWidth;
    if (host.zoom != null) {
        pageWidth = naturalWidth * host.zoom;
    }
    else if (containerWidth > 0) {
        pageWidth = Math.min(naturalWidth, containerWidth);
    }
    const pageWidthRef = useRef(0);
    pageWidthRef.current = pageWidth;
    const layout = useMemo(() => stripLayout(ratios, pageWidth), [ratios, pageWidth]);
    const emitZoom = (value, reason) => host.dispatchEvent(new CustomEvent('zoom-changed', {
        detail: reason ? { value, reason } : { value },
        bubbles: true,
        composed: true,
    }));
    // ── hooks ────────────────────────────────────────────────────────────
    const zoomAnchor = useZoomAnchor({
        scrollRef,
        scroll: scrollPos,
        zoom: host.zoom,
        containerWidth,
        fitZoom,
    });
    // ── element API: annotation primitives ───────────────────────────────
    // Imperative methods assigned on the host so closures see the current
    // render's layout; pion components don't declare class methods.
    /** Inverse locator: a client point (viewport coords) projected onto the
     *  strip — the page index plus that point in unit space. Null when
     *  off-document. Annotation layers draw with this. */
    host.pageAtPoint = (x, y) => {
        const el = scrollRef.current;
        const pw = pageWidthRef.current;
        if (!el || !pw) {
            return null;
        }
        const b = el.getBoundingClientRect();
        const sy = el.scrollTop + y - b.top;
        if (sy < 0 || sy >= layout.totalHeight) {
            return null;
        }
        const page = layout.pageAt(sy);
        const pageH = layout.pageHeight(page);
        const stripW = Math.max(el.clientWidth, pw);
        const sx = el.scrollLeft + x - b.left - (stripW - pw) / 2;
        return {
            page,
            width: pw,
            height: pageH,
            x: sx / pw,
            y: (sy - layout.positions[page]) / pageH,
        };
    };
    /** Lands the unit-space region's center at the viewport's center at
     *  the current zoom; page-edge regions clamp instead of overscrolling. */
    host.jumpToRegion = (page, rect) => {
        const el = scrollRef.current;
        const pw = pageWidthRef.current;
        if (!el || !pw || layout.positions[page] == null) {
            return;
        }
        const pageH = layout.pageHeight(page);
        const cY = layout.positions[page] + (rect.y + rect.height / 2) * pageH;
        const stripW = Math.max(el.clientWidth, pw);
        const cX = (stripW - pw) / 2 + (rect.x + rect.width / 2) * pw;
        el.scrollTop = Math.max(0, Math.min(cY - el.clientHeight / 2, el.scrollHeight - el.clientHeight));
        el.scrollLeft = Math.max(0, Math.min(cX - el.clientWidth / 2, el.scrollWidth - el.clientWidth));
    };
    // One effect owns the whole document lifecycle: ratio seeds from the
    // input, natural-width and ready reset, page count reported.
    useEffect(() => {
        setRatios(source.map(ratioOf));
        setNaturalWidth(DEFAULT_NATURAL_WIDTH);
        setReady(false);
        setPageCount(source.length);
    }, [source]);
    // Fit zoom: derived from the container, reported to consumers. When the
    // view follows (fit mode) the value is lifted into zoom ownership.
    useEffect(() => {
        const fit = containerWidth > 0 ? Math.min(1, containerWidth / naturalWidth) : 1.0;
        setFitZoom(fit);
        if (containerWidth === 0 || zoomMode !== 'fit')
            return;
        emitZoom(fit, 'fit-follow');
    }, [containerWidth, naturalWidth, zoomMode]);
    // ── container width ──────────────────────────────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el)
            return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // A zoom following this resize (fit-follow adoption) captures
                // its own fresh anchor in useZoomAnchor; pre-capturing here
                // would survive plain scrolls and restore from a stale spot.
                setContainerWidth(entry.contentRect.width);
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    // ── virtual window + page tracking ───────────────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el)
            return;
        const update = () => {
            const { scrollLeft: x, scrollTop: y, clientHeight: h } = el;
            setScrollPos({ x, y });
            setRange(layout.range(y - OVERSCAN, y + h + OVERSCAN));
            // The page at the container's vertical midpoint is the current
            // one; the layout is exact, so this publishes deterministically.
            const page = layout.pageAt(y + h / 2);
            if (page !== lastPublishedRef.current) {
                lastPublishedRef.current = page;
                setCurrentPage(page);
            }
        };
        update();
        el.addEventListener('scroll', update);
        return () => el.removeEventListener('scroll', update);
    }, [layout]);
    // External currentPage writes (view-driven navigation): the layout is
    // exact, so one closed-form assignment lands the jump.
    useEffect(() => {
        if (!source.length || currentPage == null)
            return;
        if (currentPage === lastPublishedRef.current)
            return;
        lastPublishedRef.current = currentPage;
        const el = scrollRef.current;
        if (el)
            el.scrollTop = layout.positions[currentPage] ?? 0;
    }, [currentPage, source.length]);
    // ── page-ready: ratio, base width + ready flag ───────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el)
            return;
        const onPageReady = (e) => {
            const { index, ratio, naturalWidth: nw, } = e.detail;
            if (naturalWidthRef.current === DEFAULT_NATURAL_WIDTH &&
                typeof nw === 'number' &&
                nw > 0) {
                setNaturalWidth(nw);
            }
            if (typeof ratio === 'number' && ratio > 0) {
                setRatios((prev) => {
                    const next = [...prev];
                    next[index] = ratio;
                    return next;
                });
            }
            setReady(true);
        };
        el.addEventListener('page-ready', onPageReady);
        return () => el.removeEventListener('page-ready', onPageReady);
    }, []);
    // ── wheel zoom: announce the intent, nothing more ─────────────────────
    const onWheel = (e) => {
        if (!e.ctrlKey)
            return;
        e.preventDefault();
        if (scrollRef.current) {
            zoomAnchor.capture(scrollRef.current);
        }
        emitZoom(roundToStep((host.zoom ?? fitZoom ?? 1) *
            (e.deltaY > 0 ? ZOOM_OUT_STEP : ZOOM_IN_STEP)), 'wheel');
    };
    const renderPage = (i) => {
        const p = source[i];
        const page = typeof p === 'object' ? p.render : p;
        return html `<cosmoz-document-viewer-page
			.page=${page ?? ''}
			.width=${pageWidth ?? 0}
			.index=${i}
		>
			<slot name="page-${i}-overlay"></slot>
		</cosmoz-document-viewer-page>`;
    };
    return html `
		<div
			class="scroll-container"
			part="scroll-container"
			${ref((el) => {
        scrollRef.current = el;
    })}
			@wheel=${onWheel}
		>
			<div
				class="pages"
				style="min-height: ${layout.totalHeight}px; min-width: ${pageWidth}px"
			>
				${virtualWindow({ layout, range, renderItem: renderPage })}
			</div>
		</div>
	`;
};
const cosmozDocumentViewer = component(CosmozDocumentViewer, {
    styleSheets: [styles],
});
customElements.define('cosmoz-document-viewer', cosmozDocumentViewer);
export { CosmozDocumentViewer, cosmozDocumentViewer };
