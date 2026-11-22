// Harbor Lights Heist — hand-in program (Node 22, standard library only).
//
// This file is the entrypoint make.fun runs in a fresh container with no
// network. It gathers this repository's game/ and screenshots/ into the
// output directory and writes dossier.json with the vendored make.fun
// library, so the sealed scorer can check the entry and the judge can
// read it. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The game itself is plain static files under game/: index.html plus
// vanilla ES modules, no build step and no network request at run time.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Sanity-check the entry before copying anything: the game must exist,
// and the screenshots folder must hold 3 or 4 images (the gate's range).
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html is missing — nothing to hand in');
}
if (!existsSync(shotsDir)) throw new Error('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((name) => {
  const p = join(shotsDir, name);
  return statSync(p).isFile() && /\.(png|jpe?g)$/i.test(name);
});
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

// Gate caps from the competition rules: the dossier text is capped at
// 160 KiB, screenshots at 4 files of 256 KiB each, game/ at 993 entries
// and 48 MiB, and no path under game/ longer than 1000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
