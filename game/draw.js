// draw.js — every pixel of Harbor Lights Heist, drawn on one canvas.
// Teal-and-orange dusk palette: dark teal yard, warm sodium lamps,
// rust-orange containers, gold loot, red danger. Safe cover, danger and
// loot are meant to read at a glance, even shrunk to a contact sheet.

import { WORLD_W, WORLD_H, WATER, BOAT, OFFICE } from './dock.js';
import { SAFE_POS } from './safe.js';
import { CONE_RANGE } from './patrol.js';
import { CAM_RANGE } from './surveillance.js';

const TEAL = '#1f7a6e';
const TEAL_DARK = '#155e54';
const RUST = '#c65a2e';
const RUST_DARK = '#9c4522';
const GOLD = '#ffc94d';
const DANGER = '#ff4d4d';

function conePath(ctx, x, y, angle, half, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawWorld(ctx, g) {
  // Solid geometry for line-of-sight checks (guards, cameras).
  const solids = [...g.obstacles];
  if (g.gate.locked) solids.push(g.gate);
  g.solids = solids;
  drawYard(ctx);
  drawWaterAndBoat(ctx, g);
  drawOffice(ctx, g);
  drawContainers(ctx, g);
  drawCrane(ctx);
  drawGate(ctx, g);
  drawCoins(ctx, g);
  drawCameras(ctx, g);
  drawGuards(ctx, g);
  drawSafe(ctx, g);
  drawThief(ctx, g);
  drawHud(ctx, g);
  if (g.state === 'start') drawStart(ctx, g);
  if (g.state === 'paused') drawPaused(ctx);
  if (g.state === 'caught') drawCaught(ctx, g);
  if (g.state === 'win') drawWin(ctx, g);
}

function drawYard(ctx) {
  // Dusk sky gradient above the dock is implied by the floor glow.
  const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  grad.addColorStop(0, '#16323a');
  grad.addColorStop(0.55, '#1d3f46');
  grad.addColorStop(1, '#274b4a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // Concrete slabs and painted lane lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 80; x < WORLD_W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, WORLD_H - 14); ctx.stroke();
  }
  for (let y = 80; y < WORLD_H; y += 80) {
    ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(WORLD_W - 14, y); ctx.stroke();
  }
  // Yellow lane dashes marking the open dock route.
  ctx.fillStyle = 'rgba(255,201,77,0.35)';
  for (let x = 60; x < 900; x += 46) ctx.fillRect(x, 640, 26, 5);
  // Warm lamp glows.
  for (const [lx, ly] of [[300, 60], [760, 60], [1120, 300], [120, 620]]) {
    const glow = ctx.createRadialGradient(lx, ly, 4, lx, ly, 90);
    glow.addColorStop(0, 'rgba(255,170,80,0.35)');
    glow.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 90, ly - 90, 180, 180);
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawWaterAndBoat(ctx, g) {
  ctx.fillStyle = '#0d2b3d';
  ctx.fillRect(WATER.x, WATER.y, WATER.w, WATER.h);
  ctx.strokeStyle = 'rgba(120,200,230,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const wy = WATER.y + 14 + i * 12;
    ctx.beginPath();
    for (let x = WATER.x + 10; x < WATER.x + WATER.w - 10; x += 24) {
      ctx.moveTo(x, wy);
      ctx.quadraticCurveTo(x + 12, wy - 5, x + 24, wy);
    }
    ctx.stroke();
  }
  // The speedboat: white hull, orange stripe, glowing wake.
  ctx.save();
  ctx.translate(BOAT.x, BOAT.y);
  const bob = Math.sin(g.time * 2) * 2;
  ctx.translate(0, bob);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(-30, 8, 46, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2f5f7';
  ctx.beginPath();
  ctx.moveTo(-42, -6); ctx.lineTo(38, -6); ctx.lineTo(48, 6); ctx.lineTo(-38, 12); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = RUST;
  ctx.fillRect(-40, -2, 76, 5);
  ctx.fillStyle = '#123';
  ctx.fillRect(-18, -16, 34, 12);
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(44, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.safe.cracked ? 'GETAWAY BOAT — GO!' : 'GETAWAY BOAT (locked until the safe is cracked)', BOAT.x - 40, WATER.y - 10);
}

function drawOffice(ctx, g) {
  ctx.fillStyle = '#2a4a55';
  ctx.fillRect(OFFICE.x, OFFICE.y, OFFICE.w, OFFICE.h);
  ctx.fillStyle = '#33565f';
  ctx.fillRect(OFFICE.x + 8, OFFICE.y + 8, OFFICE.w - 16, OFFICE.h - 16);
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HARBORMASTER', OFFICE.x + 18, OFFICE.y + 30);
  // Door gap marker.
  ctx.fillStyle = GOLD;
  ctx.fillRect(1085, 178, 70, 4);
}

function drawContainers(ctx, g) {
  for (const o of g.obstacles) {
    if (o.kind === 'wall' || o.kind === 'office') {
      ctx.fillStyle = o.kind === 'office' ? '#3d6b74' : '#0f2a30';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      continue;
    }
    if (o.kind === 'crane') {
      ctx.fillStyle = '#8a6d3b';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      continue;
    }
    if (o.kind === 'gate') continue; // drawn separately
    if (o.kind !== 'container') continue;
    const base = o.hue === 'teal' ? TEAL : RUST;
    const dark = o.hue === 'teal' ? TEAL_DARK : RUST_DARK;
    ctx.fillStyle = base;
    roundRect(ctx, o.x, o.y, o.w, o.h, 4);
    ctx.fill();
    ctx.fillStyle = dark;
    const vertical = o.w < o.h;
    const step = 22;
    if (vertical) {
      for (let y = o.y + 12; y < o.y + o.h - 8; y += step) ctx.fillRect(o.x + 6, y, o.w - 12, 4);
    } else {
      for (let x = o.x + 12; x < o.x + o.w - 8; x += step) ctx.fillRect(x, o.y + 6, 4, o.h - 12);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(o.hue === 'teal' ? 'HL-7' : 'HL-9', o.x + o.w / 2, o.y + o.h / 2 + 4);
  }
}

function drawCrane(ctx) {
  // Crane walkway along the top: the high, exposed route.
  ctx.fillStyle = '#6b5433';
  ctx.fillRect(500, 52, 440, 16);
  ctx.fillStyle = '#8a6d3b';
  for (let x = 510; x < 930; x += 30) ctx.fillRect(x, 52, 14, 16);
  ctx.fillStyle = '#e8d9a0';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  // Label below the walkway: the HUD bar covers the strip above it.
  ctx.fillText('CRANE WALKWAY — fast, no cover', 720, 88);
}

function drawGate(ctx, g) {
  const gate = g.gate;
  if (!gate.locked) {
    ctx.fillStyle = 'rgba(255,201,77,0.5)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('shortcut open', gate.x + 8, gate.y - 8);
    return;
  }
  ctx.fillStyle = '#7a4a12';
  ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
  ctx.fillStyle = GOLD;
  ctx.fillRect(gate.x - 2, gate.y + 44, gate.w + 4, 8);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LOCKED — crowbar [3]', gate.x + 8, gate.y - 8);
}

function drawCoins(ctx, g) {
  for (const c of g.coins) {
    if (c.taken) continue;
    const pulse = 1 + Math.sin(g.time * 4 + c.x) * 0.12;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a67c00';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', 0, 4);
    ctx.restore();
  }
}

function drawCameras(ctx, g) {
  for (const cam of g.cameras) {
    conePath(ctx, cam.x, cam.y, cam.angle, 0.44, CAM_RANGE);
    ctx.fillStyle = cam.frozen > 0 ? 'rgba(80,180,255,0.20)' : 'rgba(255,77,77,0.16)';
    ctx.fill();
    ctx.strokeStyle = cam.frozen > 0 ? 'rgba(80,180,255,0.7)' : 'rgba(255,77,77,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Camera body on its mount.
    ctx.fillStyle = '#222';
    ctx.fillRect(cam.x - 8, cam.y - 8, 16, 16);
    ctx.fillStyle = cam.frozen > 0 ? '#50b4ff' : DANGER;
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(cam.frozen > 0 ? `CAM LOOPED ${Math.ceil(cam.frozen)}s` : 'CAMERA', cam.x + 12, cam.y - 10);
  }
}

function drawGuards(ctx, g) {
  for (const guard of g.guards) {
    const spotting = guard.sees(g.thief, g.solids);
    conePath(ctx, guard.x, guard.y, guard.angle, 0.61, CONE_RANGE);
    ctx.fillStyle = spotting ? 'rgba(255,40,40,0.34)' : 'rgba(255,201,77,0.20)';
    ctx.fill();
    ctx.strokeStyle = spotting ? 'rgba(255,40,40,0.8)' : 'rgba(255,201,77,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Guard: navy uniform, cap, torch dot.
    ctx.fillStyle = '#1c2f4a';
    ctx.beginPath(); ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath(); ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#12233a';
    ctx.fillRect(guard.x - 8, guard.y - 12, 16, 6);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.angle) * 16, guard.y + Math.sin(guard.angle) * 16, 3, 0, Math.PI * 2);
    ctx.fill();
    if (guard.lure) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 22);
    }
    if (spotting) {
      ctx.fillStyle = DANGER;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 22);
    }
  }
}

function drawSafe(ctx, g) {
  const s = g.safe;
  ctx.save();
  ctx.translate(SAFE_POS.x, SAFE_POS.y);
  if (s.cracked) {
    ctx.fillStyle = '#2e8b57';
  } else {
    const glow = 0.5 + Math.sin(g.time * 3) * 0.3;
    ctx.fillStyle = `rgba(255,201,77,${glow})`;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3f4a';
  }
  roundRect(ctx, -26, -26, 52, 52, 6);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Dial.
  ctx.fillStyle = '#d7dee8';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(g.time * 2) * 10, Math.sin(g.time * 2) * 10); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = s.cracked ? '#7dff9e' : GOLD;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  // Label sits below the safe so it never collides with the office title.
  ctx.fillText(s.cracked ? 'SAFE CRACKED — $500!' : 'SAFE — hold E to crack', SAFE_POS.x, SAFE_POS.y + 56);
  if (!s.cracked && s.progress > 0) {
    ctx.fillStyle = '#111';
    ctx.fillRect(SAFE_POS.x - 30, SAFE_POS.y + 32, 60, 8);
    ctx.fillStyle = GOLD;
    ctx.fillRect(SAFE_POS.x - 30, SAFE_POS.y + 32, 60 * s.progress, 8);
  }
}

function drawThief(ctx, g) {
  const t = g.thief;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 10, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Mara: dark hood, teal scarf, facing her move direction.
  ctx.fillStyle = '#20242e';
  ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(t.x, t.y, 7.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = TEAL;
  ctx.beginPath(); ctx.arc(t.x, t.y - 2, 9, Math.PI * 0.15, Math.PI * 0.85); ctx.fill();
  const a = t.faceAngle;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(a) * 15, t.y + Math.sin(a) * 15, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MARA', t.x, t.y - 20);
}

function drawHud(ctx, g) {
  // Top bar.
  ctx.fillStyle = 'rgba(8,20,24,0.85)';
  ctx.fillRect(0, 0, WORLD_W, 46);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HARBOR LIGHTS HEIST', 16, 29);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = GOLD;
  ctx.fillText(`LOOT $${g.loot}`, 250, 29);
  ctx.fillStyle = '#cfe8e2';
  ctx.fillText(`coins ${g.coinsValue}`, 380, 29);
  ctx.fillText(`time ${formatTime(g.elapsed)}`, 500, 29);
  // Tools.
  ctx.fillText(`[1] noise ${g.tools.noise}  [2] cam-loop ${g.tools.loop}  [3] crowbar ${g.tools.crowbar}`, 620, 29);
  // Alarm meter — the big readable bar on the right.
  const ax = 980;
  const aw = 220;
  ctx.fillStyle = '#111';
  ctx.fillRect(ax, 12, aw, 22);
  const frac = Math.max(0, Math.min(1, g.alarm / 100));
  ctx.fillStyle = frac < 0.5 ? '#2ecc71' : frac < 0.8 ? '#ffae00' : DANGER;
  ctx.fillRect(ax, 12, aw * frac, 22);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, 12, aw, 22);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.spotted ? 'SPOTTED!' : `ALARM ${Math.round(g.alarm)}%`, ax + aw / 2, 28);
  // Objective line under the bar.
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(g.objective, 16, 66);
  // Tool hint at the bottom.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '13px sans-serif';
  ctx.fillText('WASD / arrows move · E crack the safe · 1 noise-maker (20 coins) · 2 camera loop · 3 crowbar · P pause', 16, WORLD_H - 12);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6,16,20,0.82)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, WORLD_W / 2, 210);
  ctx.fillStyle = '#fff';
  ctx.font = '19px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, WORLD_W / 2, 270 + i * 32));
}

function drawStart(ctx, g) {
  overlay(ctx, 'HARBOR LIGHTS HEIST', [
    'Dusk on the container docks. You are Mara, thief for hire.',
    'Slip past the guards and their sweeping cameras, crack the',
    'harbormaster\u2019s safe, then escape by speedboat.',
    '',
    'Three routes: container stacks (cover), crane walkway (fast, exposed),',
    'open dock (long sightlines). Tools cost coins: [1] noise-maker lures a',
    'guard, [2] camera loop freezes a camera, [3] crowbar opens a shortcut.',
    'If a cone finds you the alarm climbs — break line of sight to cool it.',
    '',
    'Click or press Enter to start.  WASD / arrows to move, E to crack the safe.',
  ], GOLD);
}

function drawPaused(ctx) {
  overlay(ctx, 'PAUSED', ['Press P or Escape to keep sneaking.'], '#cfe8e2');
}

function drawCaught(ctx, g) {
  overlay(ctx, 'CAUGHT!', [
    `The alarm hit 100% after ${formatTime(g.elapsed)} — the dock crew closed in.`,
    `Loot kept: $${g.loot}.`,
    '',
    'Press R to try the heist again.',
  ], DANGER);
}

function drawWin(ctx, g) {
  overlay(ctx, 'CLEAN GETAWAY!', [
    `Mara cracks the safe, pockets $${g.loot} and vanishes by speedboat.`,
    `Time: ${formatTime(g.elapsed)}   ·   Alarm peaked at ${Math.round(g.alarmPeak)}%.`,
    '',
    'Press R to run the heist again.',
  ], '#7dff9e');
}
