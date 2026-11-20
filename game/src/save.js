// Save / load through localStorage: money, completed missions and settings.
import { SAVE_KEY } from './config.js';

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function writeSave(data) {
  try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage off */ }
}

export function clearSave() {
  try { window.localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
