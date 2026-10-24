/**
 * touchGestures — element directive owning the strip's pointer gestures:
 * one/two-finger pan, pinch-zoom with fling inertia, and Ctrl/Cmd+drag pan
 * for mice. Bound on the scroll container, whose first element child is
 * the strip. The mode arrives per render and every handler gates on it, so
 * ownership flips are free: touch-action is decided by the browser at
 * gesture start, and the component's `data-native-touch` attribute hands
 * native scrolling back while the handlers stay inert.
 *
 * The input model (pointer map, deferred tap commit, rubber-band bounds,
 * focal tracking) is adapted from @neovici/cosmoz-image-viewer's
 * use-pan-zoom; the rendering differs, because a scroll-driven virtualized
 * strip must run through the scroll position and page-size layout rather
 * than a fixed transform group:
 *
 * - During a pinch, transform = translate(tx, ty) scale(k), origin at the
 *   strip's content origin, while the container scroll stays frozen at
 *   scroll0. Per move, whatever content px sits under the centroid keeps
 *   sitting under the (moved, rescaled) centroid — scale, pan and follow
 *   compose in one formula: t' = mid − k·p + scroll0.
 * - The transform is transient. Release announces the rounded zoom (the
 *   view echoes it back through `zoom-changed`); once the relaid layout
 *   lands, a ResizeObserver bakes the gesture's scroll into the new layout
 *   in closed form for both axes — the strip layout is exactly uniform
 *   (positions = prefix sums scaled by the new page width). A consumer
 *   that ignores the announcement reverts to the pre-gesture view instead.
 * - `pinchBusy` covers the whole ownership window: the viewer skips wheel
 *   zoom and useZoomAnchor skips mid-gesture zoom echoes.
 * - Pan/pinch handlers act only in `gestures` mode; Ctrl/Cmd+drag pans for
 *   mice in `gestures` and `native` (mouse ownership is not a touch-action
 *   question); `off` keeps every handler inert.
 */
import { noChange, type ElementPart } from 'lit-html';
import { AsyncDirective, directive } from 'lit-html/async-directive.js';
import type { TouchMode } from './cosmoz-document-viewer.js';
import { roundToStep } from './zoom-model.js';

/** Modifier conventions: macOS remaps plain Ctrl+click to a right click,
 *  so the pan modifier is Ctrl everywhere and Cmd there. Read per event,
 *  so tests can spoof the platform. */
const isMac = () => /mac/iu.test(navigator.platform);

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

/** Everything the gestures need from the viewer: the touch-ownership mode
 *  and the laid-out geometry (values, refreshed each render), plus the
 *  contract hooks. */
export interface GestureHost {
	/** Current touch ownership; handlers act only in `'gestures'`. */
	touch: TouchMode;
	/** The laid-out page width (px) at the current zoom. */
	pageWidth: number;
	/** The pages' natural raster width (px), for the gesture bounds. */
	naturalWidth: number;
	/** Announce a settled zoom (the `zoom-changed` contract). */
	emitZoom: (value: number, reason?: string) => void;
	/** True while a pinch owns the viewport: wheel zoom and zoom echoes
	 *  stand down until the bake. */
	pinchBusy: { current?: boolean };
}

class TouchGestures extends AsyncDirective {
	/** The bound scroll container; its first element child = the strip. */
	private el?: HTMLElement;
	private cfg?: GestureHost;
	private bound = false;

	private readonly gesture: Pinch = {
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
	private readonly pointers = new Map<number, Point>();
	private readonly panStart: PanStart = {
		x: 0,
		y: 0,
		scrollX: 0,
		scrollY: 0,
	};
	private readonly samples: Pinner[] = [];
	private pending: {
		id: number;
		x: number;
		y: number;
		timer: number;
	} | null = null;
	private flingRaf = 0;
	private bakeObserver: ResizeObserver | null = null;
	private drag: {
		startX: number;
		startY: number;
		pointerId: number;
	} | null = null;

	private get strip(): HTMLElement {
		return this.el!.firstElementChild as HTMLElement;
	}

	/** The directive call's signature derives from this method's params,
	 *  so the arg stays; only update() acts on it. */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	render(_host: GestureHost): unknown {
		return noChange;
	}

	update(part: ElementPart, [host]: [GestureHost]) {
		this.cfg = host;
		// Handlers gate on the mode per event: one bind covers 'native'
		// (Ctrl/Cmd-drag affordance and pan only) and 'gestures' (all of it);
		// 'off' never binds, the draw layer owns the pointer.
		if (!this.bound && host.touch !== 'off') {
			this.bind(part.element as HTMLElement);
		}
		return noChange;
	}

	protected reconnected() {
		if (this.el && !this.bound && this.cfg?.touch !== 'off') {
			this.bind(this.el);
		}
	}

	/** Listeners go away with the element; everything that outlives the
	 *  DOM (framing timers, the bake observer) is torn down here. */
	protected disconnected() {
		if (!this.bound) {
			return;
		}
		const el = this.el!;
		el.removeEventListener('pointerdown', this.onDown);
		el.removeEventListener('pointermove', this.onMove);
		el.removeEventListener('pointerup', this.onUp);
		el.removeEventListener('pointercancel', this.onUp);
		el.removeEventListener('wheel', this.onWheel);
		this.bound = false;
		this.teardown();
	}

	private bind(el: HTMLElement) {
		this.el = el;
		el.addEventListener('pointerdown', this.onDown);
		el.addEventListener('pointermove', this.onMove);
		el.addEventListener('pointerup', this.onUp);
		el.addEventListener('pointercancel', this.onUp);
		el.addEventListener('wheel', this.onWheel);
		this.bound = true;
	}

	private teardown() {
		this.endGesture();
		this.cancelFling();
		this.stopDrag();
		this.samples.length = 0;
	}

	// ── handlers ─────────────────────────────────────────────────────────

	/** Tap/pan/pinch intent routing plus the mouse modifier-drag. */
	private readonly onDown = (e: PointerEvent) => {
		this.affordance(e);
		this.cancelFling();
		if (
			this.cfg!.touch !== 'off' &&
			e.pointerType === 'mouse' &&
			(isMac() ? e.metaKey : e.ctrlKey) &&
			e.button === 0
		) {
			this.startDrag(e);
			return;
		}
		if (interactiveTarget(e)) {
			return; // slotted interactive content owns its own gestures
		}
		if (this.cfg!.touch !== 'gestures') {
			return;
		}

		const pos = { x: e.clientX, y: e.clientY };

		// First touch: hold it back to read the intent (tap / pan / pinch).
		if (!this.gesture.active && this.pointers.size === 0 && !this.pending) {
			if (e.pointerType === 'mouse') {
				this.pointers.set(e.pointerId, pos);
				this.startPan(pos);
				return;
			}
			this.pending = {
				id: e.pointerId,
				x: pos.x,
				y: pos.y,
				timer: window.setTimeout(() => {
					// Held still: a tap (or a long-press); let the click
					// reach the page content.
					this.pending = null;
				}, TAP_COMMIT_MS),
			};
			return;
		}

		// Second touch, or a pointer arriving while a gesture is live.
		const deferring = this.pending;
		this.discardPending();
		this.pointers.set(e.pointerId, pos);
		if (deferring) {
			this.pointers.set(deferring.id, { x: deferring.x, y: deferring.y });
		}
		this.capture(e.pointerId);
		if (deferring) {
			this.capture(deferring.id);
		}
		if (!this.gesture.active && this.pointers.size >= 2) {
			this.startPinch();
		}
	};

	private readonly onMove = (e: PointerEvent) => {
		this.affordance(e);
		if (this.drag) {
			this.dragMove(e);
			return;
		}
		if (this.cfg!.touch !== 'gestures') {
			return;
		}

		const pos = { x: e.clientX, y: e.clientY };

		if (!this.gesture.active && this.pending?.id === e.pointerId) {
			const def = this.pending;
			if (Math.hypot(pos.x - def.x, pos.y - def.y) > TAP_COMMIT_PX) {
				// Pan intent: commit instantly with the touch's base.
				this.discardPending();
				this.pointers.set(def.id, { x: def.x, y: def.y });
				this.capture(def.id);
				this.startPan({ x: def.x, y: def.y });
				this.panMove(pos.x, pos.y);
			}
			return;
		}

		if (!this.pointers.has(e.pointerId)) {
			return;
		}
		const prev = this.pointers.get(e.pointerId);
		if (!prev) {
			return;
		}
		const before =
			this.gesture.active && this.pointers.size >= 2
				? centroid(this.pointers, this.gesture.origin)
				: null;
		this.pointers.set(e.pointerId, pos);
		if (this.gesture.active) {
			const after = centroid(this.pointers, this.gesture.origin);
			if (after && before) {
				this.pinchMove(after.x, after.y, after.dist / Math.max(before.dist, 1));
			} else {
				// One finger left under the live transform: pan there.
				this.gesture.tx += pos.x - prev.x;
				this.gesture.ty += pos.y - prev.y;
				this.applyTransform();
				this.gesture.lastMid = {
					x: pos.x - this.gesture.origin.x,
					y: pos.y - this.gesture.origin.y,
				};
			}
			return;
		}
		if (this.pointers.size >= 2) {
			this.startPinch();
			return;
		}
		this.panMove(pos.x, pos.y);
	};

	private readonly onUp = (e: PointerEvent) => {
		if (this.drag) {
			this.stopDrag();
		}
		if (this.cfg!.touch !== 'gestures') {
			return;
		}
		this.release(e.pointerId);
		this.pointers.delete(e.pointerId);
		if (this.pending?.id === e.pointerId) {
			this.discardPending(); // tap or long-press: let the click through
			return;
		}
		if (this.gesture.active) {
			if (this.pointers.size === 0) {
				this.commitPinch();
			}
			return;
		}
		if (this.pointers.size === 0) {
			this.fling(e.pointerType);
		}
	};

	private readonly onWheel = () => this.cancelFling();

	// ── pointer plumbing ─────────────────────────────────────────────────

	private sample() {
		const el = this.el!;
		const t = performance.now();
		this.samples.push({ t, scrollX: el.scrollLeft, scrollY: el.scrollTop });
		while (this.samples.length > 1 && t - this.samples[0]!.t > 250) {
			this.samples.shift();
		}
	}

	private fling(pointerType: string) {
		const el = this.el!;
		const first = this.samples[0];
		const last = this.samples[this.samples.length - 1];
		const dt = last ? last.t - first!.t : 0;
		if (this.samples.length < 2 || pointerType === 'mouse') {
			return;
		}
		if (dt < 30) {
			return;
		}
		let vx = (last!.scrollX - first!.scrollX) / dt;
		let vy = (last!.scrollY - first!.scrollY) / dt;
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
				this.flingRaf = 0;
				return;
			}
			this.flingRaf = requestAnimationFrame(step);
		};
		this.flingRaf = requestAnimationFrame(step);
	}

	/** Bounds: the strip may scale from fit-width (a page can't shrink below
	 *  the container) up to native raster width (1:1 — scaling any further
	 *  only upscales the raster). k is relative to the gesture-start
	 *  presentation. */
	private startPinch() {
		const nat = this.cfg!.naturalWidth;
		const pageWidth0 = this.cfg!.pageWidth;
		if (!nat || !pageWidth0) {
			return false;
		}
		const el = this.el!;
		const containerRect = el.getBoundingClientRect();
		this.gesture.zoom0 = pageWidth0 / nat;
		this.gesture.k = 1;
		this.gesture.tx = 0;
		this.gesture.ty = 0;
		this.gesture.minK = Math.min(1, el.clientWidth / pageWidth0);
		this.gesture.maxK = nat / pageWidth0;
		this.gesture.zoomFloor = el.clientWidth / nat;
		this.gesture.scroll0 = { x: el.scrollLeft, y: el.scrollTop };
		this.gesture.origin = { x: containerRect.left, y: containerRect.top };
		this.gesture.lastMid = centroid(this.pointers, this.gesture.origin);
		this.gesture.active = true;
		this.cfg!.pinchBusy.current = true;
		return true;
	}

	private applyTransform() {
		const strip = this.strip;
		strip.style.transformOrigin = '0 0';
		strip.style.transform = `translate(${this.gesture.tx}px, ${this.gesture.ty}px) scale(${this.gesture.k})`;
	}

	/** Content px under a viewport point in the gesture-start layout:
	 *  screen = k·p + t − scroll0 inverted. */
	private contentUnder(mid: Point) {
		return {
			x: (mid.x - this.gesture.tx + this.gesture.scroll0.x) / this.gesture.k,
			y: (mid.y - this.gesture.ty + this.gesture.scroll0.y) / this.gesture.k,
		};
	}

	// screen(y) = k·y + t − scroll0 holds after every per-move update.
	private pinchMove(midX: number, midY: number, scaleDiff: number) {
		const under = this.contentUnder({ x: midX, y: midY });
		this.gesture.k = rubberBand(
			this.gesture.k * scaleDiff,
			this.gesture.minK,
			this.gesture.maxK,
		);
		this.gesture.tx = midX - this.gesture.k * under.x + this.gesture.scroll0.x;
		this.gesture.ty = midY - this.gesture.k * under.y + this.gesture.scroll0.y;
		this.applyTransform();
		this.gesture.lastMid = { x: midX, y: midY };
	}

	private panMove(x: number, y: number) {
		if (this.gesture.active) {
			return;
		}
		const el = this.el!;
		el.scrollLeft = this.panStart.scrollX + (this.panStart.x - x);
		el.scrollTop = this.panStart.scrollY + (this.panStart.y - y);
		this.sample();
	}

	private commitPinch() {
		const mid = this.gesture.lastMid;
		if (!mid) {
			this.endGesture();
			return;
		}
		const el = this.el!;
		const under = this.contentUnder(mid);
		const s0 = this.gesture.scroll0;
		const kC = Math.min(
			Math.max(this.gesture.k, this.gesture.minK),
			this.gesture.maxK,
		);
		let zoomTarget = roundToStep(this.gesture.zoom0 * kC);
		// A sub-step pinch must not snap back to the start zoom: one
		// nudged 5% step in the gesture's direction (zoom-prop bounds).
		if (zoomTarget === this.gesture.zoom0) {
			const dir = kC >= 1 ? 1 : -1;
			zoomTarget = Math.min(
				1,
				Math.max(this.gesture.zoomFloor, zoomTarget + 0.05 * dir),
			);
		}
		const layoutK = zoomTarget / this.gesture.zoom0;
		// The preview must match the committed scale exactly.
		this.gesture.k = layoutK;
		this.gesture.tx = mid.x - layoutK * under.x + s0.x;
		this.gesture.ty = mid.y - layoutK * under.y + s0.y;
		this.applyTransform();

		// Unsuppress then announce: the bake below owns the scroll, in
		// closed form, for both axes — the strip layout is exactly uniform
		// (positions = prefix sums scaled by the new width).
		this.cfg!.pinchBusy.current = false;
		this.cfg!.emitZoom(zoomTarget, 'pinch');
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
			el.scrollLeft = s0.x - this.gesture.tx;
			el.scrollTop = s0.y - this.gesture.ty;
			this.endGesture();
		});
		this.bakeObserver = ro;
		ro.observe(this.strip);
		// The consumer ignores the announcement: the layout is unchanged,
		// revert to the pre-gesture view instead of baking stale scrolls.
		window.setTimeout(() => {
			if (baked) {
				return;
			}
			this.endGesture();
		}, 600);
	}

	private capture(pointerId: number) {
		try {
			this.el!.setPointerCapture(pointerId);
		} catch {
			// synthetic pointers cannot be captured
		}
	}

	private release(pointerId: number) {
		try {
			this.el!.releasePointerCapture(pointerId);
		} catch {
			// pointer capture was never set
		}
	}

	private startPan(pos: Point) {
		const el = this.el!;
		this.panStart.x = pos.x;
		this.panStart.y = pos.y;
		this.panStart.scrollX = el.scrollLeft;
		this.panStart.scrollY = el.scrollTop;
		this.samples.length = 0;
		this.sample();
	}

	private discardPending() {
		if (this.pending) {
			clearTimeout(this.pending.timer);
			this.pending = null;
		}
	}

	private endGesture() {
		this.bakeObserver?.disconnect();
		this.bakeObserver = null;
		this.discardPending();
		this.gesture.active = false;
		this.gesture.k = 1;
		this.gesture.tx = 0;
		this.gesture.ty = 0;
		this.gesture.lastMid = null;
		this.pointers.clear();
		this.strip.style.transform = '';
		this.strip.style.transformOrigin = '';
		this.cfg!.pinchBusy.current = false;
	}

	private cancelFling() {
		if (this.flingRaf) {
			cancelAnimationFrame(this.flingRaf);
			this.flingRaf = 0;
		}
	}

	// ── Ctrl/Cmd-drag pan (mouse) ────────────────────────────────────────

	private startDrag(e: PointerEvent) {
		const el = this.el!;
		e.preventDefault();
		try {
			el.setPointerCapture(e.pointerId);
		} catch {
			// synthetic events in tests may not have a registered pointer id
		}
		this.drag = {
			startX: e.clientX + el.scrollLeft,
			startY: e.clientY + el.scrollTop,
			pointerId: e.pointerId,
		};
		el.dataset.dragging = '';
	}

	private dragMove(e: PointerEvent) {
		const el = this.el!;
		el.scrollLeft = this.drag!.startX - e.clientX;
		el.scrollTop = this.drag!.startY - e.clientY;
	}

	private stopDrag() {
		if (!this.drag) {
			return;
		}
		try {
			this.el!.releasePointerCapture(this.drag.pointerId);
		} catch {
			// pointer already released
		}
		this.drag = null;
		delete this.el!.dataset.dragging;
	}

	/** Hover with the pan modifier = grab-cursor affordance. Pointermove
	 *  carries the modifier state, so this needs no keyboard surveillance;
	 *  a drag lives to its end once started. */
	private affordance(e: PointerEvent) {
		const el = this.el!;
		const held = e.pointerType === 'mouse' && (isMac() ? e.metaKey : e.ctrlKey);
		if (held) {
			el.dataset.ctrl = '';
		} else {
			delete el.dataset.ctrl;
		}
	}
}

/** Strip pointer gestures: `touchGestures({...})` on the scroll container
 *  inside the template — see `GestureHost` for its inputs. */
export const touchGestures = directive(TouchGestures);
