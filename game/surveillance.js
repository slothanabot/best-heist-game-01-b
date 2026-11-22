// surveillance.js — the dock's sweeping security cameras. Each camera
// hangs on a wall or the crane and sweeps its vision cone back and forth.
// A camera loop tool freezes one camera in place for a few seconds.
// Like a guard, a camera spots the thief only with a clear line of sight.

import { lineBlocked } from './dock.js';

export const CAM_RANGE = 260;
export const CAM_HALF_ANGLE = 0.44; // ~25 degrees each side

export class Camera {
  constructor(x, y, centerAngle, sweep, speed) {
    this.x = x;
    this.y = y;
    this.centerAngle = centerAngle;
    this.sweep = sweep; // radians either side of center
    this.speed = speed;
    this.phase = 0;
    this.angle = centerAngle;
    this.frozen = 0; // seconds of loop remaining
  }

  update(dt) {
    if (this.frozen > 0) {
      this.frozen -= dt;
      return;
    }
    this.phase += dt * this.speed;
    this.angle = this.centerAngle + Math.sin(this.phase) * this.sweep;
  }

  sees(thief, obstacles) {
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CAM_RANGE) return false;
    let diff = Math.atan2(dy, dx) - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > CAM_HALF_ANGLE) return false;
    return !lineBlocked(obstacles, this.x, this.y, thief.x, thief.y);
  }
}

export function buildCameras() {
  return [
    // Office-wall camera, sweeping the approach lane.
    new Camera(986, 120, 2.4, 0.9, 0.7),
    // Crane camera, sweeping the container yard from above.
    new Camera(720, 66, Math.PI / 2, 1.0, 0.55),
  ];
}
