import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  Code2,
  HelpCircle,
  PlayCircle,
  Terminal,
} from 'lucide-react';
import { MODULES } from '../data/curriculum';
import { ModeId, TopicId } from '../types/learning';
import { SwirlFireBackdrop, SwirlFirePreset } from './SwirlFireBackdrop';

interface TopicMenuViewProps {
  topic: TopicId;
  onBackHome: () => void;
  onSelectMode: (mode: ModeId) => void;
}

const MODES: Array<{
  id: ModeId;
  step: string;
  title: string;
  description: string;
  accent: string;
  firePreset: SwirlFirePreset;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'theory',
    step: '01. Understand',
    title: 'Concepts & Theory',
    description: 'Deep-dive explanations, common pitfalls, comparison tables, and interactive diagrams.',
    accent: 'from-[#160B33] to-[#2B1554]',
    firePreset: 'violet',
    icon: BookOpen,
  },
  {
    id: 'video',
    step: '02. Watch & Listen',
    title: 'Animated Video Lessons',
    description: 'Pick videos by data type or list function with step-by-step animations, voice narration, and checkpoints.',
    accent: 'from-[#230907] to-[#4F160A]',
    firePreset: 'crimson-gold',
    icon: PlayCircle,
  },
  {
    id: 'quiz',
    step: '03. Test',
    title: 'Quizzes & Flashcards',
    description: 'Objective, Rapid Fire (10s), and Subjective quizzes with Mistake Flashcards.',
    accent: 'from-[#2A061A] to-[#520A2E]',
    firePreset: 'rose-amber',
    icon: HelpCircle,
  },
  {
    id: 'game',
    step: '04. Play',
    title: 'Code Continuation Game',
    description: 'Complete missing Python statements and verify output against the runner.',
    accent: 'from-[#021A2E] to-[#053542]',
    firePreset: 'blue-cyan',
    icon: Code2,
  },
  {
    id: 'lab',
    step: '05. Experiment',
    title: 'Code Playground',
    description: 'Edit Python code, run it immediately, and inspect live variable states.',
    accent: 'from-[#04241E] to-[#083B33]',
    firePreset: 'emerald-cyan',
    icon: Terminal,
  },
];

export const TopicMenuView: React.FC<TopicMenuViewProps> = ({
  topic,
  onBackHome,
  onSelectMode,
}) => {
  const mod = MODULES[topic];

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7557F6] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Previous Page</span>
        </button>

        <div className="relative mt-5 overflow-hidden rounded-[24px] border border-[#60A5FA]/35 bg-gradient-to-br from-[#0E1038] via-[#1B1D5C] to-[#101845] p-6 sm:p-8 shadow-sm text-white">
          <SwirlFireBackdrop preset="indigo-gold" opacityClass="opacity-[0.38]" />
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-[0.14em] text-[#7DD3FC]">
              {mod.number}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              {mod.title}
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#E2E8F0]">
              {mod.description}
            </p>
          </div>
        </div>
      </div>

      <section aria-labelledby="modes-heading" className="space-y-4">
        <div>
          <h2 id="modes-heading" className="text-xl font-bold text-[#29243B]">
            Choose How You Want to Learn
          </h2>
          <p className="mt-1 text-xs text-[#6B6482]">
            Five interactive modes built around {mod.title.toLowerCase()}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSelectMode(mode.id)}
                className={`group relative overflow-hidden flex min-h-[164px] flex-col justify-between rounded-[20px] border border-white/15 bg-gradient-to-br ${mode.accent} p-6 text-left text-white shadow-md transition-transform duration-200 hover:-translate-y-1`}
              >
                <SwirlFireBackdrop preset={mode.firePreset} opacityClass="opacity-[0.42]" />
                <div className="relative z-10 flex w-full items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-[#FDE047]">
                    {mode.step}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-xs">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>

                <div className="relative z-10 mt-4">
                  <h3 className="text-lg font-extrabold text-white">{mode.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/85">
                    {mode.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
