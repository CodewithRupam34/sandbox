import React, { useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  ArrowLeft,
  Flame,
  RotateCw,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { MistakeFlashcard } from '../types/learning';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';

export type FlashcardThemeId =
  | 'green-cyan-fire'
  | 'rengoku-fire'
  | 'cobalt-violet-fire'
  | 'rose-amber-fire'
  | 'lime-teal-fire'
  | 'magenta-cyan-fire';

interface ThemeConfig {
  id: FlashcardThemeId;
  label: string;
  swatch: string;
  baseBg: string;
  borderGlow: string;
  accentText: string;
  chipBg: string;
  fireFilter: string;
  emberColors: [string, string, string];
  flameGradientA: string;
  flameGradientB: string;
  flameSideGlow: string;
  buttonBg: string;
}

const FLASHCARD_THEMES: ThemeConfig[] = [
  {
    id: 'green-cyan-fire',
    label: 'Midoriya Green & Cyan',
    swatch: 'from-[#10B981] to-[#22D3EE]',
    baseBg: 'from-[#021A17] via-[#053830] to-[#062C42]',
    borderGlow: 'border-[#22D3EE]/60 shadow-[0_20px_54px_rgba(16,185,129,0.34)]',
    accentText: 'text-[#5EEAD4]',
    chipBg: 'bg-[#10B981]/25 border-[#22D3EE]/50 text-[#A7F3D0]',
    fireFilter: 'hue-rotate(135deg) saturate(1.65)',
    emberColors: ['#22C55E', '#22D3EE', '#6EE7B7'],
    flameGradientA:
      'radial-gradient(ellipse at 22% 100%, rgba(16,185,129,0.78) 0%, rgba(52,211,153,0.42) 42%, transparent 76%)',
    flameGradientB:
      'radial-gradient(ellipse at 78% 96%, rgba(34,211,238,0.78) 0%, rgba(6,182,212,0.42) 44%, transparent 74%)',
    flameSideGlow:
      'conic-gradient(from 180deg at 50% 90%, rgba(16,185,129,0.35), rgba(34,211,238,0.38), rgba(16,185,129,0.35))',
    buttonBg: 'from-[#10B981] to-[#06B6D4] text-[#022C22]',
  },
  {
    id: 'rengoku-fire',
    label: 'Crimson & Gold Fire',
    swatch: 'from-[#EF4444] via-[#F97316] to-[#FACC15]',
    baseBg: 'from-[#1F0706] via-[#4A0D0A] to-[#6B1F09]',
    borderGlow: 'border-[#FB923C]/60 shadow-[0_20px_54px_rgba(249,115,22,0.34)]',
    accentText: 'text-[#FDE047]',
    chipBg: 'bg-[#F97316]/25 border-[#FBBF24]/50 text-[#FEF08A]',
    fireFilter: 'hue-rotate(0deg) saturate(1.4)',
    emberColors: ['#FACC15', '#FB923C', '#EF4444'],
    flameGradientA:
      'radial-gradient(ellipse at 24% 100%, rgba(239,68,68,0.82) 0%, rgba(249,115,22,0.45) 44%, transparent 76%)',
    flameGradientB:
      'radial-gradient(ellipse at 76% 95%, rgba(250,204,21,0.72) 0%, rgba(249,115,22,0.42) 45%, transparent 74%)',
    flameSideGlow:
      'conic-gradient(from 180deg at 50% 90%, rgba(239,68,68,0.35), rgba(250,204,21,0.38), rgba(249,115,22,0.35))',
    buttonBg: 'from-[#FACC15] to-[#F97316] text-[#3B0A00]',
  },
  {
    id: 'cobalt-violet-fire',
    label: 'Blue & Violet Fire',
    swatch: 'from-[#2563EB] to-[#A855F7]',
    baseBg: 'from-[#060A2B] via-[#172554] to-[#3B0764]',
    borderGlow: 'border-[#60A5FA]/60 shadow-[0_20px_54px_rgba(59,130,246,0.34)]',
    accentText: 'text-[#93C5FD]',
    chipBg: 'bg-[#3B82F6]/25 border-[#A855F7]/50 text-[#E0E7FF]',
    fireFilter: 'hue-rotate(210deg) saturate(1.7)',
    emberColors: ['#3B82F6', '#C084FC', '#60A5FA'],
    flameGradientA:
      'radial-gradient(ellipse at 22% 98%, rgba(37,99,235,0.82) 0%, rgba(56,189,248,0.4) 44%, transparent 76%)',
    flameGradientB:
      'radial-gradient(ellipse at 78% 94%, rgba(168,85,247,0.78) 0%, rgba(192,132,252,0.38) 44%, transparent 74%)',
    flameSideGlow:
      'conic-gradient(from 180deg at 50% 90%, rgba(37,99,235,0.38), rgba(168,85,247,0.38), rgba(59,130,246,0.35))',
    buttonBg: 'from-[#38BDF8] to-[#A855F7] text-[#08102A]',
  },
  {
    id: 'rose-amber-fire',
    label: 'Sakura & Amber Fire',
    swatch: 'from-[#F43F5E] to-[#F59E0B]',
    baseBg: 'from-[#2A061A] via-[#500724] to-[#581C0C]',
    borderGlow: 'border-[#FB7185]/60 shadow-[0_20px_54px_rgba(244,63,94,0.34)]',
    accentText: 'text-[#FDBA74]',
    chipBg: 'bg-[#F43F5E]/25 border-[#FBBF24]/50 text-[#FFE4E6]',
    fireFilter: 'hue-rotate(315deg) saturate(1.55)',
    emberColors: ['#FB7185', '#FBBF24', '#F472B6'],
    flameGradientA:
      'radial-gradient(ellipse at 24% 98%, rgba(244,63,94,0.8) 0%, rgba(244,114,182,0.42) 44%, transparent 76%)',
    flameGradientB:
      'radial-gradient(ellipse at 78% 94%, rgba(245,158,11,0.75) 0%, rgba(251,146,60,0.4) 44%, transparent 74%)',
    flameSideGlow:
      'conic-gradient(from 180deg at 50% 90%, rgba(244,63,94,0.38), rgba(251,191,36,0.36), rgba(244,63,94,0.35))',
    buttonBg: 'from-[#FB7185] to-[#FBBF24] text-[#3B061A]',
  },
  {
    id: 'lime-teal-fire',
    label: 'Acid Lime & Teal Fire',
    swatch: 'from-[#84CC16] to-[#14B8A6]',
    baseBg: 'from-[#091E08] via-[#133818] to-[#083344]',
    borderGlow: 'border-[#A3E635]/60 shadow-[0_20px_54px_rgba(132,204,22,0.3)]',
    accentText: 'text-[#BEF264]',
    chipBg: 'bg-[#84CC16]/25 border-[#2DD4BF]/50 text-[#ECFCCB]',
    fireFilter: 'hue-rotate(85deg) saturate(1.6)',
    emberColors: ['#A3E635', '#2DD4BF', '#4ADE80'],
    flameGradientA:
      'radial-gradient(ellipse at 22% 98%, rgba(132,204,22,0.78) 0%, rgba(74,222,128,0.4) 44%, transparent 76%)',
    flameGradientB:
      'radial-gradient(ellipse at 78% 94%, rgba(20,184,166,0.78) 0%, rgba(45,212,191,0.4) 44%, transparent 74%)',
    flameSideGlow:
      'conic-gradient(from 180deg at 50% 90%, rgba(132,204,22,0.35), rgba(20,184,166,0.38), rgba(132,204,22,0.35))',
    buttonBg: 'from-[#A3E635] to-[#14B8A6] text-[#052E16]',
  },
  {
    id: 'magenta-cyan-fire',
    label: 'Plasma Pink & Cyan Fire',
    swatch: 'from-[#EC4899] to-[#06B6D4]',
    baseBg: 'from-[#280629] via-[#4A044E] to-[#083344]',
    borderGlow: 'border-[#F472B6]/60 shadow-[0_20px_54px_rgba(236,72,153,0.34)]',
    accentText: 'text-[#67E8F9]',
    chipBg: 'bg-[#EC4899]/25 border-[#22D3EE]/50 text-[#FCE7F3]',
    fireFilter: 'hue-rotate(275deg) saturate(1.65)',
    emberColors: ['#F472B6', '#22D3EE', '#E879F9'],
    flameGradientA:
      'radial-gradient(ellipse at 22% 98%, rgba(236,72,153,0.82) 0%, rgba(232,121,249,0.4) 44%, transparent 76%)',
    flameGradientB:
      'radial-gradient(ellipse at 78% 94%, rgba(6,182,212,0.78) 0%, rgba(34,211,238,0.42) 44%, transparent 74%)',
    flameSideGlow:
      'conic-gradient(from 180deg at 50% 90%, rgba(236,72,153,0.38), rgba(34,211,238,0.38), rgba(236,72,153,0.35))',
    buttonBg: 'from-[#F472B6] to-[#22D3EE] text-[#1E0521]',
  },
];

const EMBER_SEEDS = [
  { left: '8%', size: 6, delay: 0, dur: 2.6, drift: 16 },
  { left: '19%', size: 9, delay: 0.4, dur: 3.1, drift: -18 },
  { left: '32%', size: 6, delay: 0.9, dur: 2.5, drift: 14 },
  { left: '46%', size: 10, delay: 0.2, dur: 3.3, drift: -12 },
  { left: '58%', size: 7, delay: 0.7, dur: 2.8, drift: 20 },
  { left: '72%', size: 8, delay: 0.15, dur: 3.0, drift: -16 },
  { left: '84%', size: 6, delay: 1.0, dur: 2.7, drift: 14 },
  { left: '93%', size: 7, delay: 0.55, dur: 2.9, drift: -12 },
];

export interface StudyFlashcard extends MistakeFlashcard {
  modeLabel?: 'mistake' | 'concept';
  codeSnippet?: string;
}

interface AnimatedFlashcardDeckProps {
  cards: StudyFlashcard[];
  mode: 'mistakes' | 'study';
  onBack: () => void;
  backLabel: string;
  onOpenInPlayground?: (code: string) => void;
}

export const AnimatedFlashcardDeck: React.FC<AnimatedFlashcardDeckProps> = ({
  cards,
  mode,
  onBack,
  backLabel,
  onOpenInPlayground,
}) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<FlashcardThemeId | 'auto'>('auto');

  if (cards.length === 0) return null;

  const safeIdx = Math.min(index, cards.length - 1);
  const card = cards[safeIdx];

  // Each flashcard automatically displays a distinct dual-color fire background
  const activeTheme: ThemeConfig =
    selectedTheme === 'auto'
      ? FLASHCARD_THEMES[safeIdx % FLASHCARD_THEMES.length]
      : FLASHCARD_THEMES.find((t) => t.id === selectedTheme) ?? FLASHCARD_THEMES[0];

  const handleNext = () => {
    if (safeIdx < cards.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (safeIdx > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative overflow-hidden rounded-3xl border border-[#38BDF8]/35 bg-gradient-to-br from-[#061830] via-[#0B2247] to-[#082B36] p-5 sm:p-8 shadow-[0_14px_38px_rgba(14,165,233,0.22)] text-white space-y-6">
        <SwirlFireBackdrop preset="sapphire-gold" opacityClass="opacity-[0.28]" />
        {/* Top bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#7DD3FC] hover:text-white hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{backLabel}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-extrabold text-[#5EEAD4]">
              <Flame className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
              <span>{activeTheme.label}</span>
            </span>
            <span className="font-mono text-xs font-bold text-[#CBD5E1] tabular-nums">
              {mode === 'mistakes' ? 'Mistake' : 'Concept'} {safeIdx + 1} / {cards.length}
            </span>
          </div>
        </div>

        {/* Dual-Fire Theme Switcher Strip */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/15 bg-black/40 px-3.5 py-2.5 backdrop-blur-xs">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#BAE6FD]">
            <Sparkles className="h-3.5 w-3.5 text-[#FDE047]" aria-hidden="true" />
            <span>Dual Fire</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTheme('auto')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                selectedTheme === 'auto'
                  ? 'bg-white text-[#191944] shadow-2xs'
                  : 'bg-black/40 text-white/85 border border-white/15 hover:border-[#7DD3FC]'
              }`}
            >
              Auto Cycle
            </button>
            {FLASHCARD_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedTheme(theme.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  selectedTheme === theme.id
                    ? 'bg-white text-[#191944] shadow-2xs'
                    : 'bg-black/40 text-white/85 border border-white/15 hover:border-[#7DD3FC]'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${theme.swatch}`}
                  aria-hidden="true"
                />
                <span>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Whole Animated Dual-Fire Flashcard */}
        <div className="perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${safeIdx}-${flipped ? 'back' : 'front'}-${activeTheme.id}`}
              initial={{ rotateY: flipped ? -85 : 85, opacity: 0, scale: 0.96 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: flipped ? 85 : -85, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              onClick={() => setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
              aria-label="Flip animated dual-fire flashcard to view theory and supportive example"
              className={`relative min-h-[345px] w-full cursor-pointer overflow-hidden rounded-[26px] border-2 bg-gradient-to-br ${activeTheme.baseBg} ${activeTheme.borderGlow} p-6 sm:p-8 text-white select-none`}
            >
              {/* Swirling Fire Texture Image Color-Shifted Per Card */}
              <motion.img
                src="/assets/aistudio/WhatsApp_Image_2026-11-26_at_2.56.49_PM_0a65ad7e.jpeg"
                alt=""
                referrerPolicy="no-referrer"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-[0.44]"
                style={{ filter: activeTheme.fireFilter }}
                animate={{ scale: [1.04, 1.12, 1.04], rotate: [-1.5, 1.5, -1.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Dual Intertwined Swirling Fire Aura */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-75 blur-2xl"
                style={{ background: activeTheme.flameSideGlow }}
                animate={{
                  rotate: [0, 8, -6, 0],
                  scale: [1, 1.08, 0.98, 1],
                }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Primary Flame Plume (Color A) */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-6 -bottom-10 h-64 blur-xl"
                style={{ background: activeTheme.flameGradientA }}
                animate={{
                  scaleX: [1, 1.15, 0.94, 1],
                  scaleY: [1, 1.24, 0.95, 1],
                  y: [0, -18, 4, 0],
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Secondary Flame Plume (Color B) */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-6 -bottom-8 h-60 blur-xl"
                style={{ background: activeTheme.flameGradientB }}
                animate={{
                  scaleX: [1.06, 0.92, 1.16, 1.06],
                  scaleY: [0.95, 1.26, 1.02, 0.95],
                  y: [4, -22, -2, 4],
                  opacity: [0.8, 1, 0.82],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
              />

              {/* Top Corner Dual Glow */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full blur-2xl"
                style={{
                  background: `radial-gradient(circle, ${activeTheme.emberColors[1]}66 0%, transparent 72%)`,
                }}
                animate={{
                  scale: [1, 1.28, 1],
                  opacity: [0.45, 0.85, 0.45],
                }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Floating Dual-Color Fire Sparks / Embers */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                {EMBER_SEEDS.map((ember, eIdx) => {
                  const color = activeTheme.emberColors[eIdx % activeTheme.emberColors.length];
                  return (
                    <motion.span
                      key={eIdx}
                      className="absolute bottom-2 rounded-full"
                      style={{
                        left: ember.left,
                        width: ember.size,
                        height: ember.size,
                        backgroundColor: color,
                        boxShadow: `0 0 14px 2px ${color}`,
                      }}
                      initial={{ y: 12, opacity: 0, scale: 0.6 }}
                      animate={{
                        y: [-4, -220 - eIdx * 16],
                        x: [0, ember.drift, -ember.drift * 0.5],
                        opacity: [0, 1, 0],
                        scale: [0.6, 1.35, 0.3],
                      }}
                      transition={{
                        duration: ember.dur,
                        repeat: Infinity,
                        delay: ember.delay,
                        ease: 'easeOut',
                      }}
                    />
                  );
                })}
              </div>

              {/* Crisp Card Content */}
              {!flipped ? (
                <div className="relative z-10 flex min-h-[280px] flex-col justify-between gap-5">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${activeTheme.chipBg}`}
                      >
                        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{card.subtopic}</span>
                      </span>
                      <span className={`text-xs font-bold ${activeTheme.accentText}`}>
                        Tap card to reveal Theory &amp; Example
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black leading-snug text-white drop-shadow-sm">
                      {card.questionText}
                    </h3>

                    {card.codeSnippet && (
                      <pre className="overflow-x-auto rounded-2xl border border-white/15 bg-black/50 p-4 font-mono text-xs text-[#A5F3FC] backdrop-blur-md">
                        <code>{card.codeSnippet}</code>
                      </pre>
                    )}

                    {mode === 'mistakes' ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                        <div className="rounded-2xl border border-[#FB7185]/45 bg-[#4C0519]/80 p-4 text-xs backdrop-blur-md">
                          <p className="font-extrabold uppercase tracking-wider text-[#FDA4AF]">
                            Your Answer
                          </p>
                          <p className="mt-1.5 font-mono text-sm font-bold text-white break-words">
                            {card.yourAnswer}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#34D399]/45 bg-[#022C22]/80 p-4 text-xs backdrop-blur-md">
                          <p className="font-extrabold uppercase tracking-wider text-[#6EE7B7]">
                            Correct Answer
                          </p>
                          <p className="mt-1.5 font-mono text-sm font-bold text-white break-words">
                            {card.correctAnswer}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/20 bg-black/45 p-4 text-xs backdrop-blur-md">
                        <p className={`font-extrabold uppercase tracking-wider ${activeTheme.accentText}`}>
                          Key Answer Preview
                        </p>
                        <p className="mt-1.5 font-mono text-sm font-bold text-white">
                          {card.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 text-xs font-extrabold text-white/95">
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Tap or press Enter to flip for Theory &amp; Python Example</span>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex min-h-[280px] flex-col justify-between gap-5">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${activeTheme.chipBg}`}
                      >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Theory &amp; Example · {card.subtopic}</span>
                      </span>
                      <span className={`text-xs font-bold ${activeTheme.accentText}`}>
                        Tap card to flip back
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-black/45 p-4 backdrop-blur-md">
                      <p className="text-sm sm:text-base font-medium leading-relaxed text-white/95">
                        {card.theoryExplanation}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className={`text-[11px] font-extrabold uppercase tracking-wider ${activeTheme.accentText}`}>
                        Supportive Python Example
                      </p>
                      <pre className="overflow-x-auto rounded-2xl border border-white/20 bg-black/55 p-4 font-mono text-xs text-[#A5F3FC] backdrop-blur-md">
                        <code>{card.supportiveExample}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {onOpenInPlayground && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInPlayground(card.supportiveExample);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r ${activeTheme.buttonBg} px-4 py-2.5 text-xs font-black shadow-md transition-transform hover:scale-[1.02]`}
                      >
                        <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Try Example in Playground</span>
                      </button>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90">
                      <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Click to return</span>
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            disabled={safeIdx === 0}
            onClick={handlePrev}
            className="rounded-xl border border-white/25 bg-black/40 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-40 hover:border-[#7DD3FC]"
          >
            ← Previous Card
          </button>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#6366F1] px-5 py-2.5 text-xs font-extrabold text-white hover:brightness-110"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{flipped ? 'Show Question Side' : 'Flip for Theory & Example'}</span>
          </button>

          <button
            type="button"
            disabled={safeIdx >= cards.length - 1}
            onClick={handleNext}
            className="rounded-xl border border-white/25 bg-black/40 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-40 hover:border-[#7DD3FC]"
          >
            Next Card →
          </button>
        </div>
      </div>
    </MotionConfig>
  );
};
