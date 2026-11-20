// Keyboard input: held keys plus edge-triggered pressed actions consumed once per frame.
export const ACTION_PAUSE = 1;
export const ACTION_ENTER = 2;
export const ACTION_MISSION = 4;
export const ACTION_MUTE = 8;

const KEYMAP = {
  Escape: ACTION_PAUSE, KeyP: ACTION_PAUSE,
  KeyE: ACTION_ENTER, KeyN: ACTION_MISSION, KeyM: ACTION_MUTE,
};

export function createInput() {
  const held = new Set();
  let pressed = 0;
  const down = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) {
      held.add(e.code);
      if (KEYMAP[e.code]) pressed |= KEYMAP[e.code];
    }
  };
  const up = (e) => held.delete(e.code);
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', () => held.clear());
  return {
    held,
    takeActions() { const a = pressed; pressed = 0; return a; },
    axis() {
      let x = 0, y = 0;
      if (held.has('KeyA') || held.has('ArrowLeft')) x -= 1;
      if (held.has('KeyD') || held.has('ArrowRight')) x += 1;
      if (held.has('KeyW') || held.has('ArrowUp')) y -= 1;
      if (held.has('KeyS') || held.has('ArrowDown')) y += 1;
      return { x, y };
    },
    run() { return held.has('ShiftLeft') || held.has('ShiftRight'); },
    punch() { return held.has('Space'); },
  };
}
