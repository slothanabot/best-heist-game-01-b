// main.js — Harbor Lights Heist: the game loop and the rules that bind
// the modules together. State machine (start / play / paused / caught /
// win), the alarm meter, tool use, loot, the safe crack and the getaway.
// A ?shot= cover | alarm | win | start param freezes a deterministic
// demo state for screenshots; without it the game plays normally.

import { Controls } from './controls.js';
import { Sound } from './sound.js';
import {
  WORLD_W, WORLD_H, WATER, BOAT, START,
  buildObstacles, buildGate, buildCoins, resolveCircle,
} from './dock.js';
import { buildGuards } from './patrol.js';
import { buildCameras } from './surveillance.js';
import { Safe, SAFE_POS, SAFE_LOOT } from './safe.js';
import { drawWorld } from './draw.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  canvas.width = 1280;
  canvas.height = 720;
}
fitCanvas();

const controls = new Controls(canvas);
const sound = new Sound();

const game = {
  state: 'start',
  time: 0,
  elapsed: 0,
  thief: { x: START.x, y: START.y, r: 13, faceAngle: 0 },
  obstacles: buildObstacles(),
  gate: buildGate(),
  coins: buildCoins(),
  guards: buildGuards(),
  cameras: buildCameras(),
  safe: new Safe(),
  loot: 0,
  coinsValue: 0,
  alarm: 0,
  alarmPeak: 0,
  spotted: false,
  tools: { noise: 3, loop: 2, crowbar: 1 },
  objective: 'Reach the harbormaster\u2019s safe — slip past the cones.',
};

// Exposed for automated playtests (and curious players in devtools).
window.__heist = game;

function solids() {
  const list = [...game.obstacles];
  if (game.gate.locked) list.push(game.gate);
  return list;
}

function reset() {
  game.thief.x = START.x;
  game.thief.y = START.y;
  game.thief.faceAngle = 0;
  game.obstacles = buildObstacles();
  game.gate = buildGate();
  game.coins = buildCoins();
  game.guards = buildGuards();
  game.cameras = buildCameras();
  game.safe = new Safe();
  game.loot = 0;
  game.coinsValue = 0;
  game.alarm = 0;
  game.alarmPeak = 0;
  game.spotted = false;
  game.tools = { noise: 3, loop: 2, crowbar: 1 };
  game.elapsed = 0;
  game.objective = 'Reach the harbormaster\u2019s safe — slip past the cones.';
  game.state = 'play';
}

function nearestGuard() {
  let best = null;
  let bd = Infinity;
  for (const g of game.guards) {
    const d = Math.hypot(g.x - game.thief.x, g.y - game.thief.y);
    if (d < bd) { bd = d; best = g; }
  }
  return best;
}

function nearestCamera() {
  let best = null;
  let bd = Infinity;
  for (const c of game.cameras) {
    const d = Math.hypot(c.x - game.thief.x, c.y - game.thief.y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

function useNoise(point) {
  if (game.tools.noise <= 0) return;
  if (game.coinsValue < 20) return;
  game.coinsValue -= 20;
  game.tools.noise -= 1;
  const guard = nearestGuard();
  if (guard) guard.lure = { x: point.x, y: point.y, t: 4 };
  sound.noise();
}

function useLoop() {
  if (game.tools.loop <= 0) return;
  const cam = nearestCamera();
  if (!cam || cam.frozen > 0) return;
  game.tools.loop -= 1;
  cam.frozen = 8;
  sound.loop();
}

function useCrowbar() {
  if (game.tools.crowbar <= 0 || !game.gate.locked) return;
  const d = Math.hypot(game.thief.x - (game.gate.x + 8), game.thief.y - (game.gate.y + 60));
  if (d > 95) return;
  game.gate.locked = false;
  game.tools.crowbar -= 1;
  sound.crowbar();
}

function update(dt) {
  game.time += dt;
  if (game.state !== 'play') return;
  game.elapsed += dt;

  // Move the thief.
  const { x: ax, y: ay } = controls.axis();
  const speed = 175;
  if (ax !== 0 || ay !== 0) {
    game.thief.faceAngle = Math.atan2(ay, ax);
    game.thief.x += ax * speed * dt;
    game.thief.y += ay * speed * dt;
  }
  game.thief.x = Math.max(16, Math.min(WORLD_W - 16, game.thief.x));
  game.thief.y = Math.max(52, Math.min(WORLD_H - 16, game.thief.y));
  resolveCircle(solids(), game.thief);

  // Patrols and cameras.
  const solidsList = solids();
  for (const g of game.guards) g.update(dt, solidsList);
  for (const c of game.cameras) c.update(dt);

  // Spotted? Any guard or camera with a clear view.
  const seenByGuard = game.guards.some((g) => g.sees(game.thief, solidsList));
  const seenByCam = game.cameras.some((c) => c.sees(game.thief, solidsList));
  const wasSpotted = game.spotted;
  game.spotted = seenByGuard || seenByCam;
  if (game.spotted && !wasSpotted) sound.spotted();
  game.alarm += game.spotted ? 42 * dt : -14 * dt;
  game.alarm = Math.max(0, Math.min(100, game.alarm));
  game.alarmPeak = Math.max(game.alarmPeak, game.alarm);
  if (game.alarm >= 100) {
    game.state = 'caught';
    sound.caught();
    return;
  }

  // Coins.
  for (const coin of game.coins) {
    if (coin.taken) continue;
    if (Math.hypot(coin.x - game.thief.x, coin.y - game.thief.y) < 26) {
      coin.taken = true;
      game.coinsValue += coin.value;
      game.loot += coin.value;
      sound.coin();
    }
  }

  // The safe: hold E or hold the mouse button while close.
  const nearSafe = game.safe.inRange(game.thief);
  const mouse = controls.mouse;
  const holding = controls.keys.has('e') ||
    (mouse.down && Math.hypot(mouse.x - SAFE_POS.x, mouse.y - SAFE_POS.y) < 90);
  const before = game.safe.progress;
  game.safe.update(dt, holding, nearSafe);
  if (game.safe.progress > before && Math.floor(game.safe.progress * 20) !== Math.floor(before * 20)) sound.tick();
  if (game.safe.cracked && !game.safe.paid) {
    game.safe.paid = true;
    game.loot += SAFE_LOOT;
    game.objective = 'Safe cracked! Reach the speedboat at the dock — go!';
    sound.crack();
  }
  if (!game.safe.cracked && nearSafe) {
    game.objective = 'Hold E (or hold click) to crack the safe — watch the cones!';
  } else if (!game.safe.cracked) {
    game.objective = 'Reach the harbormaster\u2019s safe — slip past the cones.';
  }

  // Tools.
  if (controls.wasPressed('1')) useNoise({ x: controls.mouse.x, y: controls.mouse.y });
  if (controls.wasPressed('2')) useLoop();
  if (controls.wasPressed('3')) useCrowbar();
  const click = controls.takeClick();
  if (click && nearSafe) {
    // Clicking the safe also counts as grabbing the dial for a moment.
    game.safe.update(0.12, true, true);
  }

  // Getaway: reach the boat with the safe cracked.
  if (game.safe.cracked) {
    const d = Math.hypot(game.thief.x - BOAT.x, game.thief.y - BOAT.y);
    if (d < BOAT.r + 10) {
      game.state = 'win';
      sound.win();
      return;
    }
  }

  // Pause.
  if (controls.wasPressed('p') || controls.wasPressed('escape')) {
    game.state = 'paused';
  }
  controls.clearPressed();
}

function handleScreens() {
  if (game.state === 'start') {
    if (controls.wasPressed('enter') || controls.takeClick()) {
      sound.ensure();
      reset();
    }
    controls.clearPressed();
    return;
  }
  if (game.state === 'paused') {
    if (controls.wasPressed('p') || controls.wasPressed('escape') || controls.wasPressed('enter')) {
      game.state = 'play';
    }
    controls.clearPressed();
    return;
  }
  if (game.state === 'caught' || game.state === 'win') {
    if (controls.wasPressed('r') || controls.wasPressed('enter') || controls.takeClick()) {
      reset();
    }
    controls.clearPressed();
  }
}

// Deterministic demo states for screenshots — still real renders of
// the same game code, with entities placed for the shot.
function applyShot(shot) {
  if (shot === 'start') { game.state = 'start'; return; }
  if (shot === 'win') {
    reset();
    game.state = 'win';
    game.loot = 780;
    game.coinsValue = 280;
    game.elapsed = 187;
    game.alarmPeak = 63;
    game.safe.cracked = true;
    game.safe.paid = true;
    game.thief.x = BOAT.x - 20;
    game.thief.y = BOAT.y - 6;
    return;
  }
  reset();
  if (shot === 'cover') {
    // Thief mid-room, a guard cone sweeping past, a camera cone, the
    // safe glowing, the alarm meter part-way up — all in one frame.
    game.thief.x = 620;
    game.thief.y = 452;
    game.thief.faceAngle = -Math.PI / 2;
    game.guards[0].x = 680; game.guards[0].y = 300; game.guards[0].angle = Math.PI / 2;
    game.guards[1].x = 980; game.guards[1].y = 320; game.guards[1].angle = Math.PI;
    game.guards[2].x = 900; game.guards[2].y = 580; game.guards[2].angle = 0;
    game.cameras[1].angle = Math.PI / 2 + 0.5;
    game.alarm = 45;
    game.loot = 115;
    game.coinsValue = 115;
    game.elapsed = 96;
    game.coins[3].taken = true;
    game.coins[4].taken = true;
  } else if (shot === 'alarm') {
    // A tense near-miss: the thief caught in a guard's cone, alarm high.
    game.thief.x = 740;
    game.thief.y = 450;
    game.guards[0].x = 680; game.guards[0].y = 300; game.guards[0].angle = Math.PI / 2;
    game.guards[0].lure = null;
    game.alarm = 78;
    game.spotted = true;
    game.loot = 190;
    game.coinsValue = 190;
    game.elapsed = 141;
    game.objective = 'SPOTTED — break line of sight before the alarm hits 100%!';
  }
  // Freeze the demo frame: guards/cameras hold their placed pose.
  game.state = 'play';
  game.frozen = true;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) applyShot(shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) update(dt);
  else game.time += dt;
  handleScreens();
  drawWorld(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Keep the live status line truthful for screen readers.
const status = document.getElementById('status');
if (status) {
  setInterval(() => {
    status.textContent = `Harbor Lights Heist: ${game.state}. Loot $${game.loot}. Alarm ${Math.round(game.alarm)} percent. ${game.objective}`;
  }, 1000);
}
