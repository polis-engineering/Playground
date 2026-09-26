export type StepperOptions = {
  wheelStepThreshold: number;
  wheelIdleResetMs: number;
  swipeMinDistancePx: number;
  swipeMinVelocity: number;
  tapSlopPx: number;
};

export type Step = -1 | 0 | 1;

const LINE_HEIGHT_PX = 16;

export function normalizeWheelDelta(delta: number, deltaMode: number, pageHeight: number) {
  if (deltaMode === 1) return delta * LINE_HEIGHT_PX;
  if (deltaMode === 2) return delta * pageHeight;
  return delta;
}

/**
 * s.page-style gesture debounce: any wheel burst or swipe yields at most one ±1 step.
 * Positive = next item (content moves toward top).
 */
export function createStepper(opts: StepperOptions) {
  let accum = 0;
  let armed = true;
  let lastWheelAt = -Infinity;

  return {
    wheel(deltaY: number, deltaX: number, now: number, busy: boolean): Step {
      if (now - lastWheelAt >= opts.wheelIdleResetMs) {
        armed = true;
        accum = 0;
      }
      lastWheelAt = now;
      if (busy) {
        accum = 0;
        return 0;
      }
      if (!armed || Math.abs(deltaX) > Math.abs(deltaY)) return 0;
      accum += deltaY;
      if (Math.abs(accum) < opts.wheelStepThreshold) return 0;
      const step: Step = accum > 0 ? 1 : -1;
      accum = 0;
      armed = false;
      return step;
    },

    swipe(dy: number, dx: number, dtMs: number, busy: boolean): Step {
      if (busy || Math.abs(dx) > Math.abs(dy)) return 0;
      const distance = Math.abs(dy);
      const velocity = distance / Math.max(1, dtMs);
      const far = distance >= opts.swipeMinDistancePx;
      const flick = distance > opts.tapSlopPx && velocity >= opts.swipeMinVelocity;
      if (!far && !flick) return 0;
      return dy < 0 ? 1 : -1;
    },

    reset() {
      accum = 0;
      armed = true;
      lastWheelAt = -Infinity;
    },
  };
}
