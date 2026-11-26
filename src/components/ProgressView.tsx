import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Award, CheckCircle2, RotateCcw } from 'lucide-react';
import { MODULES } from '../data/curriculum';
import { AuthUser, ProgressData, TopicId } from '../types/learning';
import { getWeakSubtopics } from '../utils/progressStorage';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  lessonsCompleted: number;
  challengesSolved: number;
}

interface ProgressViewProps {
  user: AuthUser | null;
  points: number;
  progress: ProgressData;
  onBackHome: () => void;
  onPracticeTopic: (topic: TopicId) => void;
  onResetProgress: () => void;
  onOpenAuth: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  user,
  points,
  progress,
  onBackHome,
  onPracticeTopic,
  onResetProgress,
  onOpenAuth,
}) => {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data: { leaderboard?: LeaderboardEntry[] }) => {
        if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
      })
      .catch(() => {});
  }, [points]);

  const accuracy =
    progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : 0;

  const weakSubtopics = getWeakSubtopics(progress);

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7557F6] hover:text-[#5B3EE0] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Previous Page</span>
        </button>

        <p className="mt-5 text-xs font-bold tracking-[0.16em] uppercase text-[#7557F6]">
          Your Learning Journey
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#29243B] sm:text-4xl">
          Progress &amp; Points
        </h1>
      </div>

      {/* 1. Points & Overall Accuracy — Violet Swirling Fire */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#A855F7]/35 bg-gradient-to-br from-[#160B33] via-[#27114E] to-[#11092B] p-6 sm:p-8 shadow-[0_14px_34px_rgba(124,58,237,0.22)] text-white space-y-5">
        <SwirlFireBackdrop preset="violet" opacityClass="opacity-[0.38]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#13082C]/80 via-[#220E47]/40 to-transparent"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-white tabular-nums">
              {progress.totalAnswered} Questions Answered
            </h2>
            <p className="mt-1 text-sm text-[#DDD6FE] tabular-nums">
              {progress.totalCorrect} correct · {progress.completedLessonIds.length} lessons completed · {progress.completedGameIds.length} challenges solved
            </p>
          </div>

          <div className="flex items-center gap-6 tabular-nums">
            <div className="text-right">
              <span className="font-mono text-2xl font-extrabold text-[#FDE047]">
                {points} pts
              </span>
              <p className="text-xs text-[#DDD6FE]">Total Points</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-bold text-white">
                {accuracy}%
              </span>
              <p className="text-xs text-[#DDD6FE]">Accuracy</p>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 h-2.5 w-full overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuenow={accuracy}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall quiz accuracy"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] via-[#A78BFA] to-[#FF78A8] transition-all duration-300"
            style={{ width: `${accuracy}%` }}
          />
        </div>

        {!user && (
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/45 px-5 py-4 backdrop-blur-xs">
            <p className="text-xs font-semibold text-[#E9E4FF]">
              Progress and points are not saved in guest mode. Sign in or create an account to save your <strong className="text-[#FDE047]">{points} pts</strong> and join the Sandbox leaderboard.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899] px-4 py-2 text-xs font-black text-white hover:brightness-110"
            >
              Create Account
            </button>
          </div>
        )}
      </section>

      {/* 2. Dynamic Learning Activity Bar Graph — Blue-Cyan Swirling Fire */}
      {(() => {
        const jsDay = new Date().getDay(); // 0=Sun, 1=Mon... 6=Sat
        const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const liveScore = Math.min(
          100,
          progress.completedLessonIds.length * 16 +
            progress.completedGameIds.length * 20 +
            progress.totalCorrect * 8 +
            Math.min(20, Math.round(points / 15))
        );

        const bars = dayNames.map((label, idx) => {
          if (idx < todayIdx) {
            return { label, value: 0, status: 'past' as const, note: '0% · No class activity' };
          }
          if (idx > todayIdx) {
            return { label, value: 0, status: 'upcoming' as const, note: 'Day not reached yet' };
          }
          return {
            label,
            value: liveScore,
            status: 'today' as const,
            note: `Today (${label}): ${liveScore}% activity`,
          };
        });

        return (
          <section className="relative overflow-hidden rounded-[24px] border border-[#22D3EE]/35 bg-gradient-to-br from-[#061830] via-[#0D214D] to-[#082A36] p-6 sm:p-7 shadow-[0_14px_34px_rgba(14,165,233,0.22)] text-white space-y-4">
            <SwirlFireBackdrop preset="blue-cyan" opacityClass="opacity-[0.40]" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-white">Learning Activity</h2>
                <p className="mt-0.5 text-xs text-[#BAE6FD]">
                  Past days ({dayNames.slice(0, todayIdx).join(', ') || 'None'}) show 0 activity · Today ({dayNames[todayIdx]}) updates live · Upcoming days stay at 0 until reached
                </p>
              </div>
              <span className="rounded-full border border-[#22D3EE]/40 bg-black/40 px-3 py-1 font-mono text-xs font-bold text-[#67E8F9] tabular-nums">
                Today: {liveScore}%
              </span>
            </div>

            <div className="relative z-10 flex h-44 items-end justify-between gap-2 sm:gap-4 rounded-2xl border border-white/15 bg-black/40 px-4 py-4 backdrop-blur-xs">
              {bars.map((bar) => (
                <div
                  key={bar.label}
                  className="flex flex-1 flex-col items-center justify-end gap-1.5 h-full"
                  title={`${bar.label}: ${bar.note}`}
                >
                  {bar.status === 'today' ? (
                    bar.value === 0 ? (
                      <div className="w-full max-w-[38px] flex-1 flex flex-col items-center justify-end gap-1">
                        <span className="font-mono text-[10px] font-bold text-[#67E8F9] tabular-nums">
                          0%
                        </span>
                        <div className="h-2 w-full rounded-full bg-white/25" />
                      </div>
                    ) : (
                      <div className="w-full max-w-[38px] flex-1 flex flex-col items-center justify-end gap-1">
                        <span className="font-mono text-[10px] font-extrabold text-[#FDE047] tabular-nums">
                          {bar.value}%
                        </span>
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-[#22D3EE] via-[#60A5FA] to-[#A78BFA] shadow-[0_6px_16px_rgba(34,211,238,0.35)] transition-all duration-300"
                          style={{ height: `${Math.max(12, bar.value)}%` }}
                        />
                      </div>
                    )
                  ) : bar.status === 'upcoming' ? (
                    <div className="w-full max-w-[38px] flex-1 flex flex-col items-center justify-end gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#93C5FD]">
                        Soon
                      </span>
                      <div className="h-1.5 w-full rounded-full border border-dashed border-[#60A5FA]/50 bg-white/5" />
                    </div>
                  ) : (
                    <div className="w-full max-w-[38px] flex-1 flex flex-col items-center justify-end gap-1">
                      <span className="font-mono text-[10px] font-bold text-[#94A3B8] tabular-nums">
                        0
                      </span>
                      <div className="h-1.5 w-full rounded-full bg-white/20" />
                    </div>
                  )}
                  <span
                    className={`text-[11px] font-bold ${
                      bar.status === 'today' ? 'text-[#FDE047]' : 'text-[#CBD5E1]'
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* 3 & 4. Module Breakdown — Emerald-Cyan Fire & Rose-Amber Fire */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {(['types', 'lists'] as TopicId[]).map((id) => {
          const stat = progress.moduleStats[id];
          const modAcc =
            stat.answered > 0 ? Math.round((stat.correct / stat.answered) * 100) : 0;
          const isTypes = id === 'types';
          return (
            <div
              key={id}
              className={`relative overflow-hidden flex items-center justify-between gap-4 rounded-[24px] border p-6 shadow-md text-white ${
                isTypes
                  ? 'border-[#34D399]/35 bg-gradient-to-br from-[#04241E] via-[#073B32] to-[#062C42]'
                  : 'border-[#FB7185]/35 bg-gradient-to-br from-[#2A061A] via-[#500724] to-[#581C0C]'
              }`}
            >
              <SwirlFireBackdrop
                preset={isTypes ? 'emerald-cyan' : 'rose-amber'}
                opacityClass="opacity-[0.40]"
              />
              <div className="relative z-10">
                <p
                  className={`text-xs font-extrabold ${
                    isTypes ? 'text-[#5EEAD4]' : 'text-[#FDBA74]'
                  }`}
                >
                  {MODULES[id].number}
                </p>
                <h3 className="mt-1 text-base font-extrabold text-white">
                  {MODULES[id].title}
                </h3>
                <p className="mt-1 text-xs text-white/85 tabular-nums">
                  {stat.answered > 0
                    ? `${stat.correct}/${stat.answered} correct (${modAcc}%)`
                    : 'No quiz questions answered yet'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPracticeTopic(id)}
                className="relative z-10 rounded-xl border border-white/25 bg-black/40 px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap hover:bg-white hover:text-[#191944] transition-colors"
              >
                Practice Quiz
              </button>
            </div>
          );
        })}
      </div>

      {/* 5. Topics to Revise — Crimson-Gold Swirling Fire */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#FB923C]/40 bg-gradient-to-br from-[#230907] via-[#45130B] to-[#26091B] p-6 sm:p-7 shadow-[0_14px_34px_rgba(249,115,22,0.22)] text-white space-y-4">
        <SwirlFireBackdrop preset="crimson-gold" opacityClass="opacity-[0.40]" />
        <h3 className="relative z-10 text-lg font-extrabold text-white">Topics to Revise</h3>

        {progress.totalAnswered === 0 ? (
          <p className="relative z-10 text-sm text-[#FED7AA]">
            Take a Quiz in either module to track your strengths and surface concepts that need extra review.
          </p>
        ) : weakSubtopics.length === 0 ? (
          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-950/75 px-4 py-3 text-sm text-emerald-100 backdrop-blur-xs">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" />
            <span>
              All practiced topics are at 80% accuracy or higher. Keep experimenting in the Playground!
            </span>
          </div>
        ) : (
          <div className="relative z-10 space-y-3">
            {weakSubtopics.map((item) => (
              <div
                key={`${item.topic}-${item.subtopic}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#FB923C]/45 bg-black/45 px-4 py-3.5 backdrop-blur-xs"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#FDE047]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">{item.subtopic}</p>
                    <p className="text-xs text-[#FED7AA] tabular-nums">
                      {MODULES[item.topic].title} · {item.accuracy}% accuracy ({item.wrong} missed)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onPracticeTopic(item.topic)}
                  className="rounded-xl bg-gradient-to-r from-[#F97316] to-[#FBBF24] px-3.5 py-1.5 text-xs font-black text-[#230907] hover:brightness-110 transition-all"
                >
                  Revise Now
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Community Leaderboard & Reset — Indigo-Gold Swirling Fire */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#60A5FA]/35 bg-gradient-to-br from-[#0D1038] via-[#191D5E] to-[#0E1847] p-6 sm:p-7 shadow-[0_14px_34px_rgba(59,130,246,0.2)] text-white space-y-5">
        <SwirlFireBackdrop preset="indigo-gold" opacityClass="opacity-[0.38]" />
        <div className="relative z-10 flex items-center gap-2">
          <Award className="h-5 w-5 text-[#FDE047]" aria-hidden="true" />
          <h3 className="text-lg font-extrabold text-white">Community Leaderboard</h3>
        </div>

        {leaderboard.length === 0 ? (
          <p className="relative z-10 text-xs text-[#C7D2FE]">
            No registered learners yet. Create an account to claim the top spot!
          </p>
        ) : (
          <div className="relative z-10 overflow-x-auto rounded-2xl border border-white/15 bg-black/45 backdrop-blur-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/15 bg-white/10 text-[#BAE6FD]">
                  <th className="px-4 py-3 font-bold">Rank</th>
                  <th className="px-4 py-3 font-bold">Learner</th>
                  <th className="px-4 py-3 font-bold text-right">Lessons</th>
                  <th className="px-4 py-3 font-bold text-right">Challenges</th>
                  <th className="px-4 py-3 font-bold text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#93C5FD] tabular-nums">
                      #{idx + 1}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      {entry.name}
                      {user?.id === entry.id ? ' (You)' : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white/85 tabular-nums">
                      {entry.lessonsCompleted}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white/85 tabular-nums">
                      {entry.challengesSolved}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-[#FDE047] tabular-nums">
                      {entry.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reset Progress */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5">
          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/35 px-4 py-2 text-xs font-semibold text-white/85 hover:border-rose-400 hover:text-rose-300 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Progress</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-rose-200">
                Clear quiz scores and lesson completion history?
              </span>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmingReset(false);
                }}
                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="rounded-xl border border-white/25 bg-black/35 px-3.5 py-1.5 text-xs font-semibold text-white hover:border-white/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
