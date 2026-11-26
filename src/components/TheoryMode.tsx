import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Play, Terminal } from 'lucide-react';
import { THEORY_LESSONS } from '../data/curriculum';
import { TopicId } from '../types/learning';
import { runPythonCode } from '../utils/pythonRunner';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';

interface TheoryModeProps {
  topic: TopicId;
  completedLessonIds: string[];
  onCompleteLesson: (lessonId: string) => void;
  onOpenInPlayground: (code: string) => void;
}

export const TheoryMode: React.FC<TheoryModeProps> = ({
  topic,
  completedLessonIds,
  onCompleteLesson,
  onOpenInPlayground,
}) => {
  const lessons = THEORY_LESSONS[topic];
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(0);
  const [inlineOutput, setInlineOutput] = useState<string[] | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedNodeIdx(0);
    setInlineOutput(null);
    setInlineError(null);
  }, [topic]);

  const lesson = lessons[activeIndex] ?? lessons[0];
  const selectedNode = lesson.nodes[selectedNodeIdx] ?? lesson.nodes[0];
  const isCompleted = completedLessonIds.includes(lesson.id);

  const handleSelectLesson = (idx: number) => {
    setActiveIndex(idx);
    setSelectedNodeIdx(0);
    setInlineOutput(null);
    setInlineError(null);
  };

  const handleRunInline = () => {
    const res = runPythonCode(lesson.code);
    setInlineOutput(res.output);
    setInlineError(res.error);
    onCompleteLesson(lesson.id);
  };

  return (
    <div className="space-y-6">
      {/* 1. Lesson Step Selector — Indigo-Gold Swirling Fire */}
      <div
        className="relative overflow-hidden flex flex-wrap items-center gap-2 rounded-2xl border border-[#60A5FA]/35 bg-gradient-to-br from-[#0D1038] via-[#191D5E] to-[#0E1847] p-2.5 shadow-[0_12px_30px_rgba(59,130,246,0.18)] text-white"
        role="tablist"
        aria-label="Theory lessons"
      >
        <SwirlFireBackdrop preset="indigo-gold" opacityClass="opacity-[0.38]" />
        {lessons.map((item, idx) => {
          const active = idx === activeIndex;
          const done = completedLessonIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectLesson(idx)}
              className={`relative z-10 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                active
                  ? 'bg-white text-[#191944] shadow-md'
                  : 'bg-black/30 text-white/85 border border-white/10 hover:bg-black/50 hover:text-white'
              }`}
            >
              <span className="font-mono tabular-nums">0{idx + 1}.</span>
              <span>{item.title}</span>
              {done && !active && (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" aria-label="Completed" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Main Lesson Overview & Deep Dive — Violet Swirling Fire */}
      <article className="relative overflow-hidden rounded-[24px] border border-[#A855F7]/35 bg-gradient-to-br from-[#160B33] via-[#27114E] to-[#11092B] p-6 sm:p-8 shadow-[0_14px_34px_rgba(124,58,237,0.22)] text-white space-y-7">
        <SwirlFireBackdrop preset="violet" opacityClass="opacity-[0.38]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#13082C]/80 via-[#220E47]/40 to-transparent"
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#C4B5FD]">
              Lesson {activeIndex + 1} of {lessons.length} · +25 pts upon completion
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-white">
              {lesson.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#E9E4FF]">
              {lesson.summary}
            </p>
          </div>
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>Completed (+25 pts)</span>
            </span>
          )}
        </div>

        {/* Expanded Conceptual Deep Dive */}
        <div className="relative z-10 grid grid-cols-1 gap-5 border-t border-white/15 pt-6 md:grid-cols-2">
          {lesson.deepDive.map((block) => (
            <div
              key={block.heading}
              className="rounded-2xl border border-white/15 bg-black/40 p-5 backdrop-blur-xs space-y-2"
            >
              <h3 className="text-sm font-bold text-[#DDD6FE]">{block.heading}</h3>
              <p className="text-sm leading-relaxed text-white/90">{block.body}</p>
            </div>
          ))}
        </div>

        {/* Common Pitfall Callout */}
        <div className="relative z-10 flex items-start gap-3 rounded-2xl border border-[#FB923C]/45 bg-[#3D1408]/80 px-5 py-4 text-sm backdrop-blur-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FDBA74]" aria-hidden="true" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#FDE047]">
              Common Pitfall
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#FFEDD5]">{lesson.pitfall}</p>
          </div>
        </div>

        {/* Optional Comparison Reference Table */}
        {lesson.comparisonRows && lesson.comparisonRows.length > 0 && (
          <div className="relative z-10 space-y-3 border-t border-white/15 pt-6">
            <h3 className="text-base font-bold text-white">
              {lesson.comparisonTitle ?? 'Quick Comparison'}
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-white/15 bg-black/45 backdrop-blur-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/15 bg-white/10 text-[#DDD6FE]">
                    <th className="px-4 py-3 font-bold">Syntax / Type</th>
                    <th className="px-4 py-3 font-bold">Behavior</th>
                    <th className="px-4 py-3 font-bold">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {lesson.comparisonRows.map((row) => (
                    <tr key={row.label} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono font-bold text-[#C4B5FD]">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 text-white/90">{row.behavior}</td>
                      <td className="px-4 py-3 font-mono text-[#6EE7B7]">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </article>

      {/* 3. Interactive Diagram Stage — Blue & Green-Cyan Swirling Fire */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#22D3EE]/35 bg-gradient-to-br from-[#02192E] via-[#042E3D] to-[#022A22] p-6 sm:p-8 shadow-[0_14px_34px_rgba(6,182,212,0.22)] text-white space-y-4">
        <SwirlFireBackdrop preset="blue-cyan" opacityClass="opacity-[0.40]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#021424]/75 via-[#032634]/35 to-transparent"
        />

        <p className="relative z-10 text-xs font-extrabold uppercase tracking-wider text-[#5EEAD4]">
          {lesson.diagramTitle}
        </p>

        <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {lesson.nodes.map((node, idx) => {
            const selected = idx === selectedNodeIdx;
            return (
              <button
                key={`${lesson.id}-node-${idx}`}
                type="button"
                onClick={() => setSelectedNodeIdx(idx)}
                className={`rounded-2xl border p-4 text-center transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE] ${
                  selected
                    ? 'border-[#22D3EE] bg-white/20 shadow-[0_0_24px_rgba(34,211,238,0.28)]'
                    : 'border-white/15 bg-black/40 hover:border-[#5EEAD4]/60 hover:bg-black/55'
                }`}
              >
                <div className="font-mono text-sm font-bold text-[#67E8F9]">
                  {node.label}
                </div>
                <div className="mt-1.5 text-xs text-[#E2E8F0]">{node.sublabel}</div>
              </button>
            );
          })}
        </div>

        {selectedNode && (
          <div className="relative z-10 rounded-2xl border border-white/15 bg-black/45 px-5 py-4 text-sm backdrop-blur-xs">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="font-bold text-[#5EEAD4]">{selectedNode.pythonType}</span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="font-semibold text-[#BAE6FD]">{selectedNode.mutable}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/95">
              {selectedNode.detail}
            </p>
          </div>
        )}
      </section>

      {/* 4. Example Code & Execution — Emerald-Cyan Swirling Fire */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#34D399]/35 bg-gradient-to-br from-[#04241E] via-[#073B32] to-[#062C42] p-6 sm:p-8 shadow-[0_14px_34px_rgba(16,185,129,0.2)] text-white space-y-4">
        <SwirlFireBackdrop preset="emerald-cyan" opacityClass="opacity-[0.38]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#031B16]/75 via-[#062D27]/35 to-transparent"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-white">Example Code</h3>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRunInline}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#22D3EE] px-4 py-2 text-xs font-black text-[#022C22] whitespace-nowrap shadow-sm hover:brightness-110 transition-all"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Run Example</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenInPlayground(lesson.code);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#34D399]/40 bg-black/40 px-3.5 py-2 text-xs font-bold text-[#6EE7B7] whitespace-nowrap hover:border-[#34D399] hover:bg-black/60 transition-colors"
            >
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit in Playground</span>
            </button>
          </div>
        </div>

        <pre className="relative z-10 overflow-x-auto rounded-2xl border border-white/15 bg-[#120F24]/90 p-4 font-mono text-[13px] leading-relaxed text-[#C7F9EC]">
          <code>{lesson.code}</code>
        </pre>

        {(inlineOutput !== null || inlineError !== null) && (
          <div className="relative z-10 rounded-2xl border border-white/15 bg-black/65 p-4 font-mono text-[13px]">
            <p className="text-xs font-semibold text-[#A7F3D0]">Output</p>
            {inlineError ? (
              <p className="mt-2 text-[#FF9EAA]">{inlineError}</p>
            ) : (
              <pre className="mt-2 whitespace-pre-wrap text-[#6EE7B7]">
                {inlineOutput && inlineOutput.length > 0
                  ? inlineOutput.join('\n')
                  : '(No output printed)'}
              </pre>
            )}
          </div>
        )}

        <p className="relative z-10 text-xs leading-relaxed text-[#D1FAE5]">
          <strong className="text-[#FDE047]">Key takeaway:</strong> {lesson.keyTakeaway}
        </p>

        {/* Lesson Footer Navigation */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-5">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => handleSelectLesson(activeIndex - 1)}
            className="rounded-xl border border-white/25 bg-black/35 px-4 py-2 text-xs font-bold text-white disabled:opacity-40 hover:border-[#6EE7B7] transition-colors"
          >
            Previous Lesson
          </button>
          <button
            type="button"
            onClick={() => {
              onCompleteLesson(lesson.id);
              if (activeIndex < lessons.length - 1) {
                handleSelectLesson(activeIndex + 1);
              }
            }}
            className="rounded-xl bg-gradient-to-r from-[#34D399] to-[#06B6D4] px-4 py-2 text-xs font-black text-[#022C22] hover:brightness-110 transition-all"
          >
            {activeIndex < lessons.length - 1 ? 'Complete & Next (+25 pts)' : 'Complete Lesson (+25 pts)'}
          </button>
        </div>
      </section>
    </div>
  );
};

