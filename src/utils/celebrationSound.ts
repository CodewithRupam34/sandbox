/**
 * Synthesizes a realistic multi-hand clapping / applause sound + celebratory chime
 * using Web Audio API so completion celebrations always play cleanly offline/online.
 */
export function playClappingSound(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Reusable short white-noise buffer for crisp palm-clap transients
    const bufferSize = Math.floor(ctx.sampleRate * 0.085);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2.6);
      channel[i] = (Math.random() * 2 - 1) * env;
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.45, now);
    masterGain.connect(ctx.destination);

    // 28 staggered claps over ~1.9 seconds (crescendo then natural fade)
    const clapCount = 28;
    for (let i = 0; i < clapCount; i++) {
      const progress = i / clapCount;
      const offset = progress * 1.65 + (Math.random() * 0.07 - 0.035);
      const startTime = Math.max(now, now + offset);

      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950 + Math.random() * 1350, startTime);
      filter.Q.setValueAtTime(1.1 + Math.random() * 0.8, startTime);

      const clapGain = ctx.createGain();
      // Peak intensity in the middle of the applause, tapering naturally at the end
      const arc = progress < 0.2 ? 0.55 + progress * 2 : 1 - Math.max(0, progress - 0.55) * 1.45;
      const peak = Math.max(0.18, Math.min(0.95, arc * (0.65 + Math.random() * 0.35)));
      clapGain.gain.setValueAtTime(0.001, startTime);
      clapGain.gain.linearRampToValueAtTime(peak, startTime + 0.005);
      clapGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

      src.connect(filter);
      filter.connect(clapGain);
      clapGain.connect(masterGain);

      src.start(startTime);
      src.stop(startTime + 0.085);
    }

    // Bright celebratory ascending chime alongside applause
    const chimeNotes = [523.25, 659.25, 783.99, 1046.5];
    chimeNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.09;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 2600);
  } catch {
    // Ignore browser audio errors gracefully
  }
}
