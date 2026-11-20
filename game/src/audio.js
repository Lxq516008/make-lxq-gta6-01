// All sound is synthesized with WebAudio — no audio files, no network.
export function createAudio() {
  let ctx = null, master = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null, sirenLfo = null;
  let muted = false;
  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 50;
      engineGain = ctx.createGain(); engineGain.gain.value = 0;
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400;
      engineOsc.connect(filt); filt.connect(engineGain); engineGain.connect(master); engineOsc.start();
      sirenOsc = ctx.createOscillator(); sirenOsc.type = 'triangle'; sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain(); sirenGain.gain.value = 0;
      sirenLfo = ctx.createOscillator(); sirenLfo.type = 'sine'; sirenLfo.frequency.value = 0.6;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 250;
      sirenLfo.connect(lfoGain); lfoGain.connect(sirenOsc.frequency);
      sirenOsc.connect(sirenGain); sirenGain.connect(master);
      sirenOsc.start(); sirenLfo.start();
    } catch { return false; }
    return true;
  }
  function blip(freq, dur, type, vol) {
    if (!ensure() || muted) return;
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio is best-effort */ }
  }
  return {
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); },
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; },
    isMuted() { return muted; },
    update(driving, speed, wanted) {
      if (!ctx || muted) return;
      try {
        engineGain.gain.value = driving ? 0.05 + Math.abs(speed) / 560 * 0.09 : 0;
        engineOsc.frequency.value = 45 + Math.abs(speed) * 0.16;
        sirenGain.gain.value = wanted > 0 ? 0.045 : 0;
      } catch { /* ignore */ }
    },
    pickup() { blip(880, 0.12, 'sine', 0.3); setTimeout(() => blip(1320, 0.15, 'sine', 0.3), 90); },
    crash() { blip(70, 0.3, 'square', 0.4); },
    punch() { blip(180, 0.08, 'square', 0.25); },
    jingle() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.3), i * 120)); },
    busted() { [400, 300, 200].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'sawtooth', 0.25), i * 150)); },
  };
}
