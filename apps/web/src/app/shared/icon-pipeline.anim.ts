export const TRAVEL_MS = 1200;
export const CENTER_HOLD_MS = 820;
export const END_HOLD_MS = 680;
export const FADE_MS = 720;
export const IDLE_MS = 520;

export const LEG1_END = TRAVEL_MS;
export const CENTER_END = LEG1_END + CENTER_HOLD_MS;
export const LEG2_END = CENTER_END + TRAVEL_MS;
export const END_HOLD_END = LEG2_END + END_HOLD_MS;
export const FADE_END = END_HOLD_END + FADE_MS;
export const CYCLE_MS = FADE_END + IDLE_MS;

export type SegmentCoords = {
  lx: number;
  ly: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export type PipelineRefs = {
  root: HTMLElement;
  left: HTMLElement;
  center: HTMLElement;
  right: HTMLElement;
  leftBeam: SVGPathElement;
  rightBeam: SVGPathElement;
  comet: SVGCircleElement;
  cometTrail: SVGCircleElement;
};

function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
}

function segmentProgress(elapsed: number, start: number, duration: number): number {
  if (elapsed < start) return 0;
  if (elapsed >= start + duration) return 1;
  return easeOutQuart((elapsed - start) / duration);
}

function fadeProgress(elapsed: number, start: number, duration: number): number {
  if (elapsed < start) return 0;
  if (elapsed >= start + duration) return 1;
  return easeInOutQuart((elapsed - start) / duration);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function setGlow(
  el: HTMLElement,
  value: number,
  property: "--glow-left" | "--glow-center" | "--glow-right",
) {
  el.style.setProperty(property, value.toFixed(3));
}

function pulseNode(node: HTMLElement | null) {
  if (!node) return;
  node.classList.remove("is-pulsing");
  void node.offsetWidth;
  node.classList.add("is-pulsing");
}

export function updatePipelineGeometry(refs: PipelineRefs): SegmentCoords | null {
  const { root, left, center, right, leftBeam, rightBeam } = refs;
  const cRect = root.getBoundingClientRect();
  const lRect = left.getBoundingClientRect();
  const mRect = center.getBoundingClientRect();
  const rRect = right.getBoundingClientRect();

  const coords: SegmentCoords = {
    lx: lRect.left + lRect.width / 2 - cRect.left,
    ly: lRect.top + lRect.height / 2 - cRect.top,
    cx: mRect.left + mRect.width / 2 - cRect.left,
    cy: mRect.top + mRect.height / 2 - cRect.top,
    rx: rRect.left + rRect.width / 2 - cRect.left,
    ry: rRect.top + rRect.height / 2 - cRect.top,
  };

  leftBeam.setAttribute("d", `M ${coords.lx} ${coords.ly} L ${coords.cx} ${coords.cy}`);
  rightBeam.setAttribute("d", `M ${coords.cx} ${coords.cy} L ${coords.rx} ${coords.ry}`);

  for (const path of [leftBeam, rightBeam]) {
    const len = path.getTotalLength();
    path.style.setProperty("--path-len", String(len));
    path.setAttribute("stroke-dasharray", String(len));
  }

  return coords;
}

export function createPipelineAnimator(refs: PipelineRefs) {
  let cycleStart = performance.now();
  let centerPulsed = false;
  let rightPulsed = false;
  let coords: SegmentCoords | null = updatePipelineGeometry(refs);
  let raf = 0;

  const placeComet = (x: number, y: number, opacity: number, trailOpacity: number) => {
    refs.comet.setAttribute("cx", String(x));
    refs.comet.setAttribute("cy", String(y));
    refs.comet.setAttribute("opacity", String(opacity));
    refs.cometTrail.setAttribute("cx", String(x));
    refs.cometTrail.setAttribute("cy", String(y));
    refs.cometTrail.setAttribute("opacity", String(trailOpacity));
  };

  const tick = (now: number) => {
    const root = refs.root;
    if (!coords) {
      coords = updatePipelineGeometry(refs);
      raf = requestAnimationFrame(tick);
      return;
    }

    let elapsed = now - cycleStart;
    if (elapsed >= CYCLE_MS) {
      cycleStart = now;
      elapsed = 0;
      centerPulsed = false;
      rightPulsed = false;
    }

    const { lx, ly, cx, cy, rx, ry } = coords;
    const leftLen = refs.leftBeam.getTotalLength() || 1;
    const rightLen = refs.rightBeam.getTotalLength() || 1;

    let leftFill = 0;
    let rightFill = 0;
    let glowLeft = 0.22;
    let glowCenter = 0.14;
    let glowRight = 0.12;

    root.dataset.phase = "idle";

    if (elapsed < LEG1_END) {
      const t = segmentProgress(elapsed, 0, TRAVEL_MS);
      root.dataset.phase = "travel-left";
      leftFill = t;
      glowLeft = 0.35 + smoothstep(0, 0.35, t) * 0.55;
      glowCenter = smoothstep(0.55, 0.95, t) * 0.72;
      const p = refs.leftBeam.getPointAtLength(leftLen * t);
      placeComet(p.x, p.y, 0.95, 0.38);
      refs.leftBeam.style.setProperty("--beam-offset", String(leftLen * (1 - t)));
      refs.rightBeam.style.setProperty("--beam-offset", String(rightLen));
    } else if (elapsed < CENTER_END) {
      root.dataset.phase = "hold-center";
      leftFill = 1;
      glowLeft = Math.max(0.18, 0.7 - ((elapsed - LEG1_END) / CENTER_HOLD_MS) * 0.45);
      glowCenter = 0.82;
      refs.leftBeam.style.setProperty("--beam-offset", "0");
      refs.rightBeam.style.setProperty("--beam-offset", String(rightLen));
      placeComet(cx, cy, 0, 0);
      if (!centerPulsed) {
        centerPulsed = true;
        pulseNode(refs.center);
      }
    } else if (elapsed < LEG2_END) {
      const t = segmentProgress(elapsed, CENTER_END, TRAVEL_MS);
      root.dataset.phase = "travel-right";
      leftFill = 1;
      rightFill = t;
      glowCenter = 0.72 - smoothstep(0.2, 0.9, t) * 0.4;
      glowRight = 0.28 + smoothstep(0.15, 0.9, t) * 0.58;
      const p = refs.rightBeam.getPointAtLength(rightLen * t);
      placeComet(p.x, p.y, 0.95, 0.38);
      refs.leftBeam.style.setProperty("--beam-offset", "0");
      refs.rightBeam.style.setProperty("--beam-offset", String(rightLen * (1 - t)));
    } else if (elapsed < END_HOLD_END) {
      root.dataset.phase = "hold-right";
      leftFill = 1;
      rightFill = 1;
      glowCenter = 0.2;
      glowRight = 0.78;
      refs.leftBeam.style.setProperty("--beam-offset", "0");
      refs.rightBeam.style.setProperty("--beam-offset", "0");
      placeComet(rx, ry, 0, 0);
      if (!rightPulsed) {
        rightPulsed = true;
        pulseNode(refs.right);
      }
    } else if (elapsed < FADE_END) {
      const t = fadeProgress(elapsed, END_HOLD_END, FADE_MS);
      root.dataset.phase = "fade";
      const tail = 1 - t;
      leftFill = tail;
      rightFill = tail;
      glowLeft = 0.12;
      glowCenter = 0.1;
      glowRight = 0.12 + tail * 0.35;
      placeComet(rx, ry, 0, 0);
      refs.leftBeam.style.setProperty("--beam-offset", String(leftLen * t));
      refs.rightBeam.style.setProperty("--beam-offset", String(rightLen * t));
    } else {
      root.dataset.phase = "idle";
      leftFill = 0;
      rightFill = 0;
      glowLeft = 0.18;
      glowCenter = 0.14;
      glowRight = 0.12;
      placeComet(lx, ly, 0, 0);
      refs.leftBeam.style.setProperty("--beam-offset", String(leftLen));
      refs.rightBeam.style.setProperty("--beam-offset", String(rightLen));
    }

    root.style.setProperty("--left-fill", leftFill.toFixed(3));
    root.style.setProperty("--right-fill", rightFill.toFixed(3));
    setGlow(root, glowLeft, "--glow-left");
    setGlow(root, glowCenter, "--glow-center");
    setGlow(root, glowRight, "--glow-right");

    raf = requestAnimationFrame(tick);
  };

  const onResize = () => {
    coords = updatePipelineGeometry(refs);
  };

  raf = requestAnimationFrame(tick);

  return {
    onResize,
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}
