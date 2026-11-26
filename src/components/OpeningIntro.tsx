import React, { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { SandboxHourglassLogo } from './SendBoxIllustrations';

interface OpeningIntroProps {
  onComplete: () => void;
}

// Minimalist horizontal micro-particles trailing strictly along the firing trajectory
const TRAIL_PARTICLES = [
  { startX: '18vw', endX: '27vw', offsetY: -5, delay: 0.28, size: 3 },
  { startX: '31vw', endX: '41vw', offsetY: 4, delay: 0.44, size: 2.5 },
  { startX: '46vw', endX: '58vw', offsetY: -4, delay: 0.62, size: 3 },
  { startX: '63vw', endX: '75vw', offsetY: 5, delay: 0.78, size: 2 },
  { startX: '79vw', endX: '90vw', offsetY: -3, delay: 0.94, size: 2.5 },
];

type ScenePhase = 'firing' | 'logo' | 'fadeOut';

export const OpeningIntro: React.FC<OpeningIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<ScenePhase>('firing');

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const fastDone = window.setTimeout(onComplete, 250);
      return () => window.clearTimeout(fastDone);
    }

    // 1. firing (0 - 1650ms): isolated barrel ignition, sharp muzzle flash, crisp accelerating projectile + minimalist trail
    // 2. logo (1650 - 3650ms): clean reveal of Sandbox hourglass logo + decided subtitle
    // 3. fadeOut (3650 - 4250ms): smooth transition to dashboard
    const tLogo = window.setTimeout(() => setPhase('logo'), 1650);
    const tFadeOut = window.setTimeout(() => setPhase('fadeOut'), 3650);
    const tDone = window.setTimeout(onComplete, 4250);

    return () => {
      window.clearTimeout(tLogo);
      window.clearTimeout(tFadeOut);
      window.clearTimeout(tDone);
    };
  }, [onComplete]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        <motion.div
          aria-label="Sandbox opening animation"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'fadeOut' ? 0 : 1 }}
          transition={{ duration: 0.58, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#06070B] pointer-events-auto"
        >
          {/* Isolated Firing Phase (Zero overlapping elements) */}
          {phase === 'firing' && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center">
              {/* Minimalist Barrel Emitter at Left */}
              <motion.div
                initial={{ opacity: 0.9, scaleX: 1 }}
                animate={{ opacity: [0.9, 1, 0], scaleX: [1, 1, 0.96] }}
                transition={{ duration: 1.05, times: [0, 0.3, 1], ease: 'easeOut' }}
                style={{ left: '10vw', willChange: 'transform, opacity' }}
                className="absolute top-1/2 -translate-y-1/2 flex items-center"
              >
                <div className="h-3 w-11 rounded-l-sm rounded-r-[2px] border border-white/25 bg-[#1B1E2B] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                <div className="h-1.5 w-2 bg-[#FDE047]" />
              </motion.div>

              {/* Sharp Muzzle Flash at Barrel Tip */}
              <motion.div
                initial={{ opacity: 0, scale: 0.25 }}
                animate={{ opacity: [0, 1, 0], scale: [0.25, 1.15, 0.4] }}
                transition={{ duration: 0.26, delay: 0.12, ease: 'easeOut' }}
                style={{ left: 'calc(10vw + 48px)', willChange: 'transform, opacity' }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
              >
                {/* Crisp horizontal & vertical flash blades */}
                <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-white to-transparent" />
                <div className="absolute h-10 w-[2px] bg-gradient-to-b from-transparent via-[#FEF08A] to-transparent" />
                <div className="absolute h-3 w-3 rounded-full bg-white shadow-[0_0_14px_3px_#FACC15]" />
              </motion.div>

              {/* Single Crisp Energy Projectile Smoothly Accelerating Forward */}
              <motion.div
                initial={{ x: '0vw', opacity: 0, scaleX: 0.55 }}
                animate={{
                  x: ['0vw', '102vw'],
                  opacity: [0, 1, 1, 1],
                  scaleX: [0.55, 1.35, 1.85],
                }}
                transition={{
                  x: { duration: 1.25, delay: 0.16, ease: [0.58, 0.04, 0.92, 0.42] },
                  opacity: { duration: 0.18, delay: 0.15 },
                  scaleX: { duration: 1.25, delay: 0.16, ease: 'easeIn' },
                }}
                style={{ left: 'calc(10vw + 52px)', willChange: 'transform, opacity' }}
                className="absolute top-1/2 -translate-y-1/2 flex items-center"
              >
                {/* Minimalist tapered tail + razor-sharp projectile head */}
                <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-[#F59E0B]/70 to-[#FEF08A]" />
                <div className="h-[4px] w-10 rounded-full bg-gradient-to-r from-[#FACC15] via-[#FEF9C3] to-white shadow-[0_0_12px_2px_rgba(250,204,21,0.85)]" />
              </motion.div>

              {/* Minimalist Particle Trail (5 crisp sparks strictly along the line) */}
              {TRAIL_PARTICLES.map((p, idx) => (
                <motion.span
                  key={idx}
                  initial={{ x: p.startX, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{
                    x: p.endX,
                    y: p.offsetY,
                    opacity: [0, 0.95, 0],
                    scale: [0.4, 1, 0.2],
                  }}
                  transition={{
                    duration: 0.48,
                    delay: p.delay,
                    ease: 'easeOut',
                  }}
                  style={{
                    width: p.size,
                    height: p.size,
                    willChange: 'transform, opacity',
                  }}
                  className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[#FEF08A] shadow-[0_0_6px_rgba(250,204,21,0.9)]"
                />
              ))}
            </div>
          )}

          {/* Final Reveal: Clean Logo + Decided Subtitle (Zero overlap with firing phase) */}
          {phase !== 'firing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col items-center text-center pointer-events-none px-4"
            >
              <motion.div
                animate={{
                  x: [-4, 4, -4, 4, -2, 2, 0],
                  rotate: [-2.5, 2.5, -2.5, 2.5, -1, 1, 0],
                }}
                transition={{
                  duration: 0.65,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <SandboxHourglassLogo
                  className="h-24 w-38 sm:h-28 sm:w-44 drop-shadow-[0_0_24px_rgba(253,224,71,0.8)]"
                  variant="golden"
                />
              </motion.div>

              <span className="mt-1 bg-gradient-to-r from-[#FEF9C3] via-[#FACC15] to-[#F59E0B] bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
                Sandbox
              </span>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="mt-5 text-base sm:text-lg font-extrabold tracking-wide text-[#FEF08A]"
              >
                Let&apos;s fill the box with ideas.
              </motion.p>
            </motion.div>
          )}

          {/* Subtle Skip Button */}
          <button
            type="button"
            onClick={onComplete}
            className="fixed bottom-5 right-6 z-30 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-extrabold text-white/75 hover:bg-white/15 hover:text-white transition-colors"
          >
            Skip
          </button>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
};
