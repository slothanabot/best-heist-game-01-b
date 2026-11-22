// dock.js — the harbor yard itself: walls, container stacks, the crane
// walkway, the harbormaster's office, the locked shortcut gate, the loot
// coins and the speedboat. Also the geometry helpers every other module
// uses: circle-vs-rectangle collision and line-of-sight blocking.

export const WORLD_W = 1280;
export const WORLD_H = 720;

export const WATER = { x: 880, y: 648, w: 400, h: 72 }; // dock edge, bottom right
export const BOAT = { x: 1120, y: 684, r: 42 };
export const OFFICE = { x: 980, y: 40, w: 260, h: 150 };
export const OFFICE_DOOR = { x: 1085, y: 190, w: 70, h: 12 }; // gap in office wall
export const START = { x: 80, y: 640 };

// Container stacks and walls. Each is {x, y, w, h, kind, label}.
// kind: 'container' | 'wall' | 'office' | 'gate' | 'crane'
export function buildObstacles() {
  const obs = [
    // outer walls (thin, keep the thief inside the yard)
    { x: 0, y: 0, w: 1280, h: 14, kind: 'wall' },
    { x: 0, y: 0, w: 14, h: 720, kind: 'wall' },
    { x: 1266, y: 0, w: 14, h: 720, kind: 'wall' },
    { x: 0, y: 706, w: 880, h: 14, kind: 'wall' },
    // container stacks — three routes thread between them
    { x: 170, y: 110, w: 190, h: 62, kind: 'container', hue: 'teal' },
    { x: 170, y: 250, w: 62, h: 190, kind: 'container', hue: 'rust' },
    { x: 420, y: 110, w: 62, h: 210, kind: 'container', hue: 'rust' },
    { x: 560, y: 350, w: 230, h: 62, kind: 'container', hue: 'teal' },
    { x: 420, y: 470, w: 62, h: 160, kind: 'container', hue: 'teal' },
    { x: 760, y: 130, w: 62, h: 200, kind: 'container', hue: 'rust' },
    { x: 250, y: 520, w: 130, h: 58, kind: 'container', hue: 'rust' },
    { x: 660, y: 520, w: 130, h: 58, kind: 'container', hue: 'teal' },
    // harbormaster's office walls (door gap at the bottom)
    { x: 980, y: 40, w: 260, h: 12, kind: 'office' },
    { x: 980, y: 40, w: 12, h: 150, kind: 'office' },
    { x: 1228, y: 40, w: 12, h: 150, kind: 'office' },
    { x: 980, y: 178, w: 105, h: 12, kind: 'office' },
    { x: 1155, y: 178, w: 85, h: 12, kind: 'office' },
    // crane legs (thin, walk around them)
    { x: 500, y: 60, w: 18, h: 90, kind: 'crane' },
    { x: 920, y: 60, w: 18, h: 90, kind: 'crane' },
  ];
  return obs;
}

// The locked shortcut gate: a chained container door blocking the middle
// corridor. The crowbar removes it. It starts as an obstacle.
export function buildGate() {
  return { x: 700, y: 330, w: 16, h: 120, kind: 'gate', locked: true };
}

// Loose loot coins scattered along the three routes.
export function buildCoins() {
  return [
    { x: 300, y: 90, taken: false, value: 25 },
    { x: 120, y: 350, taken: false, value: 25 },
    { x: 350, y: 430, taken: false, value: 25 },
    { x: 520, y: 260, taken: false, value: 40 },
    { x: 700, y: 90, taken: false, value: 25 },
    { x: 880, y: 260, taken: false, value: 40 },
    { x: 950, y: 480, taken: false, value: 25 },
    { x: 560, y: 620, taken: false, value: 25 },
    { x: 120, y: 560, taken: false, value: 25 },
    { x: 1050, y: 320, taken: false, value: 40 },
  ];
}

// Push a circle (the thief) out of every solid rectangle it overlaps.
export function resolveCircle(rects, body) {
  for (const r of rects) {
    const cx = Math.max(r.x, Math.min(body.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(body.y, r.y + r.h));
    const dx = body.x - cx;
    const dy = body.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < body.r * body.r) {
      if (d2 === 0) { body.y = r.y - body.r; continue; }
      const d = Math.sqrt(d2);
      body.x = cx + (dx / d) * body.r;
      body.y = cy + (dy / d) * body.r;
    }
  }
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (p === 0) { if (q < 0) return false; }
    else {
      const t = q / p;
      if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
      else { if (t < tmin) return false; if (t < tmax) tmax = t; }
    }
  }
  return true;
}

// True when any solid rectangle stands between two points.
export function lineBlocked(rects, x1, y1, x2, y2) {
  for (const r of rects) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}
