import { useEffect } from '@pionjs/pion';

// The pan modifier is Ctrl everywhere and Cmd on macOS — there, plain
// Ctrl+click is remapped to a right click and would conflict with the
// drag. Read per event, so tests can spoof the platform.
const isMac = () => /mac/iu.test(navigator.platform);

export const useDragPan = (scrollRef: { current: HTMLElement | undefined }) => {
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		const panKey = () => (isMac() ? 'Meta' : 'Control');

		type DragState = {
			startX: number;
			startY: number;
			pointerId: number;
		};
		const dragRef: [DragState | null] = [null];

		const stopDrag = () => {
			if (dragRef[0] != null) {
				try {
					el.releasePointerCapture(dragRef[0].pointerId);
				} catch {
					// ignore if pointer already released
				}
			}
			dragRef[0] = null;
			delete el.dataset.dragging;
		};

		const onPointerDown = (e: PointerEvent) => {
			const held = isMac() ? e.metaKey : e.ctrlKey;
			if (!held || e.button !== 0) return;
			e.preventDefault();
			try {
				el.setPointerCapture(e.pointerId);
			} catch {
				// synthetic events in tests may not have a registered pointer id
			}
			dragRef[0] = {
				startX: e.clientX + el.scrollLeft,
				startY: e.clientY + el.scrollTop,
				pointerId: e.pointerId,
			};
			el.dataset.dragging = '';
		};

		const onPointerMove = (e: PointerEvent) => {
			if (dragRef[0] == null) return;
			el.scrollLeft = dragRef[0].startX - e.clientX;
			el.scrollTop = dragRef[0].startY - e.clientY;
		};

		const onPointerUp = () => stopDrag();
		const onPointerCancel = () => stopDrag();

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === panKey()) el.dataset.ctrl = '';
		};
		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key === panKey()) {
				delete el.dataset.ctrl;
				stopDrag();
			}
		};

		el.addEventListener('pointerdown', onPointerDown);
		el.addEventListener('pointermove', onPointerMove);
		el.addEventListener('pointerup', onPointerUp);
		el.addEventListener('pointercancel', onPointerCancel);
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);

		return () => {
			el.removeEventListener('pointerdown', onPointerDown);
			el.removeEventListener('pointermove', onPointerMove);
			el.removeEventListener('pointerup', onPointerUp);
			el.removeEventListener('pointercancel', onPointerCancel);
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
		};
	}, []);
};
