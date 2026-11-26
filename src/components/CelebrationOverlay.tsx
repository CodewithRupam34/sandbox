import React, { useEffect, useMemo } from 'react';
import { Sparkles, Trophy, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { playClappingSound } from '../utils/celebrationSound';

export interface CelebrationPayload {
  id: number;
  title: string;
  subtitle: string;
  badgeText?: string;
}

interface CelebrationOverlayProps {
  celebration: CelebrationPayload | null;
  onClose: () => void;
}

const CONFETTI_COLORS = [
  '#FFD45F',
  '#40DDEB',
  '#7041ED',
  '#FF78A8',
  '#19BCA9',
  '#FF8F5E',
  '#A985FF',
];

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  celebration,
  onClose,
}) => {
  const confettiPieces = useMemo(() => {
    if (!celebration) return [];
    return Array.from({ length: 68 }, (_, idx) => {
      const leftPct = ((idx * 17 + 7) % 98) + 1;
      const drift = ((idx % 9) - 4) * 28;
      const delay = (idx % 12) * 0.065;
      const duration = 2.3 + (idx % 5) * 0.32;
      const size = 8 + (idx % 4) * 3;
      const color = CONFETTI_COLORS[idx % CONFETTI_COLORS.length];
      const isCircle = idx % 4 === 0;
      const rotateEnd = (idx % 2 === 0 ? 1 : -1) * (360 + (idx % 4) * 180);
      return {
        id: `${celebration.id}-${idx}`,
        leftPct,
        drift,
        delay,
        duration,
        size,
        color,
        isCircle,
        rotateEnd,
      };
    });
  }, [celebration]);

  useEffect(() => {
    if (!celebration) return;
    playClappingSound();
    const timer = window.setTimeout(onClose, 4400);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [celebration, onClose]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {celebration && (
          <motion.div
            key={celebration.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#17183e]/45 backdrop-blur-[2px] p-4"
            role="dialog"
            aria-modal="true"
            aria-label={celebration.title}
          >
            {/* Full-screen Confetti Shower */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
              {confettiPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  initial={{
                    y: '-8vh',
                    x: 0,
                    opacity: 1,
                    rotate: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    y: '110vh',
                    x: piece.drift,
                    opacity: [1, 1, 0.9, 0],
                    rotate: piece.rotateEnd,
                    scale: 1,
                  }}
                  transition={{
                    duration: piece.duration,
                    delay: piece.delay,
                    ease: 'easeIn',
                  }}
                  style={{
                    position: 'absolute',
                    left: `${piece.leftPct}%`,
                    top: 0,
                    width: piece.isCircle ? piece.size : piece.size * 1.15,
                    height: piece.isCircle ? piece.size : piece.size * 0.65,
                    backgroundColor: piece.color,
                    borderRadius: piece.isCircle ? '9999px' : '2px',
                  }}
                />
              ))}
            </div>

            {/* Trophy Celebration Card */}
            <motion.div
              initial={{ scale: 0.72, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="relative z-10 w-full max-w-sm rounded-[28px] border-2 border-[#ffd45f] bg-gradient-to-b from-[#1e1a52] via-[#2b2369] to-[#17183e] p-7 text-center text-white shadow-[0_24px_60px_rgba(23,24,62,0.55)]"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close celebration"
                className="absolute right-4 top-4 rounded-full p-1.5 text-[#c0bddc] hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Animated Glowing Trophy */}
              <motion.div
                initial={{ scale: 0.5, rotate: -14 }}
                animate={{
                  scale: [1, 1.12, 1],
                  rotate: [0, -6, 6, 0],
                }}
                transition={{ duration: 0.85, delay: 0.1 }}
                className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#ffe27a] via-[#ffb82e] to-[#f59e0b] text-[#3d2500] shadow-[0_0_40px_rgba(255,212,95,0.65)] ring-4 ring-[#ffd45f]/35"
              >
                <Trophy className="h-12 w-12" aria-hidden="true" />
              </motion.div>

              {celebration.badgeText && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#ffd45f] px-3.5 py-1 text-xs font-black text-[#191944]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{celebration.badgeText}</span>
                </div>
              )}

              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                {celebration.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#dedcf3]">
                {celebration.subtitle}
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-[#40ddeb] to-[#7041ed] px-5 py-2.5 text-xs font-black text-white shadow-md hover:opacity-95 transition-opacity"
              >
                Keep Going →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
};
