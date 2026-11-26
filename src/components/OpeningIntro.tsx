import React, { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { SandboxHourglassLogo } from './SendBoxIllustrations';

interface OpeningIntroProps {
  onComplete: () => void;
}

const SWIRL_FIRE_IMG = '/assets/aistudio/WhatsApp_Image_2026-11-26_at_2.56.49_PM_0a65ad7e.jpeg';

// Slender curved flame-spark streaks riding along the wave (not a round cluster)
const WAVE_SPARK_STREAKS = [
  { top: '34%', right: '14%', width: 44, delay: 0.05, dur: 1.05, driftY: -22, rot: -10 },
  { top: '46%', right: '6%', width: 58, delay: 0.22, dur: 1.15, driftY: 16, rot: 7 },
  { top: '56%', right: '18%', width: 38, delay: 0.14, dur: 0.95, driftY: -12, rot: -6 },
  { top: '41%', right: '26%', width: 52, delay: 0.32, dur: 1.1, driftY: 20, rot: 11 },
  { top: '63%', right: '10%', width: 42, delay: 0.4, dur: 1.0, driftY: -16, rot: -8 },
];

export const OpeningIntro: React.FC<OpeningIntroProps> = ({ onComplete }) => {
  // 'revolve': fire wave & sparks revolve smoothly in center (NO Sandbox yet)
  // 'sweepLeft': fire wave surges head-first toward the left; tail glides toward center
  // 'tailCenter': head is off left, tail passes center and clears -> Sandbox emerges in center
  // 'fadeOut': cleanly reveals dashboard
  const [stage, setStage] = useState<'revolve' | 'sweepLeft' | 'tailCenter' | 'fadeOut'>('revolve');

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const fastDone = window.setTimeout(onComplete, 250);
      return () => window.clearTimeout(fastDone);
    }

    const tSweepLeft = window.setTimeout(() => setStage('sweepLeft'), 1900);
    const tTailCenter = window.setTimeout(() => setStage('tailCenter'), 2900);
    const tFadeOut = window.setTimeout(() => setStage('fadeOut'), 4700);
    const tDone = window.setTimeout(onComplete, 5350);

    return () => {
      window.clearTimeout(tSweepLeft);
      window.clearTimeout(tTailCenter);
      window.clearTimeout(tFadeOut);
      window.clearTimeout(tDone);
    };
  }, [onComplete]);

  const isSweepingLeft = stage === 'sweepLeft' || stage === 'tailCenter' || stage === 'fadeOut';
  const showSandbox = stage === 'tailCenter' || stage === 'fadeOut';

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        <motion.div
          aria-label="Sandbox opening animation"
          initial={{ opacity: 1 }}
          animate={{ opacity: stage === 'fadeOut' ? 0 : 1 }}
          transition={{ duration: 0.65, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#040102] pointer-events-auto"
        >
          {/* Pure Black-Ember Canvas so the fire image blends cleanly without a circle frame */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1F0504_0%,#080102_58%,#020001_100%)]"
          />

          {/* Wide Sweeping Fire Wave & Sparks (NOT in a circle) — Head on Left, Wave Tail Trailing Right */}
          <motion.div
            aria-hidden="true"
            initial={{ x: '4vw', opacity: 1 }}
            animate={
              stage === 'revolve'
                ? { x: ['4vw', '-2vw', '4vw'], opacity: 1 }
                : stage === 'sweepLeft'
                  ? { x: ['2vw', '-32vw', '-68vw'], opacity: 1 }
                  : { x: '-135vw', opacity: 0 }
            }
            transition={
              stage === 'revolve'
                ? { duration: 1.9, ease: 'easeInOut' }
                : stage === 'sweepLeft'
                  ? { duration: 1.0, ease: [0.42, 0, 0.72, 1] }
                  : { duration: 0.72, ease: 'easeIn' }
            }
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            {/* Outer Revolving Fire Wave Layer (using the fire design itself, flowing & undulating) */}
            <motion.div
              className="relative flex w-[112vw] max-w-[1200px] aspect-[16/9] items-center justify-center"
              animate={{
                rotate: [0, -14, 10, -8, 0],
                scaleX: [1, 1.07, 0.98, 1.05],
                scaleY: [1, 0.93, 1.06, 0.96],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Secondary Revolving Outer Flame Wave (counter-phase using same fire artwork) */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  rotate: [8, -18, 14, -10],
                  y: [-16, 14, -10, 12],
                  scale: [1.06, 1.14, 1.04],
                }}
                transition={{
                  duration: 1.95,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={SWIRL_FIRE_IMG}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{ transform: 'scaleX(-1) rotate(8deg)' }}
                  className="h-full w-full object-contain mix-blend-screen opacity-65 [mask-image:radial-gradient(ellipse_88%_82%_at_50%_50%,black_45%,transparent_98%)]"
                />
              </motion.div>

              {/* Primary Sweeping Fire Wave — Flipped so glowing coiled Head leads Left & Tail sweeps Right */}
              <motion.div
                className="relative h-full w-full"
                animate={{
                  y: [0, -14, 12, -8, 0],
                  rotate: [0, -9, 6, -4, 0],
                }}
                transition={{
                  duration: 1.85,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={SWIRL_FIRE_IMG}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{ transform: 'scaleX(-1)' }}
                  className="h-full w-full object-contain mix-blend-screen opacity-95 [mask-image:radial-gradient(ellipse_90%_84%_at_50%_50%,black_52%,transparent_99%)]"
                />
              </motion.div>

              {/* Sweeping Elongated Flame Sparks Streaming Off the Trailing Wave Tail (NOT a round dot cluster) */}
              {WAVE_SPARK_STREAKS.map((spark, idx) => (
                <motion.span
                  key={idx}
                  className="absolute rounded-full bg-gradient-to-r from-transparent via-[#FDE047] to-[#FB923C]"
                  style={{
                    top: spark.top,
                    right: spark.right,
                    width: spark.width,
                    height: 2.5,
                    boxShadow: '0 0 10px rgba(251, 146, 60, 0.85)',
                    transform: `rotate(${spark.rot}deg)`,
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scaleX: 0.4 }}
                  animate={{
                    x: isSweepingLeft ? [0, 140, 260] : [0, 75, 130],
                    y: [0, spark.driftY, spark.driftY * 1.4],
                    opacity: [0, 0.95, 0],
                    scaleX: [0.5, 1.25, 0.4],
                  }}
                  transition={{
                    duration: spark.dur,
                    delay: spark.delay,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Residual Tail Flash in Centre right as the Fire Clears Off Left */}
          {stage === 'tailCenter' && (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0.85, scaleX: 1.4, x: '6vw' }}
              animate={{ opacity: 0, scaleX: 0.25, x: '-22vw' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="pointer-events-none absolute h-14 w-[48vw] max-w-[460px] rounded-full bg-gradient-to-r from-transparent via-[#FBBF24]/70 to-transparent blur-md"
            />
          )}

          {/* Sandbox DOES NOT appear at the start — only emerges in Centre once fire head is gone & tail reaches centre */}
          {showSandbox && (
            <motion.div
              initial={{ opacity: 0, scale: 0.45 }}
              animate={{ opacity: 1, scale: [0.45, 1.07, 1] }}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col items-center text-center pointer-events-none px-4"
            >
              {/* ONLY the sand clock icon vibrates to and fro */}
              <motion.div
                animate={{
                  x: [-6, 6, -6, 6, -3, 3, 0],
                  rotate: [-3, 3, -3, 3, -1.5, 1.5, 0],
                }}
                transition={{
                  duration: 0.65,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <SandboxHourglassLogo
                  className="h-24 w-38 sm:h-28 sm:w-44 drop-shadow-[0_0_28px_rgba(253,224,71,0.95)]"
                  variant="golden"
                />
              </motion.div>

              <span className="mt-1 bg-gradient-to-r from-[#FEF9C3] via-[#FACC15] to-[#F59E0B] bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-[0_2px_20px_rgba(250,204,21,0.85)] sm:text-5xl">
                Sandbox
              </span>
            </motion.div>
          )}

          {/* Lower Subtitle — appears cleanly with the tail/Sandbox reveal */}
          {showSandbox && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="fixed bottom-14 inset-x-0 z-20 text-center text-base sm:text-lg font-extrabold tracking-wide text-[#FEF08A] drop-shadow-[0_0_14px_rgba(249,115,22,0.9)] px-4 pointer-events-none"
            >
              Let&apos;s fill the box with ideas.
            </motion.p>
          )}

          {/* Subtle Skip Button */}
          <button
            type="button"
            onClick={onComplete}
            className="fixed bottom-5 right-6 z-30 rounded-full border border-[#FDE047]/35 bg-black/55 px-4 py-1.5 text-xs font-extrabold text-[#FEF08A] backdrop-blur-xs hover:bg-black/75 hover:text-white transition-colors"
          >
            Skip
          </button>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
};
