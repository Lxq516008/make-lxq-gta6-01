// Solmar Bay — boot, fixed-step loop, screen state machine, menus and save wiring.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createInput, ACTION_PAUSE, ACTION_ENTER, ACTION_MISSION, ACTION_MUTE } from './input.js';
import { createAudio } from './audio.js';
import { createCity, districtAt } from './city.js';
import { createPlayer, updatePlayer } from './player.js';
import { spawnTraffic, spawnParked, updateTraffic } from './traffic.js';
import { spawnPeds, updatePeds } from './pedestrians.js';
import { updatePolice, addWanted } from './police.js';
import { MISSIONS, startMission, updateMission, missionTarget } from './missions.js';
import { toast } from './hud.js';
import { loadSave, writeSave, clearSave } from './save.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261120;

const canvas = document.getElementById('game');
const menu = document.getElementById('menu');
const menuTitle = document.getElementById('menu-title');
const menuBody = document.getElementById('menu-body');
const statusEl = document.getElementById('status');

function buildGame() {
  const rng = createRandom(seed);
  const G = {
    rng, seed, time: 0, screen: 'title',
    city: createCity(rng),
    player: createPlayer(600, 600),
    cars: [], peds: [], particles: [], skids: [], toasts: [],
    mission: null, completedMissions: [], camera: { x: 600, y: 600, zoom: 1 },
    audio: createAudio(), input: createInput(),
    districtName: 'Palma Verde', missionTarget: null, endTimer: 0,
    muted: false,
  };
  G.toast = (m) => toast(G, m);
  G.addWanted = (n, r) => addWanted(G, n, r);
  G.busted = () => {
    if (G.screen !== 'play') return;
    G.screen = 'busted'; G.endTimer = 3;
    G.player.money = Math.max(0, G.player.money - 100);
    G.player.wanted = 0;
    G.audio.busted();
    G.saveGame();
  };
  G.wasted = () => {
    if (G.screen !== 'play') return;
    G.screen = 'wasted'; G.endTimer = 3;
    G.player.money = Math.max(0, G.player.money - 150);
    G.player.health = 100; G.player.wanted = 0;
    G.audio.busted();
    G.saveGame();
  };
  G.saveGame = () => {
    writeSave({ money: G.player.money, completed: G.completedMissions, muted: G.muted });
  };
  spawnTraffic(G, 12);
  spawnParked(G, 10);
  spawnPeds(G, 18);
  return G;
}

const G = buildGame();
const renderer = createRenderer(canvas);
window.__game = G; // debug/testing handle: lets automated checks read live state

// ---- Save / load ----
const saved = loadSave();
if (saved) {
  G.player.money = saved.money || 250;
  G.completedMissions = saved.completed || [];
  G.muted = !!saved.muted;
  G.audio.setMuted(G.muted);
}

function announce(m) { statusEl.textContent = m; }

function showMenu(kind) {
  menu.style.display = 'flex';
  if (kind === 'title') {
    menuTitle.textContent = 'SOLMAR BAY';
    menuBody.innerHTML = `
      <p class="sub">A sun-soaked open-world crime story. Steal cars, outrun the Solmar Bay PD, and work your way up Mara Voss's crew.</p>
      <div class="btns">
        ${saved ? '<button id="btn-continue">Continue</button>' : ''}
        <button id="btn-new">New Game</button>
        <button id="btn-missions">Missions</button>
        <button id="btn-controls">Controls</button>
        <button id="btn-sound">${G.muted ? 'Sound: Off' : 'Sound: On'}</button>
      </div>`;
    const wire = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    wire('btn-continue', () => { startPlay(false); });
    wire('btn-new', () => { startPlay(true); });
    wire('btn-missions', () => showMissions());
    wire('btn-controls', () => showControls());
    wire('btn-sound', () => { G.muted = !G.muted; G.audio.setMuted(G.muted); G.saveGame(); showMenu('title'); });
  } else if (kind === 'pause') {
    menuTitle.textContent = 'PAUSED';
    menuBody.innerHTML = `<p class="sub">Solmar Bay waits for no one — except right now.</p>
      <div class="btns">
        <button id="btn-resume">Resume</button>
        <button id="btn-missions">Missions</button>
        <button id="btn-quit">Save &amp; Quit to Title</button>
      </div>`;
    document.getElementById('btn-resume').addEventListener('click', () => { G.screen = 'play'; hideMenu(); });
    document.getElementById('btn-missions').addEventListener('click', () => showMissions());
    document.getElementById('btn-quit').addEventListener('click', () => { G.saveGame(); G.screen = 'title'; showMenu('title'); });
  }
}
function hideMenu() { menu.style.display = 'none'; }
function showMissions() {
  menuTitle.textContent = 'MISSIONS';
  menuBody.innerHTML = MISSIONS.map((m, i) => {
    const done = G.completedMissions.includes(i);
    return `<div class="mission ${done ? 'done' : ''}"><b>${m.id}. ${m.title}</b> — ${m.giver} · $${m.reward} ${done ? '· DONE' : ''}<br><span>${m.brief}</span></div>`;
  }).join('') + `<div class="btns"><button id="btn-back">Back</button></div>`;
  document.getElementById('btn-back').addEventListener('click', () => showMenu(G.screen === 'play' || G.screen === 'paused' ? 'pause' : 'title'));
}
function showControls() {
  menuTitle.textContent = 'CONTROLS';
  menuBody.innerHTML = `<p class="sub" style="text-align:left;line-height:1.9">
    On foot — WASD / arrows move · Shift run · Space punch · E enter a car<br>
    Driving — W accelerate · S brake/reverse · A/D steer · Space handbrake · E get out<br>
    N start next mission · M mute · Esc / P pause<br>
    Steal cars, dodge the cops, and keep your health above zero.</p>
    <div class="btns"><button id="btn-back">Back</button></div>`;
  document.getElementById('btn-back').addEventListener('click', () => showMenu('title'));
}

function startPlay(fresh) {
  G.audio.unlock();
  if (fresh) {
    G.player = createPlayer(600, 600);
    G.cars = []; G.peds = []; G.particles = []; G.skids = []; G.toasts = [];
    G.mission = null; G.completedMissions = []; G.time = 0;
    G.camera = { x: 600, y: 600, zoom: 1 };
    spawnTraffic(G, 12); spawnParked(G, 10); spawnPeds(G, 18);
    clearSave();
  }
  hideMenu();
  G.screen = 'play';
  if (!G.mission && G.completedMissions.length === 0) startMission(G, 0);
  else if (!G.mission) G.toast('Press N to start your next mission.');
  announce('Playing Solmar Bay.');
}

// ---- Simulation step ----
function step(dt) {
  G.time += dt;
  G.missionTarget = missionTarget(G);
  const acts = G._actions || 0;
  updatePlayer(G, dt, G.input, acts);
  G._actions = 0; // one-shot actions apply to a single step only
  updateTraffic(G, dt);
  updatePeds(G, dt);
  updatePolice(G, dt);
  updateMission(G, dt);
  G.districtName = districtAt(G.player.x, G.player.y);
  // Particles and skids fade.
  for (let i = G.particles.length - 1; i >= 0; i -= 1) {
    const pt = G.particles[i];
    pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    if (pt.life <= 0) G.particles.splice(i, 1);
  }
  for (let i = G.skids.length - 1; i >= 0; i -= 1) {
    G.skids[i].life -= dt;
    if (G.skids[i].life <= 0) G.skids.splice(i, 1);
  }
  for (let i = G.toasts.length - 1; i >= 0; i -= 1) {
    G.toasts[i].life -= dt;
    if (G.toasts[i].life <= 0) G.toasts.splice(i, 1);
  }
  // Camera: smooth follow, zoomed out while driving.
  const targetZoom = G.player.car ? 0.8 : 1;
  G.camera.zoom += (targetZoom - G.camera.zoom) * Math.min(1, dt * 2);
  G.camera.x += (G.player.x - G.camera.x) * Math.min(1, dt * 5);
  G.camera.y += (G.player.y - G.camera.y) * Math.min(1, dt * 5);
  // Health slowly recovers when calm.
  if (G.player.wanted === 0 && G.player.health > 0 && G.player.health < 100) G.player.health = Math.min(100, G.player.health + 1.2 * dt);
  G.audio.update(!!G.player.car, G.player.car ? G.player.car.speed : 0, G.player.wanted);
  // Busted / wasted respawn.
  if ((G.screen === 'busted' || G.screen === 'wasted')) {
    G.endTimer -= dt;
    if (G.endTimer <= 0) {
      const hospital = { x: 600, y: 600 };
      G.player.x = hospital.x; G.player.y = hospital.y;
      G.player.car = null; G.player.onFoot = true;
      G.player.health = 100;
      G.camera.x = hospital.x; G.camera.y = hospital.y;
      G.screen = 'play';
      G.toast('Back on the streets of Solmar Bay.');
    }
  }
}

function handleActions() {
  const actions = G.input.takeActions();
  G._actions = actions;
  if (actions & ACTION_MUTE) {
    G.muted = !G.muted; G.audio.setMuted(G.muted); G.saveGame();
    G.toast(G.muted ? 'Sound off' : 'Sound on');
  }
  if (G.screen === 'title' && actions & ACTION_ENTER) startPlay(false);
  else if (G.screen === 'play' && actions & ACTION_PAUSE) { G.screen = 'paused'; showMenu('pause'); announce('Paused.'); }
  else if (G.screen === 'paused' && actions & ACTION_PAUSE) { G.screen = 'play'; hideMenu(); }
  else if (G.screen === 'play' && actions & ACTION_MISSION) {
    if (!G.mission || !G.mission.active) {
      const next = G.completedMissions.length;
      if (next < MISSIONS.length) startMission(G, next);
      else G.toast('All missions complete — enjoy free roam!');
    } else G.toast('Finish the current mission first.');
  }
}

function runGame() {
  showMenu('title');
  announce('Solmar Bay. Press Enter or choose New Game to start.');
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min((now - last) / 1000, 0.25);
    last = now;
    handleActions();
    if (G.screen === 'play' || G.screen === 'busted' || G.screen === 'wasted') {
      while (acc >= STEP) { step(STEP); acc -= STEP; }
    } else acc = 0;
    renderer.draw(G);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.screen === 'play') { G.screen = 'paused'; showMenu('pause'); }
  });
  requestAnimationFrame(frame);
}

function runShot(name) {
  hideMenu();
  stageShot(G, name);
  // Let the scene settle for half a second of real rules.
  for (let i = 0; i < 30; i += 1) step(STEP);
  G.missionTarget = missionTarget(G);
  let painted = 0;
  function paint() {
    renderer.draw(G);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

if (shot) runShot(shot);
else runGame();
