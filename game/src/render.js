// Drawing only: the city, cars, people, particles and shadows, seen through a smooth
// follow camera that zooms out a little while driving.
import { BEACH_X, FONT, OCEAN_X, PALETTE, ROADS_X, ROADS_Y, ROAD_W, WORLD } from './config.js';
import { drawHUD } from './hud.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';

function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  // Long afternoon shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-car.w / 2 + 8, -car.h / 2 + 8, car.w, car.h);
  ctx.fillStyle = car.color;
  ctx.fillRect(-car.w / 2, -car.h / 2, car.w, car.h);
  if (car.kind === 'police') {
    ctx.fillStyle = '#2f6fd0';
    ctx.fillRect(-car.w / 2, -car.h / 2, car.w / 2, car.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, -car.h / 2, 8, car.h);
  }
  ctx.fillStyle = '#1c2733';
  ctx.fillRect(-6, -car.h / 2 + 3, 14, car.h - 6); // windshield + roof glass
  ctx.fillStyle = '#e8e4da';
  ctx.fillRect(car.w / 2 - 4, -car.h / 2 + 2, 2, 4);
  ctx.fillRect(car.w / 2 - 4, car.h / 2 - 6, 2, 4);
  if (car.kind === 'target') {
    ctx.fillStyle = '#ffcf3f';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GT', 0, 3);
  }
  if (car.damage > 40) {
    ctx.fillStyle = 'rgba(40,40,40,0.6)';
    ctx.fillRect(-car.w / 2, -car.h / 2, 10, car.h);
  }
  if (car.broken) {
    ctx.fillStyle = 'rgba(120,120,120,0.7)';
    ctx.beginPath(); ctx.arc(-car.w / 2 + 4, 0, 8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPed(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.down > 0) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = p.shirt;
    ctx.fillRect(-10, -5, 20, 10);
    ctx.restore();
    return;
  }
  const bob = Math.sin(time * 10 + p.x) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(3, 5, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.shirt;
  ctx.fillRect(-5, -6 + bob, 10, 12);
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(0, -10 + bob, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(-6, 6, 4, 6); ctx.fillRect(2, 6, 4, 6);
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function draw(G) {
    const W = canvas.width, H = canvas.height;
    const cam = G.camera;
    const zoom = cam.zoom;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1f5f92';
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(zoom, 0, 0, zoom, W / 2 - cam.x * zoom, H / 2 - cam.y * zoom);
    // Ground.
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    // Beach + animated ocean.
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(BEACH_X, 0, OCEAN_X - BEACH_X, WORLD.h);
    ctx.fillStyle = PALETTE.ocean;
    ctx.fillRect(OCEAN_X, 0, WORLD.w - OCEAN_X, WORLD.h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let y = 0; y < WORLD.h; y += 90) {
      const off = Math.sin(G.time * 1.2 + y * 0.05) * 8;
      ctx.fillRect(OCEAN_X + 6 + off, y, 26, 4);
    }
    // Marina docks.
    ctx.fillStyle = '#8a6f4d';
    for (let i = 0; i < 4; i += 1) ctx.fillRect(2920, 300 + i * 420, 130, 14);
    ctx.fillStyle = '#e8e4da';
    for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.ellipse(3010, 330 + i * 420, 16, 8, 0.4, 0, Math.PI * 2); ctx.fill(); }
    // Park.
    const park = G.city.park;
    ctx.fillStyle = PALETTE.park;
    ctx.fillRect(park.x, park.y, park.w, park.h);
    ctx.fillStyle = '#7fb8d9';
    ctx.beginPath(); ctx.ellipse(park.x + 70, park.y + 70, 46, 30, 0, 0, Math.PI * 2); ctx.fill();
    // Roads + sidewalks + centre dashes.
    ctx.fillStyle = PALETTE.sidewalk;
    for (const rx of ROADS_X) ctx.fillRect(rx - ROAD_W / 2 - 14, 0, ROAD_W + 28, WORLD.h);
    for (const ry of ROADS_Y) ctx.fillRect(0, ry - ROAD_W / 2 - 14, WORLD.w, ROAD_W + 28);
    ctx.fillStyle = PALETTE.road;
    for (const rx of ROADS_X) ctx.fillRect(rx - ROAD_W / 2, 0, ROAD_W, WORLD.h);
    for (const ry of ROADS_Y) ctx.fillRect(0, ry - ROAD_W / 2, WORLD.w, ROAD_W);
    ctx.fillStyle = PALETTE.roadLine;
    for (const rx of ROADS_X) for (let y = 0; y < WORLD.h; y += 70) ctx.fillRect(rx - 2, y, 4, 34);
    for (const ry of ROADS_Y) for (let x = 0; x < WORLD.w; x += 70) ctx.fillRect(x, ry - 2, 34, 4);
    // Trees.
    for (const t of G.city.trees) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(t.x + 6, t.y + 6, t.r, t.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.tree;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
    }
    // Buildings: shadow, walls, rooftop, AC units, windows.
    for (const b of G.city.buildings) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(b.x + 10, b.y + 12, b.w, b.h);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = b.tall ? '#6b5a4a' : PALETTE.roof;
      ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, b.h - 16);
      ctx.fillStyle = '#d8d2c2';
      for (let i = 0; i < b.ac; i += 1) ctx.fillRect(b.x + 14 + i * 22, b.y + 14, 14, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let wx = b.x + 12; wx < b.x + b.w - 14; wx += 26) ctx.fillRect(wx, b.y + b.h - 12, 12, 6);
    }
    // Skid marks.
    ctx.strokeStyle = 'rgba(20,20,20,0.45)';
    ctx.lineWidth = 4;
    for (const s of G.skids) { ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); }
    // Mission target ring.
    const target = G.missionTarget;
    if (target && G.mission && G.mission.active) {
      ctx.strokeStyle = '#ffcf3f';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(target.x, target.y, 44 + Math.sin(G.time * 4) * 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffcf3f';
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('▼', target.x, target.y - 52);
    }
    // Cars, peds, player.
    for (const c of G.cars) drawCar(ctx, c);
    for (const p of G.peds) drawPed(ctx, p, G.time);
    const pl = G.player;
    if (pl.onFoot) {
      ctx.save();
      ctx.translate(pl.x, pl.y);
      const bob = pl.moving ? Math.sin(G.time * 12) * 2 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(3, 5, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.rotate(pl.angle);
      ctx.fillStyle = '#2f6fd0';
      ctx.fillRect(-7, -7 + bob, 14, 14);
      ctx.fillStyle = '#e8b98a';
      ctx.beginPath(); ctx.arc(10, 0, 5, 0, Math.PI * 2); ctx.fill();
      if (pl.punching) { ctx.fillStyle = '#e8b98a'; ctx.fillRect(10, -4, 14, 8); }
      ctx.restore();
      // Player ring so the eye finds them.
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, 20, 0, Math.PI * 2); ctx.stroke();
    }
    // Particles.
    for (const pt of G.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
    // HUD in screen space.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawHUD(ctx, G, W, H);
  }
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
  }
  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
