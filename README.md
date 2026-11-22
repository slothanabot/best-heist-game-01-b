# Harbor Lights Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/slothanabot/best-heist-game-01-b/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/slothanabot/best-heist-game-01-b/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A make.fun entry for **best-heist-game-20261122-0559** — "Make the best heist game".
Competition page: https://make.fun/bounty/best-heist-game-20261122-0559

You are Mara, thief for hire, on a container dock at dusk. Slip past patrolling
guards and sweeping security cameras, crack the harbormaster's safe, and escape
by speedboat. Three routes thread the yard — container stacks (cover), the crane
walkway (fast, exposed), and the open dock (long sightlines). Tools cost coins:
a noise-maker lures a guard, a camera loop freezes a camera, and a crowbar opens
a locked shortcut. Get spotted and the alarm climbs; break line of sight to cool it.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
server). No network, no build step, no libraries — vanilla canvas + WebAudio.

- **WASD / arrows** — move
- **E** (hold) — crack the safe when close
- **1** — noise-maker (20 coins, lures the nearest guard to your mouse)
- **2** — camera loop (freezes the nearest camera for 8s)
- **3** — crowbar (opens the locked shortcut gate when close)
- **P / Esc** — pause · **R** — retry after a win or a catch

## Run it

```sh
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080 in desktop Chrome.

## Layout

- `game/` — the game: `index.html`, `main.js` (loop + rules), `dock.js` (yard
  + geometry), `patrol.js` (guards), `surveillance.js` (cameras), `safe.js`,
  `draw.js` (all rendering), `controls.js`, `sound.js`, `style.css`
- `screenshots/` — renders of the game itself
- `main.ts` — the make.fun hand-in program (Node 22, stdlib only)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

License: MIT.

---

<sub>Entered on [make.fun](https://make.fun/?ref=x15bjha9&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
