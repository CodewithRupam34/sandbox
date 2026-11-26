import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { GAME_CHALLENGES } from '../data/curriculum';
import { TopicId } from '../types/learning';
import { runPythonCode } from '../utils/pythonRunner';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';

interface CodeGameModeProps {
  topic: TopicId;
  completedGameIds: string[];
  onCompleteGame: (gameId: string, challengeTitle?: string) => void;
}

export const CodeGameMode: React.FC<CodeGameModeProps> = ({
  topic,
  completedGameIds,
  onCompleteGame,
}) => {
  const challenges = GAME_CHALLENGES[topic];
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    passed: boolean;
    actualOutput: string;
    error: string | null;
  } | null>(null);

  const challenge = challenges[challengeIndex];
  const isAlreadyDone = completedGameIds.includes(challenge.id);

  useEffect(() => {
    setChallengeIndex(0);
    setUserInput('');
    setShowHint(false);
    setCheckResult(null);
  }, [topic]);

  const selectChallenge = (idx: number) => {
    setChallengeIndex(idx);
    setUserInput('');
    setShowHint(false);
    setCheckResult(null);
  };

  const buildProgram = (snippet: string): string => {
    const clean = snippet.trim();
    const parts: string[] = [];
    if (challenge.codeBefore.includes('____')) {
      parts.push(challenge.codeBefore.replace('____', clean));
    } else {
      if (challenge.codeBefore) parts.push(challenge.codeBefore);
      if (clean) parts.push(clean);
    }
    if (challenge.codeAfter) parts.push(challenge.codeAfter);
    return parts.join('\n');
  };

  const handleRunCheck = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed) {
      setCheckResult({
        passed: false,
        actualOutput: '',
        error: 'Enter a Python expression or statement before running.',
      });
      return;
    }

    const fullProgram = buildProgram(trimmed);
    const run = runPythonCode(fullProgram);
    const actualOut = run.output.join('\n').trim();
    const normalizedInput = trimmed.replace(/\s+/g, '');
    const matchesAccepted = challenge.acceptedAnswers.some(
      (ans) => ans.replace(/\s+/g, '') === normalizedInput
    );
    const matchesOutput = !run.error && actualOut === challenge.expectedOutput.trim();
    const passed = matchesOutput || (matchesAccepted && !run.error);

    if (passed) {
      onCompleteGame(challenge.id, challenge.title);
    }

    setCheckResult({
      passed,
      actualOutput: actualOut,
      error: run.error,
    });
  };

  const handleTokenClick = (token: string) => {
    if (token.includes('=') || token.includes(':') || (token.includes('(') && token.includes(')'))) {
      setUserInput(token);
    } else {
      setUserInput((prev) => `${prev}${token}`);
    }
    setCheckResult(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Level Selector — Blue-Cyan Swirling Fire */}
      <div className="relative overflow-hidden flex flex-wrap items-center gap-2 rounded-2xl border border-[#22D3EE]/35 bg-gradient-to-br from-[#061830] via-[#0B254B] to-[#082B36] p-2.5 shadow-[0_12px_28px_rgba(14,165,233,0.18)] text-white">
        <SwirlFireBackdrop preset="blue-cyan" opacityClass="opacity-[0.38]" />
        {challenges.map((item, idx) => {
          const active = idx === challengeIndex;
          const solved = completedGameIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectChallenge(idx)}
              className={`relative z-10 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-white text-[#191944] shadow-sm'
                  : 'border border-white/15 bg-black/35 text-white/90 hover:border-[#5EEAD4] hover:text-white'
              }`}
            >
              <span className="font-mono tabular-nums">Challenge {idx + 1}</span>
              {solved && !active && (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" aria-label="Solved" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Challenge Workspace — Emerald-Cyan Swirling Fire */}
      <div className="relative overflow-hidden rounded-[24px] border border-[#34D399]/35 bg-gradient-to-br from-[#04241E] via-[#073B32] to-[#062C42] p-6 sm:p-8 shadow-[0_14px_34px_rgba(16,185,129,0.22)] text-white space-y-6">
        <SwirlFireBackdrop preset="emerald-cyan" opacityClass="opacity-[0.38]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#031B16]/75 via-[#062D27]/35 to-transparent"
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#5EEAD4] tabular-nums">
              Challenge {challengeIndex + 1} of {challenges.length} · +30 pts on solve
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold text-white">
              {challenge.title}
            </h2>
            <p className="mt-2 text-sm text-[#D1FAE5]">{challenge.instruction}</p>
          </div>

          {isAlreadyDone && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/75 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>Solved</span>
            </span>
          )}
        </div>

        {/* Code Lines & Interactive Blank */}
        <form onSubmit={handleRunCheck} className="relative z-10 space-y-4">
          <div className="rounded-2xl border border-white/15 bg-[#120F24]/95 p-4 sm:p-5 space-y-2.5 font-mono text-[13px]">
            {challenge.codeBefore.includes('____') ? (
              <div className="space-y-2">
                {challenge.codeBefore.split('\n').map((line, i) =>
                  line.includes('____') ? (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-[#C7F9EC]">
                      <span>{line.split('____')[0]}</span>
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => {
                          setUserInput(e.target.value);
                          setCheckResult(null);
                        }}
                        placeholder={challenge.placeholder}
                        aria-label="Missing Python code"
                        className="code-input min-w-[180px] flex-1 rounded-lg border border-[#34D399]/60 bg-[#0A0817] px-3 py-1.5 text-[#FFD45C] placeholder:text-[#7D749B] focus:border-[#FFD45C] focus:outline-none"
                      />
                      <span>{line.split('____')[1]}</span>
                    </div>
                  ) : (
                    <div key={i} className="text-[#C7F9EC]">
                      {line}
                    </div>
                  )
                )}
              </div>
            ) : (
              <>
                {challenge.codeBefore && (
                  <pre className="whitespace-pre-wrap text-[#C7F9EC]">{challenge.codeBefore}</pre>
                )}
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    setCheckResult(null);
                  }}
                  placeholder={`Type Python line (e.g. ${challenge.placeholder})`}
                  aria-label="Missing Python line"
                  className="code-input w-full rounded-lg border border-[#34D399]/60 bg-[#0A0817] px-3.5 py-2 text-[#FFD45C] placeholder:text-[#7D749B] focus:border-[#FFD45C] focus:outline-none"
                />
              </>
            )}

            {challenge.codeAfter && (
              <pre className="whitespace-pre-wrap text-[#C7F9EC]">{challenge.codeAfter}</pre>
            )}
          </div>

          {/* Helper Token Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#A7F3D0]">Quick insert:</span>
            {challenge.tokenHints.map((tok) => (
              <button
                key={tok}
                type="button"
                onClick={() => handleTokenClick(tok)}
                className="rounded-lg border border-[#34D399]/35 bg-black/40 px-2.5 py-1 font-mono text-xs font-semibold text-[#6EE7B7] hover:border-[#34D399] hover:bg-black/60 transition-colors"
              >
                {tok}
              </button>
            ))}
          </div>

          {/* Expected Output + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="text-xs text-[#D1FAE5]">
              Target output:{' '}
              <code className="rounded-lg border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[#6EE7B7]">
                {challenge.expectedOutput}
              </code>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowHint((h) => !h)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/35 px-3.5 py-2 text-xs font-semibold text-white hover:border-[#FDE047] transition-colors"
              >
                <Lightbulb className="h-3.5 w-3.5 text-[#FDE047]" aria-hidden="true" />
                <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserInput('');
                  setCheckResult(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/35 px-3.5 py-2 text-xs font-semibold text-white hover:border-white/50 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#22D3EE] px-5 py-2 text-xs font-black text-[#022C22] shadow-sm hover:brightness-110 transition-all"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Check Code</span>
              </button>
            </div>
          </div>
        </form>

        {showHint && (
          <div className="relative z-10 rounded-2xl border border-[#FB923C]/45 bg-[#3D1408]/80 px-4 py-3 text-xs text-[#FFEDD5] backdrop-blur-xs">
            <strong className="text-[#FDE047]">Hint:</strong> {challenge.hint}
          </div>
        )}

        {/* Evaluation Feedback */}
        {checkResult && (
          <div
            className={`relative z-10 rounded-2xl border p-4 space-y-3 backdrop-blur-xs ${
              checkResult.passed
                ? 'border-emerald-400/50 bg-emerald-950/75'
                : 'border-rose-400/50 bg-rose-950/75'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                {checkResult.passed ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span className="text-emerald-100">Solved — Output matches target</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-rose-400" aria-hidden="true" />
                    <span className="text-rose-100">Not quite — Review output below</span>
                  </>
                )}
              </div>

              {checkResult.passed && challengeIndex < challenges.length - 1 && (
                <button
                  type="button"
                  onClick={() => selectChallenge(challengeIndex + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#22D3EE] px-4 py-1.5 text-xs font-black text-[#022C22] shadow-sm hover:brightness-110 transition-all"
                >
                  <span>Next Challenge</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="rounded-xl border border-white/15 bg-black/65 px-3.5 py-2.5 font-mono text-xs">
              {checkResult.error ? (
                <span className="text-[#FF9EAA]">{checkResult.error}</span>
              ) : (
                <span className="text-[#6EE7B7]">
                  Output: {checkResult.actualOutput || '(no output)'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
