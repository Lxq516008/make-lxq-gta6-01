// HUD: health bar, money, wanted stars, minimap, speed, objective banner and toasts.
import { FONT, PALETTE, ROADS_X, ROADS_Y, WORLD } from './config.js';
import { missionTarget } from './missions.js';

export function toast(G, msg) {
  const text = msg.length > 80 ? msg.slice(0, 77) + '…' : msg;
  G.toasts.push({ text, life: 4 });
  if (G.toasts.length > 4) G.toasts.shift();
}

function star(ctx, x, y, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffd23f' : 'rgba(255,255,255,0.25)';
  ctx.fill();
}

export function drawHUD(ctx, G, W, H) {
  const p = G.player;
  ctx.textBaseline = 'alphabetic';
  // Health + money, top left.
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(12, 12, 220, 64);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`$${p.money}`, 24, 40);
  ctx.fillStyle = '#333';
  ctx.fillRect(24, 50, 160, 12);
  ctx.fillStyle = p.health > 30 ? '#4caf6d' : '#e5484d';
  ctx.fillRect(24, 50, 160 * Math.max(0, p.health / 100), 12);
  ctx.fillStyle = '#fff';
  ctx.font = `12px ${FONT}`;
  ctx.fillText('HEALTH', 188, 60);
  // Wanted stars, top centre-left.
  for (let i = 0; i < 5; i += 1) star(ctx, 260 + i * 30, 32, 12, i < p.wanted);
  // District + objective banner.
  const district = G.districtName || 'Solmar Bay';
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(district, W / 2, 30);
  const m = G.mission;
  if (m && m.active) {
    const t = missionTarget(G);
    ctx.fillStyle = PALETTE.hud;
    const label = `${m.def.title}: ${t ? t.label : (m.def.type === 'escape' ? 'Lose the heat — wanted ' + p.wanted + '/0' : m.def.brief)}`;
    ctx.fillRect(W / 2 - 320, 40, 640, 30);
    ctx.fillStyle = '#ffcf3f';
    ctx.font = `14px ${FONT}`;
    ctx.fillText(label, W / 2, 60);
    if (m.timer > 0) {
      ctx.fillStyle = m.timer < 15 ? '#e5484d' : '#fff';
      ctx.font = `bold 18px ${FONT}`;
      ctx.fillText(`${Math.ceil(m.timer)}s`, W / 2, 90);
    }
  } else if (!m || !m.active) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `13px ${FONT}`;
    const next = G.completedMissions.length < 6 ? `Press N to start mission ${G.completedMissions.length + 1}: ${['First Wheels', 'Bay Courier', 'Sunset Taxi', 'Cool Down', 'The Coral GT', 'The Big Score'][G.completedMissions.length]}` : 'All missions complete — free roam!';
    ctx.fillText(next, W / 2, 58);
  }
  // Speed while driving.
  if (p.car) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(W - 140, H - 64, 128, 52);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 26px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(Math.abs(p.car.speed) * 0.18)}`, W - 44, H - 26);
    ctx.font = `12px ${FONT}`;
    ctx.fillText('km/h', W - 22, H - 26);
    if (p.car.broken) { ctx.fillStyle = '#e5484d'; ctx.fillText('BROKEN', W - 22, H - 44); }
    else if (p.car.damage > 60) { ctx.fillStyle = '#ffcf3f'; ctx.fillText('DAMAGED', W - 22, H - 44); }
  }
  // Minimap, top right.
  const mw = 190, mh = 142, mx = W - mw - 12, my = 12;
  const sx = mw / WORLD.w, sy = mh / WORLD.h;
  ctx.fillStyle = 'rgba(10,14,20,0.8)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = '#2f7fb8';
  ctx.fillRect(mx + 2900 * sx, my, mw - 2900 * sx, mh);
  ctx.fillStyle = '#5d9e4e';
  ctx.fillRect(mx + 1060 * sx, my + 1060 * sy, 280 * sx, 280 * sy);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
  for (const rx of ROADS_X) { ctx.beginPath(); ctx.moveTo(mx + rx * sx, my); ctx.lineTo(mx + rx * sx, my + mh); ctx.stroke(); }
  for (const ry of ROADS_Y) { ctx.beginPath(); ctx.moveTo(mx, my + ry * sy); ctx.lineTo(mx + mw, my + ry * sy); ctx.stroke(); }
  const t = missionTarget(G);
  if (t) {
    ctx.fillStyle = '#ffcf3f';
    ctx.beginPath(); ctx.arc(mx + t.x * sx, my + t.y * sy, 5, 0, Math.PI * 2); ctx.fill();
  }
  for (const c of G.cars) {
    if (c.kind === 'police') { ctx.fillStyle = '#4f8ef7'; ctx.fillRect(mx + c.x * sx - 2, my + c.y * sy - 2, 4, 4); }
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(mx + p.x * sx, my + p.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  // Toasts, bottom left.
  ctx.textAlign = 'left';
  let ty = H - 24;
  for (let i = G.toasts.length - 1; i >= 0; i -= 1) {
    const toastItem = G.toasts[i];
    ctx.fillStyle = `rgba(12,16,22,${Math.min(1, toastItem.life)})`;
    ctx.fillRect(12, ty - 20, ctx.measureText(toastItem.text).width + 24, 26);
    ctx.fillStyle = '#fff';
    ctx.font = `14px ${FONT}`;
    ctx.fillText(toastItem.text, 22, ty);
    ty -= 32;
  }
  // Waypoint arrow at the top of the screen pointing toward the mission target.
  if (t) {
    const dx = t.x - p.x, dy = t.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 120) {
      const a = Math.atan2(dy, dx);
      const ax = W / 2 + Math.cos(a) * 90, ay = 150 + Math.sin(a) * 30;
      ctx.save();
      ctx.translate(ax, ay); ctx.rotate(a);
      ctx.fillStyle = '#ffcf3f';
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.font = `12px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(dist / 10)}m`, ax, ay + 26);
    }
  }
  // Busted / wasted flash.
  if (G.screen === 'busted' || G.screen === 'wasted') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = G.screen === 'busted' ? '#4f8ef7' : '#e5484d';
    ctx.font = `bold 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(G.screen === 'busted' ? 'BUSTED!' : 'WASTED!', W / 2, H / 2 - 10);
    ctx.fillStyle = '#fff';
    ctx.font = `18px ${FONT}`;
    ctx.fillText(G.screen === 'busted' ? 'The Solmar Bay PD took $100. You are back on the street.' : 'You woke up at Coral General Hospital. -$150.', W / 2, H / 2 + 30);
  }
}
