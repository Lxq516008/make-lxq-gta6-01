// Six story missions with original characters. Mara Voss is the fixer who calls the shots;
// the player is Rio Solano, a driver new to Solmar Bay. Each mission is a small state machine.
import { createCar } from './vehicles.js';
import { addWanted, spawnPolice } from './police.js';

export const MISSIONS = [
  { id: 1, title: 'First Wheels', giver: 'Mara Voss', reward: 300,
    brief: 'Mara needs a car. Steal any car and bring it to the Old Harbor garage.',
    type: 'deliver', target: { x: 600, y: 1800, label: 'Old Harbor garage' } },
  { id: 2, title: 'Bay Courier', giver: 'Mara Voss', reward: 450,
    brief: 'Four parcels, four corners of Neon Row. Deliver them all before the timer runs out.',
    type: 'courier', time: 100,
    points: [{ x: 1400, y: 600 }, { x: 1800, y: 1000 }, { x: 1400, y: 200 }, { x: 2200, y: 600 }] },
  { id: 3, title: 'Sunset Taxi', giver: 'Delia Cruz', reward: 400,
    brief: 'Delia runs the Coral cab stand. Pick up two fares and drop them where they ask.',
    type: 'taxi',
    fares: [{ px: 1000, py: 1400, dx: 2200, dy: 1400 }, { px: 1800, py: 1800, dx: 600, dy: 600 }] },
  { id: 4, title: 'Cool Down', giver: 'Mara Voss', reward: 500,
    brief: 'The cops are all over you — 3 stars. Lose the heat and get back to zero, no arrests.',
    type: 'escape' },
  { id: 5, title: 'The Coral GT', giver: 'Tomas Reyes', reward: 700,
    brief: 'A Coral GT is guarded at the Marina. Steal it and bring it to the Palma Verde lockup.',
    type: 'guarded', target: { x: 600, y: 1000, label: 'Palma Verde lockup' }, carAt: { x: 2600, y: 2000 } },
  { id: 6, title: 'The Big Score', giver: 'Mara Voss', reward: 1500,
    brief: 'Finale: lift the Harbor Bank courier van, drop the package at the lighthouse pier, then lose the chase.',
    type: 'finale', target: { x: 2600, y: 2200, label: 'Lighthouse pier' }, carAt: { x: 1000, y: 1800 } },
];

export function missionState(G) { return G.mission; }

export function startMission(G, index) {
  const def = MISSIONS[index];
  if (!def) return false;
  const m = {
    def, index, stage: 0, timer: def.time || 0, active: true, done: false,
    points: def.points ? def.points.map((p) => ({ ...p })) : null,
    fare: 0, pickedUp: false, targetCar: null, phase: 0,
  };
  G.mission = m;
  if (def.type === 'guarded' || def.type === 'finale') {
    const at = def.carAt;
    const car = createCar(at.x, at.y, 0, 'target', G.rng);
    car.color = '#e8c33c';
    G.cars.push(car);
    m.targetCar = car;
    if (def.type === 'guarded') {
      spawnPolice(G); spawnPolice(G);
      G.toast('Guards are watching that car...');
    }
  }
  if (def.type === 'escape') {
    G.player.wanted = 3;
    G.player.lastCrime = G.time;
    spawnPolice(G); spawnPolice(G);
  }
  G.toast(`${def.title} started!`);
  G.audio.pickup();
  return true;
}

export function missionTarget(G) {
  const m = G.mission;
  if (!m || !m.active) return null;
  const d = m.def;
  if (d.type === 'deliver' || d.type === 'guarded') {
    if (d.type === 'guarded' && m.stage === 0) return { x: d.carAt.x, y: d.carAt.y, label: 'Guarded Coral GT' };
    return { x: d.target.x, y: d.target.y, label: d.target.label };
  }
  if (d.type === 'courier' && m.points && m.points.length) return { ...m.points[0], label: `Parcel ${4 - m.points.length + 1} of 4` };
  if (d.type === 'taxi') {
    const f = d.fares[m.fare];
    if (!f) return null;
    return m.pickedUp ? { x: f.dx, y: f.dy, label: 'Drop off the fare' } : { x: f.px, y: f.py, label: 'Pick up the fare' };
  }
  if (d.type === 'escape') return null;
  if (d.type === 'finale') {
    if (m.phase === 0) return { x: d.carAt.x, y: d.carAt.y, label: 'Courier van' };
    if (m.phase === 1) return { x: d.target.x, y: d.target.y, label: d.target.label };
    return null;
  }
  return null;
}

function completeMission(G) {
  const m = G.mission;
  m.active = false; m.done = true;
  G.player.money += m.def.reward;
  G.completedMissions.push(m.index);
  G.toast(`Mission complete! +$${m.def.reward}`);
  G.audio.jingle();
  G.saveGame();
}

function failMission(G, why) {
  const m = G.mission;
  m.active = false;
  G.toast(`Mission failed: ${why}. Press N to retry.`);
}

function near(G, t, r) {
  return t && Math.hypot(G.player.x - t.x, G.player.y - t.y) < r;
}

export function updateMission(G, dt) {
  const m = G.mission;
  if (!m || !m.active) return;
  const d = m.def;
  if (m.timer > 0) {
    m.timer -= dt;
    if (m.timer <= 0) { failMission(G, 'time ran out'); return; }
  }
  if (d.type === 'deliver') {
    if (G.player.car && near(G, d.target, 90)) completeMission(G);
  } else if (d.type === 'courier') {
    const t = m.points[0];
    if (t && near(G, t, 80)) {
      m.points.shift();
      G.player.money += 50;
      G.audio.pickup();
      G.toast(`Parcel delivered! +$50 (${m.points.length} left)`);
      if (!m.points.length) completeMission(G);
    }
  } else if (d.type === 'taxi') {
    const f = d.fares[m.fare];
    if (!f) { completeMission(G); return; }
    if (!m.pickedUp && near(G, { x: f.px, y: f.py }, 80)) {
      m.pickedUp = true; G.toast('Fare picked up — drive to the marker.');
      G.audio.pickup();
    } else if (m.pickedUp && near(G, { x: f.dx, y: f.dy }, 80)) {
      m.fare += 1; m.pickedUp = false;
      G.player.money += 100; G.toast(`Fare paid! +$100`);
      if (m.fare >= d.fares.length) completeMission(G);
    }
  } else if (d.type === 'escape') {
    if (G.player.wanted === 0) completeMission(G);
  } else if (d.type === 'guarded') {
    if (m.stage === 0 && G.player.car === m.targetCar) {
      m.stage = 1;
      addWanted(G, 2, 'Alarm tripped! +2 stars');
      spawnPolice(G);
      G.toast('Alarm tripped! Get to the lockup!');
    } else if (m.stage === 1 && G.player.car === m.targetCar && near(G, d.target, 90)) {
      completeMission(G);
    }
  } else if (d.type === 'finale') {
    if (m.phase === 0 && G.player.car === m.targetCar) {
      m.phase = 1;
      addWanted(G, 2, 'Bank alarm! +2 stars');
      spawnPolice(G); spawnPolice(G);
      G.toast('Package secured — get to the pier!');
    } else if (m.phase === 1 && G.player.car === m.targetCar && near(G, d.target, 90)) {
      m.phase = 2;
      G.toast('Package dropped. Now lose the cops!');
    } else if (m.phase === 2 && G.player.wanted === 0) {
      completeMission(G);
    }
  }
}
