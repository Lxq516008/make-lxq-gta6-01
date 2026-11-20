// Solmar Bay — my gta6-01 entry for make.fun.
//
// The game itself is plain static files under game/: index.html plus ES modules, no build
// step, no libraries and no network requests, so any static server can host it. This script
// is the hand-in: it copies game/ and screenshots/ next to this file into the output
// directory (MAKEFUN_OUTPUT_DIR when set, otherwise /output) and writes dossier.json there,
// using the vendored make.fun helper to describe the bundle for the judge.
//
// Try it locally first: `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Caps from the competition gate: at most 4 screenshots of 256 KiB each, at most 993
// files / 48 MiB under game/, and no game/ path longer than 1000 bytes. text_max_bytes is
// the only cap that shapes the dossier bytes; the rest refuse an entry the scorer would.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
