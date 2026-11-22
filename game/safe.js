// safe.js — the harbormaster's safe. Stand close and hold E (or hold the
// mouse button on it) to crack it. Cracking takes a few seconds of
// exposure; stepping away lets the dial slip back a little. Once cracked
// the safe spills its loot and the speedboat becomes the way out.

export const SAFE_POS = { x: 1110, y: 105 };
export const SAFE_LOOT = 500;
export const CRACK_TIME = 4; // seconds of holding the dial

export class Safe {
  constructor() {
    this.progress = 0; // 0..1
    this.cracked = false;
    this.paid = false;
  }

  inRange(thief) {
    return Math.hypot(thief.x - SAFE_POS.x, thief.y - SAFE_POS.y) < 78;
  }

  update(dt, holding, near) {
    if (this.cracked) return;
    if (holding && near) {
      this.progress += dt / CRACK_TIME;
      if (this.progress >= 1) {
        this.progress = 1;
        this.cracked = true;
      }
    } else {
      this.progress = Math.max(0, this.progress - dt * 0.12);
    }
  }
}
