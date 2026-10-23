/**
 * Touch/pointer gestures for the page strip: one-finger pan with fling
 * inertia and two-finger pinch-zoom with pan. The input model (pointer map,
 * deferred tap commit, rubber-band bounds, focal tracking) is adapted
 * from @neovici/cosmoz-image-viewer's use-pan-zoom; the rendering differs,
 * because a scroll-driven virtualized strip must run through the scroll
 * position and page-size layout rather than a fixed transform group:
 *
 * - During a pinch, transform = translate(tx, ty) scale(k), origin at the
 *   strip's content origin, while the container scroll stays frozen at
 *   scroll0. Per move, whatever content px sits under the centroid keeps
 *   sitting under the (moved, rescaled) centroid — scale, pan and follow
 *   compose in one formula: t' = mid − k·p + scroll0.
 * - The transform is transient. Release announces the rounded zoom (the
 *   view echoes it back through `zoom-changed`) and injects the gesture's
 *   focal anchor into useZoomAnchor, which maps it onto the relaid layout
 *   from the real page top — the strip relayout is *not* a uniform
 *   scale (cached/estimated item sizes mix), so committing a closed-form
 *   scroll position here would jump on deep pages.
 * - Only the x axis is baked in closed form (strip width = page width is
 *   rigid and scales exactly); useZoomAnchor handles y.
 * - `pinchBusy` covers the whole ownership window: the viewer skips wheel
 *   zoom and useZoomAnchor skips mid-gesture zoom echoes. A consumer that
 *   ignores the announcement reverts to the pre-gesture view instead.
 * - `touch-action: none` comes with the hook (viewer CSS): touch pan is
 *   JS-driven (fling decay restores inertia), so native scrolling never
 *   races the two-finger takeover.
 */

import { useEffect } from '@pionjs/pion';
import { roundToStep } from './zoom-model.js';

type Ref<T> = { current: T | undefined };

interface Point {
	x: number;
	y: number;
}

interface Pinner {
	t: number;
	scrollX: number;
	scrollY: number;
}

interface Pinch {
	active: boolean;
	k: number;
	tx: number;
	ty: number;
	minK: number;
	maxK: number;
	zoom0: number;
	zoomFloor: number;
	scroll0: Point;
	origin: Point;
	lastMid: Point | null;
}

interface PanStart extends Point {
	scrollX: number;
	scrollY: number;
}

const FLING_TAU = 325; // px/ms decay: ≈0.95 per frame
const FLING_MIN_VELOCITY = 0.25; // px/ms
/** A deferred touch commits as a pan beyond this distance; otherwise it
 *  waits out the window (tap) before being discarded. */
const TAP_COMMIT_MS = 200;
const TAP_COMMIT_PX = 10;

const rubberBand = (value: number, min: number, max: number, factor = 2) => {
	if (value < min) {
		return min - (min - value) / factor;
	}
	if (value > max) {
		return max + (value - max) / factor;
	}
	return value;
};

const centroid = (pointers: Map<number, Point>, origin: Point) => {
	const pts = [...pointers.values()];
	if (pts.length < 2) {
		return null;
	}
	return {
		x: (pts[0].x + pts[1].x) / 2 - origin.x,
		y: (pts[0].y + pts[1].y) / 2 - origin.y,
		dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y),
	};
};

const interactiveTarget = (e: PointerEvent) =>
	e
		.composedPath()
		.some(
			(node) =>
				node instanceof HTMLElement &&
				node.matches(
					'button, a, input, select, textarea, [contenteditable], [data-pan-ignore]',
				),
		);

/** Fling decay + tap/pan/pinch gesture handling for the strip. */
export const usePinchZoom = ({
	scrollRef,
	pagesRef,
	naturalWidthRef,
	pageWidthRef,
	emitZoom,
	pinchBusy,
	enabled,
}: {
	scrollRef: Ref<HTMLElement>;
	pagesRef: Ref<HTMLElement>;
	naturalWidthRef: Ref<number | undefined>;
	pageWidthRef: Ref<number>;
	emitZoom: (value: number, reason?: string) => void;
	pinchBusy: { current?: boolean };
	/** Suspends gestures entirely when false (annotation draw owns the pointer). */
	enabled: boolean;
}) => {
	useEffect(() => {
		const el = scrollRef.current;
		const strip = pagesRef.current;
		if (!el || !strip || !enabled) {
			return;
		}

		const gesture: Pinch = {
			active: false,
			k: 1,
			tx: 0,
			ty: 0,
			minK: 0,
			maxK: 1,
			zoom0: 1,
			zoomFloor: 1,
			scroll0: { x: 0, y: 0 },
			origin: { x: 0, y: 0 },
			lastMid: null,
		};
		const pointers = new Map<number, Point>();
		const panStart: PanStart = { x: 0, y: 0, scrollX: 0, scrollY: 0 };
		const samples: Pinner[] = [];
		let pending: { id: number; x: number; y: number; timer: number } | null =
			null;
		let flingRaf = 0;
		let bakeObserver: ResizeObserver | null = null;

		const discardPending = () => {
			if (pending) {
				clearTimeout(pending.timer);
				pending = null;
			}
		};

		const endGesture = () => {
			bakeObserver?.disconnect();
			bakeObserver = null;
			discardPending();
			gesture.active = false;
			gesture.k = 1;
			gesture.tx = 0;
			gesture.ty = 0;
			gesture.lastMid = null;
			pointers.clear();
			strip.style.transform = '';
			strip.style.transformOrigin = '';
			pinchBusy.current = false;
		};

		const cancelFling = () => {
			if (flingRaf) {
				cancelAnimationFrame(flingRaf);
				flingRaf = 0;
			}
		};

		const sample = () => {
			const t = performance.now();
			samples.push({ t, scrollX: el.scrollLeft, scrollY: el.scrollTop });
			while (samples.length > 1 && t - samples[0].t > 250) {
				samples.shift();
			}
		};

		const fling = (pointerType: string) => {
			const first = samples[0];
			const last = samples[samples.length - 1];
			const dt = last ? last.t - first.t : 0;
			if (samples.length < 2 || pointerType === 'mouse') {
				return;
			}
			if (dt < 30) {
				return;
			}
			let vx = (last.scrollX - first.scrollX) / dt;
			let vy = (last.scrollY - first.scrollY) / dt;
			if (Math.hypot(vx, vy) < FLING_MIN_VELOCITY) {
				return;
			}
			let lastTick = performance.now();
			const step = (tick: number) => {
				const d = Math.min(tick - lastTick, 64);
				lastTick = tick;
				const before = { x: el.scrollLeft, y: el.scrollTop };
				el.scrollLeft = before.x + vx * d;
				el.scrollTop = before.y + vy * d;
				// A boundary-locked scroll reports unchanged: velocity dead.
				if (el.scrollLeft === before.x && el.scrollTop === before.y) {
					vx = 0;
					vy = 0;
				}
				const decay = Math.exp(-d / FLING_TAU);
				vx *= decay;
				vy *= decay;
				if (Math.hypot(vx, vy) < 0.005) {
					flingRaf = 0;
					return;
				}
				flingRaf = requestAnimationFrame(step);
			};
			flingRaf = requestAnimationFrame(step);
		};

		/** Bounds: the strip may scale from fit-width (a page can't shrink
		 *  below the container) up to native raster width (1:1 — scaling any
		 *  further only upscales the raster). k is relative to the
		 *  gesture-start presentation. */
		const startPinch = () => {
			const nat = naturalWidthRef.current ?? 0;
			const pageWidth0 = pageWidthRef.current ?? 0;
			if (!nat || !pageWidth0) {
				return false;
			}
			const containerRect = el.getBoundingClientRect();
			gesture.zoom0 = pageWidth0 / nat;
			gesture.k = 1;
			gesture.tx = 0;
			gesture.ty = 0;
			gesture.minK = Math.min(1, el.clientWidth / pageWidth0);
			gesture.maxK = nat / pageWidth0;
			gesture.zoomFloor = el.clientWidth / nat;
			gesture.scroll0 = { x: el.scrollLeft, y: el.scrollTop };
			gesture.origin = { x: containerRect.left, y: containerRect.top };
			gesture.lastMid = centroid(pointers, gesture.origin);
			gesture.active = true;
			pinchBusy.current = true;
			return true;
		};

		const applyTransform = () => {
			strip.style.transformOrigin = '0 0';
			strip.style.transform = `translate(${gesture.tx}px, ${gesture.ty}px) scale(${gesture.k})`;
		};

		/** Content px under a viewport point in the gesture-start layout:
		 *  screen = k·p + t − scroll0 inverted. */
		const contentUnder = (mid: Point) => ({
			x: (mid.x - gesture.tx + gesture.scroll0.x) / gesture.k,
			y: (mid.y - gesture.ty + gesture.scroll0.y) / gesture.k,
		});

		// screen(y) = k·y + t − scroll0 holds after every per-move update.
		const pinchMove = (midX: number, midY: number, scaleDiff: number) => {
			const under = contentUnder({ x: midX, y: midY });
			gesture.k = rubberBand(gesture.k * scaleDiff, gesture.minK, gesture.maxK);
			gesture.tx = midX - gesture.k * under.x + gesture.scroll0.x;
			gesture.ty = midY - gesture.k * under.y + gesture.scroll0.y;
			applyTransform();
			gesture.lastMid = { x: midX, y: midY };
		};

		const panMove = (x: number, y: number) => {
			if (gesture.active) {
				return;
			}
			el.scrollLeft = panStart.scrollX + (panStart.x - x);
			el.scrollTop = panStart.scrollY + (panStart.y - y);
			sample();
		};

		const commitPinch = () => {
			const mid = gesture.lastMid;
			if (!mid) {
				endGesture();
				return;
			}
			const under = contentUnder(mid);
			const s0 = gesture.scroll0;
			const kC = Math.min(Math.max(gesture.k, gesture.minK), gesture.maxK);
			let zoomTarget = roundToStep(gesture.zoom0 * kC);
			// A sub-step pinch must not snap back to the start zoom: one
			// nudged 5% step in the gesture's direction (zoom-prop bounds).
			if (zoomTarget === gesture.zoom0) {
				const dir = kC >= 1 ? 1 : -1;
				zoomTarget = Math.min(
					1,
					Math.max(gesture.zoomFloor, zoomTarget + 0.05 * dir),
				);
			}
			const layoutK = zoomTarget / gesture.zoom0;
			// The preview must match the committed scale exactly.
			gesture.k = layoutK;
			gesture.tx = mid.x - layoutK * under.x + gesture.scroll0.x;
			gesture.ty = mid.y - layoutK * under.y + gesture.scroll0.y;
			applyTransform();

			// Unsuppress then announce: the bake below owns the scroll, in
			// closed form, for both axes — the strip layout is exactly uniform
			//(positions = prefix sums scaled by the new width).
			pinchBusy.current = false;
			emitZoom(zoomTarget, 'pinch');
			let baked = false;
			let armed = false;
			// ResizeObserver delivers an initial record right after observe;
			// only the next record means the echo's relayout actually landed.
			const ro = new ResizeObserver(() => {
				if (!armed) {
					armed = true;
					return;
				}
				baked = true;
				el.scrollLeft = s0.x - gesture.tx;
				el.scrollTop = s0.y - gesture.ty;
				endGesture();
			});
			bakeObserver = ro;
			ro.observe(strip);
			// The consumer ignores the announcement: the layout is unchanged,
			// revert to the pre-gesture view instead of baking stale scrolls.
			window.setTimeout(() => {
				if (baked) {
					return;
				}
				endGesture();
			}, 600);
		};

		const capture = (pointerId: number) => {
			try {
				el.setPointerCapture(pointerId);
			} catch {
				// synthetic pointers cannot be captured
			}
		};

		const release = (pointerId: number) => {
			try {
				el.releasePointerCapture(pointerId);
			} catch {
				// pointer capture was never set
			}
		};

		const startPan = (pos: Point) => {
			panStart.x = pos.x;
			panStart.y = pos.y;
			panStart.scrollX = el.scrollLeft;
			panStart.scrollY = el.scrollTop;
			samples.length = 0;
			sample();
		};

		const down = (e: PointerEvent) => {
			cancelFling();
			if (interactiveTarget(e)) {
				return; // slotted interactive content owns its own gestures
			}
			if (e.pointerType === 'mouse' && (e.ctrlKey || e.metaKey)) {
				return; // Ctrl/Cmd+drag belongs to useDragPan
			}

			const pos = { x: e.clientX, y: e.clientY };

			// First touch: hold it back to read the intent (tap / pan / pinch).
			if (!gesture.active && pointers.size === 0 && !pending) {
				if (e.pointerType === 'mouse') {
					pointers.set(e.pointerId, pos);
					startPan(pos);
					return;
				}
				pending = {
					id: e.pointerId,
					x: pos.x,
					y: pos.y,
					timer: window.setTimeout(() => {
						// Held still: a tap (or a long-press); let the click
						// reach the page content.
						pending = null;
					}, TAP_COMMIT_MS),
				};
				return;
			}

			// Second touch, or a pointer arriving while a gesture is live.
			const deferring = pending;
			discardPending();
			pointers.set(e.pointerId, pos);
			if (deferring) {
				pointers.set(deferring.id, { x: deferring.x, y: deferring.y });
			}
			capture(e.pointerId);
			if (deferring) {
				capture(deferring.id);
			}
			if (!gesture.active && pointers.size >= 2) {
				startPinch();
			}
		};

		const move = (e: PointerEvent) => {
			const pos = { x: e.clientX, y: e.clientY };

			if (!gesture.active && pending?.id === e.pointerId) {
				const def = pending;
				if (Math.hypot(pos.x - def.x, pos.y - def.y) > TAP_COMMIT_PX) {
					// Pan intent: commit instantly with the touch's base.
					discardPending();
					pointers.set(def.id, { x: def.x, y: def.y });
					capture(def.id);
					startPan({ x: def.x, y: def.y });
					panMove(pos.x, pos.y);
				}
				return;
			}

			if (!pointers.has(e.pointerId)) {
				return;
			}
			const prev = pointers.get(e.pointerId);
			if (!prev) {
				return;
			}
			const before =
				gesture.active && pointers.size >= 2
					? centroid(pointers, gesture.origin)
					: null;
			pointers.set(e.pointerId, pos);
			if (gesture.active) {
				const after = centroid(pointers, gesture.origin);
				if (after && before) {
					pinchMove(after.x, after.y, after.dist / Math.max(before.dist, 1));
				} else {
					// One finger left under the live transform: pan there.
					gesture.tx += pos.x - prev.x;
					gesture.ty += pos.y - prev.y;
					applyTransform();
					gesture.lastMid = {
						x: pos.x - gesture.origin.x,
						y: pos.y - gesture.origin.y,
					};
				}
				return;
			}
			if (pointers.size >= 2) {
				startPinch();
				return;
			}
			panMove(pos.x, pos.y);
		};

		const up = (e: PointerEvent) => {
			release(e.pointerId);
			pointers.delete(e.pointerId);
			if (pending?.id === e.pointerId) {
				discardPending(); // tap or long-press: let the click through
				return;
			}
			if (gesture.active) {
				if (pointers.size === 0) {
					commitPinch();
				}
				return;
			}
			if (pointers.size === 0) {
				fling(e.pointerType);
			}
		};

		el.addEventListener('pointerdown', down);
		el.addEventListener('pointermove', move);
		el.addEventListener('pointerup', up);
		el.addEventListener('pointercancel', up);
		const onWheel = () => cancelFling();
		el.addEventListener('wheel', onWheel);

		return () => {
			endGesture();
			cancelFling();
			samples.length = 0;
			el.removeEventListener('pointerdown', down);
			el.removeEventListener('pointermove', move);
			el.removeEventListener('pointerup', up);
			el.removeEventListener('pointercancel', up);
			el.removeEventListener('wheel', onWheel);
		};
	}, [enabled]);
};
