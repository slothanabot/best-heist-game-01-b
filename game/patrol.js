// patrol.js — the dock guards. Each guard walks a loop of waypoints,
// turns to face where he is going, and projects a vision cone. A guard
// spots the thief when the thief is inside the cone's range and angle
// and no container or wall blocks the line of sight. A noise-maker
// throw lures the nearest guard to a point for a few seconds.

import { lineBlocked } from './dock.js';

export const CONE_RANGE = 240;
export const CONE_HALF_ANGLE = 0.61; // ~35 degrees each side

export class Guard {
  constructor(waypoints, speed) {
    this.waypoints = waypoints;
    this.speed = speed;
    this.wp = 0;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.angle = 0;
    this.lure = null; // {x, y, t} while lured
    this.suspicious = 0; // seconds of "heard something" hesitation
  }

  update(dt, obstacles) {
    if (this.lure) {
      this.lure.t -= dt;
      const arrived = this.stepToward(this.lure.x, this.lure.y, dt);
      if (arrived || this.lure.t <= 0) {
        this.lure = null;
        this.suspicious = 1.2;
      }
      return;
    }
    if (this.suspicious > 0) {
      this.suspicious -= dt;
      this.angle += dt * 1.4; // look around, puzzled
      return;
    }
    const target = this.waypoints[this.wp];
    const arrived = this.stepToward(target.x, target.y, dt);
    if (arrived) this.wp = (this.wp + 1) % this.waypoints.length;
  }

  stepToward(tx, ty, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return true;
    this.angle = Math.atan2(dy, dx);
    const step = Math.min(dist, this.speed * dt);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    return dist - step < 4;
  }

  // True when this guard can currently see the thief.
  sees(thief, obstacles) {
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CONE_RANGE) return false;
    let diff = Math.atan2(dy, dx) - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > CONE_HALF_ANGLE) return false;
    return !lineBlocked(obstacles, this.x, this.y, thief.x, thief.y);
  }
}

export function buildGuards() {
  return [
    // Yard-center guard: loops the container stacks.
    new Guard(
      [{ x: 300, y: 300 }, { x: 680, y: 300 }, { x: 680, y: 480 }, { x: 300, y: 480 }],
      62,
    ),
    // Office-approach guard: sweeps the lane to the harbormaster's safe.
    new Guard(
      [{ x: 900, y: 250 }, { x: 900, y: 460 }, { x: 1150, y: 460 }, { x: 1150, y: 250 }],
      70,
    ),
    // Dock guard: patrols the open quay by the speedboat.
    new Guard(
      [{ x: 830, y: 560 }, { x: 1150, y: 560 }, { x: 1150, y: 620 }, { x: 830, y: 620 }],
      58,
    ),
  ];
}
