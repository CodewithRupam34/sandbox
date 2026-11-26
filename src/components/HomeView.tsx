import React, { useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Play,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import heroAnimeCoderImg from '../assets/images/hero_anime_coder_1795683794281.jpg';
import heroRengokuFireBgImg from '../assets/images/hero_rengoku_fire_bg_1795683793073.jpg';
import { THEORY_LESSONS } from '../data/curriculum';
import { AuthUser, InterfaceLanguage, ModeId, ProgressData, TopicId } from '../types/learning';
import { t } from '../utils/i18n';
import { MarkBrainLogo } from './MarkBrainLogo';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';
import {
  HeroCodingIllustration,
  QuickAccessGraphic,
  SandboxAchievementBadge,
} from './SendBoxIllustrations';

interface HomeViewProps {
  user: AuthUser | null;
  points: number;
  progress: ProgressData;
  language: InterfaceLanguage;
  searchQuery: string;
  onSelectTopic: (topic: TopicId) => void;
  onSelectTopicMode: (topic: TopicId, mode: ModeId) => void;
  onOpenProgress: () => void;
  onOpenCollaborate: () => void;
  onOpenMark: () => void;
  onOpenAuth: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  points,
  progress,
  language,
  searchQuery,
  onSelectTopic,
  onSelectTopicMode,
  onOpenProgress,
  onOpenCollaborate,
  onOpenMark,
  onOpenAuth,
}) => {
  const [activityView, setActivityView] = useState<'week' | 'topics'>('week');
  const [fireBgError, setFireBgError] = useState(false);
  const [coderImgError, setCoderImgError] = useState(false);

  const accuracy =
    progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : 0;

  const totalLessons = THEORY_LESSONS.types.length + THEORY_LESSONS.lists.length;
  const completedLessonsCount = progress.completedLessonIds.length;
  const practiceCount = progress.totalAnswered + progress.completedGameIds.length;
  const completedItems = completedLessonsCount + progress.completedGameIds.length;
  const totalMilestones = totalLessons + 8;
  const overallPercent = Math.min(
    100,
    Math.round((completedItems / Math.max(1, totalMilestones)) * 100)
  );

  const typesLessonDone = progress.completedLessonIds.filter((id) =>
    id.startsWith('type')
  ).length;
  const listsLessonDone = progress.completedLessonIds.filter((id) =>
    id.startsWith('list')
  ).length;

  const typesPercent = Math.min(
    100,
    Math.round(
      ((typesLessonDone + Math.min(5, progress.moduleStats.types.correct)) /
        (THEORY_LESSONS.types.length + 5)) *
        100
    )
  );
  const listsPercent = Math.min(
    100,
    Math.round(
      ((listsLessonDone + Math.min(5, progress.moduleStats.lists.correct)) /
        (THEORY_LESSONS.lists.length + 5)) *
        100
    )
  );
  const gamesPercent = Math.min(
    100,
    Math.round((progress.completedGameIds.length / 8) * 100)
  );
  const quizPercent = progress.totalAnswered > 0 ? accuracy : 0;

  const userLevel =
    points >= 300 ? 'Python Pro' : points >= 120 ? 'Explorer' : 'Beginner';

  const moduleList: Array<{
    id: string;
    title: string;
    subtitle: string;
    graphic: 'lists' | 'types' | 'lessons' | 'quiz' | 'game' | 'playground';
    searchTags: string;
    onClick: () => void;
  }> = [
    {
      id: 'lists',
      title: t(language, 'pythonLists'),
      subtitle: 'pop, del, index, slicing & copying',
      graphic: 'lists',
      searchTags: 'python lists pop del remove insert slice append indexing',
      onClick: () => onSelectTopic('lists'),
    },
    {
      id: 'types',
      title: t(language, 'dataTypes'),
      subtitle: 'int, float, str, bool, tuple, set, dict',
      graphic: 'types',
      searchTags: 'data types int float str bool tuple set dict variables',
      onClick: () => onSelectTopic('types'),
    },
    {
      id: 'videos',
      title: t(language, 'animatedLessons'),
      subtitle: 'Step-by-step scenes, voice & exam Q&A',
      graphic: 'lessons',
      searchTags: 'animated video lessons audio voice pegasus checkpoints exam questions',
      onClick: () => onSelectTopicMode('lists', 'video'),
    },
    {
      id: 'quiz',
      title: t(language, 'adaptiveQuiz'),
      subtitle: 'Objective, Rapid Fire & Subjective flashcards',
      graphic: 'quiz',
      searchTags: 'quiz objective rapid fire subjective flashcards mistakes',
      onClick: () => onSelectTopicMode('types', 'quiz'),
    },
    {
      id: 'game',
      title: t(language, 'codeGame'),
      subtitle: 'Complete missing Python lines for +30 pts',
      graphic: 'game',
      searchTags: 'code game challenge complete line',
      onClick: () => onSelectTopicMode('lists', 'game'),
    },
    {
      id: 'lab',
      title: `${t(language, 'playground')} & Collab`,
      subtitle: 'Build Python projects or invite friends',
      graphic: 'playground',
      searchTags: 'python playground editor project collaborate invite friends',
      onClick: () => onSelectTopicMode('types', 'lab'),
    },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleModules = normalizedQuery
    ? moduleList.filter((m) =>
        `${m.title} ${m.subtitle} ${m.searchTags}`.toLowerCase().includes(normalizedQuery)
      )
    : moduleList.slice(0, 4);

  // Realistic Weekly Activity: Mon–Wed = 0 (no classes held); Fri–Sun = upcoming if week hasn't reached them yet
  const jsDay = new Date().getDay(); // 0 = Sun, 1 = Mon ... 4 = Thu ... 6 = Sat
  const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const activeSessionBoost = Math.min(35, completedItems * 8 + progress.totalCorrect * 4);
  const baseClassSchedule = [
    { label: 'Mon', base: 0, note: 'No classes held' },
    { label: 'Tue', base: 0, note: 'No classes held' },
    { label: 'Wed', base: 0, note: 'No classes held' },
    { label: 'Thu', base: 64, note: 'Python Data Types & Lists class' },
    { label: 'Fri', base: 72, note: 'Python Lists lab' },
    { label: 'Sat', base: 56, note: 'Weekend practice' },
    { label: 'Sun', base: 84, note: 'Revision & quiz' },
  ];

  const rawWeekBars = baseClassSchedule.map((day, idx) => {
    if (idx <= 2) {
      return { label: day.label, value: 0, status: 'no-class' as const, note: 'No classes held' };
    }
    if (idx > todayIdx) {
      return {
        label: day.label,
        value: 0,
        status: 'upcoming' as const,
        note: 'Upcoming — day has not arrived yet',
      };
    }
    const val = idx === todayIdx ? Math.min(100, day.base + activeSessionBoost) : day.base;
    return {
      label: day.label,
      value: val,
      status: 'active' as const,
      note: idx === todayIdx ? `Today (${day.label}): ${val}% class activity` : `${val}% class activity`,
    };
  });
  const peakWeekVal = Math.max(...rawWeekBars.map((b) => b.value));
  const weekBars = rawWeekBars.map((b) => ({
    ...b,
    isPeak: b.status === 'active' && b.value > 0 && b.value === peakWeekVal,
  }));

  const weeklyCaption =
    todayIdx < 3
      ? 'No classes held Mon–Wed · Classes begin Thursday'
      : todayIdx === 3
      ? 'No classes held Mon–Wed · Today is Thu (active) · Fri–Sun haven’t arrived yet'
      : todayIdx < 6
      ? `No classes held Mon–Wed · Active Thu–${dayNames[todayIdx]} · ${dayNames[todayIdx + 1]}–Sun yet to come`
      : 'No classes held Mon–Wed · Active Thu–Sun completed';

  const topicBars = [
    { label: 'Types', value: Math.max(18, typesPercent), isPeak: typesPercent >= listsPercent, status: 'active' as const, note: `${typesPercent}%` },
    { label: 'Lists', value: Math.max(18, listsPercent), isPeak: listsPercent > typesPercent, status: 'active' as const, note: `${listsPercent}%` },
    { label: 'Videos', value: Math.max(20, Math.min(100, 25 + completedLessonsCount * 12)), isPeak: false, status: 'active' as const, note: `${completedLessonsCount} done` },
    { label: 'Quiz', value: Math.max(18, quizPercent), isPeak: false, status: 'active' as const, note: `${quizPercent}% accuracy` },
    { label: 'Game', value: Math.max(18, gamesPercent), isPeak: false, status: 'active' as const, note: `${gamesPercent}% solved` },
    { label: 'Lab', value: Math.max(22, Math.min(100, points >= 20 ? 65 : 25)), isPeak: false, status: 'active' as const, note: 'Playground' },
    { label: 'XP', value: Math.max(20, Math.min(100, Math.round(points / 3))), isPeak: points >= 150, status: 'active' as const, note: `${points} pts` },
  ];

  const activeBars = activityView === 'week' ? weekBars : topicBars;

  // Concentric radial progress rings — ALL colors start at the exact same 12 o'clock point (0% = 0 arc)
  const ringSpecs = [
    { r: 66, pct: typesPercent, color: '#3B82F6', track: 'rgba(255,255,255,0.14)' },
    { r: 56, pct: listsPercent, color: '#10B981', track: 'rgba(255,255,255,0.12)' },
    { r: 46, pct: gamesPercent, color: '#FBBF24', track: 'rgba(255,255,255,0.10)' },
    { r: 36, pct: quizPercent, color: '#EC4899', track: 'rgba(255,255,255,0.08)' },
  ];

  const badges = [
    {
      kind: 'explorer' as const,
      title: 'Python Explorer',
      unlocked: completedLessonsCount >= 1,
    },
    {
      kind: 'runner' as const,
      title: 'Code Runner',
      unlocked: progress.completedGameIds.length >= 1,
    },
    {
      kind: 'champion' as const,
      title: 'Quiz Champion',
      unlocked: progress.totalCorrect >= 3,
    },
    {
      kind: 'master' as const,
      title: 'Python Master',
      unlocked: points >= 100,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Guest Notice Strip (Preserves Sign-In-Only Persistence Rule) */}
      {!user && (
        <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#34D399]/35 bg-gradient-to-r from-[#04241E] via-[#073B32] to-[#062C42] px-4 py-2.5 shadow-sm text-white">
          <SwirlFireBackdrop preset="emerald-cyan" opacityClass="opacity-[0.30]" />
          <p className="relative z-10 text-xs font-semibold text-[#D1FAE5]">{t(language, 'guestNotice')}</p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="relative z-10 rounded-full bg-gradient-to-r from-[#34D399] to-[#22D3EE] px-4 py-1.5 text-xs font-extrabold text-[#04241E] hover:brightness-110 transition-all whitespace-nowrap"
          >
            {t(language, 'signIn')} / {t(language, 'createAccount')}
          </button>
        </div>
      )}

      {/* Hero Banner with Rengoku-Inspired Flame Aura Background & Anime Developer Illustration */}
      <section className="relative overflow-hidden rounded-[26px] bg-[#160F2E] px-6 py-6 sm:px-8 sm:py-7 shadow-[0_16px_38px_rgba(30,20,70,0.28)]">
        {/* AI-Generated Rengoku-Inspired Flame Background */}
        {!fireBgError && (
          <img
            src={heroRengokuFireBgImg}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={() => setFireBgError(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-95"
          />
        )}

        {/* Measured Contrast Scrim for Crisp Text Readability */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#120D28]/90 via-[#1D1338]/72 to-[#2B1218]/45"
        />

        <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Left Anime-Style Developer Portrait */}
          <div className="lg:col-span-5 flex justify-center">
            {!coderImgError ? (
              <div className="relative w-full max-w-[330px] overflow-hidden rounded-2xl border border-[#FBBF24]/50 bg-[#1B1538] shadow-[0_14px_34px_rgba(0,0,0,0.48)]">
                <img
                  src={heroAnimeCoderImg}
                  alt="Anime developer coding Python on a glowing laptop"
                  referrerPolicy="no-referrer"
                  onError={() => setCoderImgError(true)}
                  className="aspect-[4/3] w-full object-cover object-center"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#160F2E]/40 via-transparent to-transparent"
                />
              </div>
            ) : (
              <div className="w-full max-w-[330px] rounded-2xl bg-[#1E1740]/80 p-3">
                <HeroCodingIllustration className="w-full" />
              </div>
            )}
          </div>

          {/* Right Heading & CTAs over Fire Aura */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-3">
            <p className="text-sm font-bold text-[#FDE68A] sm:text-base">
              {user ? `${t(language, 'heyGreeting')} ${user.name}!` : 'Welcome to'}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[46px] leading-[1.08] drop-shadow-[0_3px_14px_rgba(0,0,0,0.5)]">
              <span className="bg-gradient-to-r from-[#FFF7D6] via-[#FDE047] to-[#FB923C] bg-clip-text text-transparent">
                Sandbox!
              </span>{' '}
              <span aria-hidden="true">🔥</span>
            </h1>
            <p className="max-w-xl text-sm font-semibold text-[#F1ECFF] sm:text-base leading-relaxed">
              Learn. Code. Grow. — Master Python Data Types, Lists, Animated Videos &amp; Live Coding Challenges.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <button
                type="button"
                onClick={() => onSelectTopic('types')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F97316] via-[#EF4444] to-[#DC2626] px-6 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(239,68,68,0.45)] hover:brightness-110 transition-all"
              >
                <span>Start Learning</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onOpenCollaborate}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-xs font-extrabold text-white backdrop-blur-xs hover:bg-white/25 transition-colors"
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t(language, 'inviteFriends')}</span>
              </button>

              <button
                type="button"
                onClick={onOpenMark}
                className="inline-flex items-center gap-2 rounded-full bg-[#19143A]/90 border border-[#A78BFA]/45 px-4 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-[#271F59] transition-colors"
              >
                <MarkBrainLogo className="h-6 w-6" />
                <span>Ask MARK</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Jewel Stat Cards with Swirling Fire (each distinct from the bento cards below) */}
      <section aria-label="Learning Metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Magenta-Pink Fire - Theory Lessons */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#F472B6]/40 bg-gradient-to-br from-[#2B072D] to-[#4A084E] p-4 shadow-[0_12px_28px_rgba(236,72,153,0.2)] text-white">
          <SwirlFireBackdrop preset="magenta-pink" opacityClass="opacity-[0.40]" />
          <div className="relative z-10">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] text-white shadow-xs">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 font-mono text-2xl font-extrabold text-white tabular-nums">
              {completedLessonsCount}
              <span className="text-sm font-bold text-[#FBCFE8]">/{totalLessons}</span>
            </p>
            <p className="text-xs font-bold text-[#FCE7F3]">{t(language, 'theoryLessons')}</p>
            <p className="mt-1.5 text-[11px] font-bold text-[#6EE7B7]">↑ +25 pts per lesson</p>
          </div>
        </div>

        {/* Card 2: Lime-Teal Fire - Practice Sessions */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#A3E635]/40 bg-gradient-to-br from-[#0A220B] to-[#0E3A2D] p-4 shadow-[0_12px_28px_rgba(132,204,22,0.18)] text-white">
          <SwirlFireBackdrop preset="lime-teal" opacityClass="opacity-[0.40]" />
          <div className="relative z-10">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#84CC16] to-[#14B8A6] text-white shadow-xs">
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
            </div>
            <p className="mt-3 font-mono text-2xl font-extrabold text-white tabular-nums">
              {practiceCount}
            </p>
            <p className="text-xs font-bold text-[#ECFCCB]">Practice Sessions</p>
            <p className="mt-1.5 text-[11px] font-bold text-[#67E8F9]">
              ↑ {progress.completedGameIds.length} code games solved
            </p>
          </div>
        </div>

        {/* Card 3: Rose-Amber Fire - Quiz Accuracy */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#FB7185]/40 bg-gradient-to-br from-[#2E071B] to-[#561714] p-4 shadow-[0_12px_28px_rgba(244,63,94,0.2)] text-white">
          <SwirlFireBackdrop preset="rose-amber" opacityClass="opacity-[0.42]" />
          <div className="relative z-10">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#F43F5E] to-[#F59E0B] text-white shadow-xs">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 font-mono text-2xl font-extrabold text-white tabular-nums">
              {accuracy}%
            </p>
            <p className="text-xs font-bold text-[#FFE4E6]">{t(language, 'quizAccuracy')}</p>
            <p className="mt-1.5 text-[11px] font-bold text-[#FDE047]">
              ↑ {progress.totalCorrect} correct answers
            </p>
          </div>
        </div>

        {/* Card 4: Sapphire-Gold Fire - Points & Level */}
        <button
          type="button"
          onClick={onOpenProgress}
          className="relative overflow-hidden rounded-[20px] border border-[#38BDF8]/40 bg-gradient-to-br from-[#061C3D] to-[#0B335E] p-4 text-left shadow-[0_12px_28px_rgba(14,165,233,0.2)] text-white hover:brightness-110 transition-all"
        >
          <SwirlFireBackdrop preset="sapphire-gold" opacityClass="opacity-[0.42]" />
          <div className="relative z-10">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#F59E0B] text-white shadow-xs">
              <Flame className="h-5 w-5 fill-current" aria-hidden="true" />
            </div>
            <p className="mt-3 font-mono text-2xl font-extrabold text-white tabular-nums">
              {points} <span className="text-sm font-bold text-[#BAE6FD]">pts</span>
            </p>
            <p className="text-xs font-bold text-[#E0F2FE]">{t(language, 'yourPoints')}</p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#FDE047]">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              <span>{userLevel}</span>
            </p>
          </div>
        </button>
      </section>

      {/* Middle Bento Row: Your Learning Progress + Recently Studied / Modules */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Your Learning Progress — Distinct Violet-Magenta Swirling Fire + Same-Origin Concentric Chart */}
        <section className="relative lg:col-span-6 overflow-hidden rounded-[22px] border border-[#A855F7]/35 bg-gradient-to-br from-[#160B33] via-[#27114E] to-[#11092B] p-5 sm:p-6 shadow-[0_14px_34px_rgba(124,58,237,0.22)] text-white">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-26_at_2.56.49_PM_0a65ad7e.jpeg"
            alt=""
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-[0.42] [filter:hue-rotate(255deg)_saturate(1.5)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#13082C]/80 via-[#220E47]/45 to-transparent"
          />

          <div className="relative z-10 flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-white">
              Your Learning Progress
            </h2>
            <button
              type="button"
              onClick={onOpenProgress}
              className="text-xs font-extrabold text-[#DDD6FE] hover:text-white hover:underline"
            >
              View Details →
            </button>
          </div>

          <div className="relative z-10 mt-5 flex flex-col items-center gap-6 sm:flex-row">
            {/* Concentric SVG Chart — Every color begins at the exact same 12 o'clock origin */}
            <div className="relative h-44 w-44 shrink-0 grid place-items-center">
              <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden="true">
                {ringSpecs.map((ring) => {
                  const circ = 2 * Math.PI * ring.r;
                  const dash = (Math.max(0, Math.min(100, ring.pct)) / 100) * circ;
                  return (
                    <React.Fragment key={ring.r}>
                      <circle
                        cx="80"
                        cy="80"
                        r={ring.r}
                        fill="none"
                        stroke={ring.track}
                        strokeWidth="7.5"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r={ring.r}
                        fill="none"
                        stroke={ring.color}
                        strokeWidth="7.5"
                        strokeLinecap={ring.pct > 0 ? 'round' : 'butt'}
                        strokeDasharray={`${dash} ${circ}`}
                        strokeDashoffset={0}
                      />
                    </React.Fragment>
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-xl font-extrabold text-white tabular-nums">
                  {overallPercent}%
                </span>
                <span className="text-[10px] font-bold text-[#DDD6FE]">
                  Overall
                </span>
              </div>
            </div>

            {/* Category Progress Rows */}
            <div className="w-full flex-1 space-y-2">
              <button
                type="button"
                onClick={() => onSelectTopic('types')}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-white backdrop-blur-xs hover:bg-black/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" aria-hidden="true" />
                  <span>Python Data Types</span>
                </span>
                <span className="font-mono font-extrabold tabular-nums">{typesPercent}%</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTopic('lists')}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-white backdrop-blur-xs hover:bg-black/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" aria-hidden="true" />
                  <span>Lists &amp; Slicing</span>
                </span>
                <span className="font-mono font-extrabold tabular-nums">{listsPercent}%</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTopicMode('lists', 'game')}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-white backdrop-blur-xs hover:bg-black/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" aria-hidden="true" />
                  <span>Code Challenges</span>
                </span>
                <span className="font-mono font-extrabold tabular-nums">{gamesPercent}%</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTopicMode('types', 'quiz')}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-white backdrop-blur-xs hover:bg-black/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EC4899]" aria-hidden="true" />
                  <span>Quiz Accuracy</span>
                </span>
                <span className="font-mono font-extrabold tabular-nums">{quizPercent}%</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right: Recently Studied — Blue & Midoriya Green-Cyan Swirling Fire */}
        <MotionConfig reducedMotion="user">
          <section className="relative lg:col-span-6 overflow-hidden rounded-[22px] border border-[#22D3EE]/40 bg-gradient-to-br from-[#02192E] via-[#042E3D] to-[#022A22] p-5 sm:p-6 shadow-[0_14px_34px_rgba(6,182,212,0.22)] text-white">
            {/* Swirling Fire Image shifted into Blue + Green-Cyan */}
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-26_at_2.56.49_PM_0a65ad7e.jpeg"
              alt=""
              referrerPolicy="no-referrer"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-[0.45] [filter:hue-rotate(155deg)_saturate(1.65)]"
            />
            {/* Animated Blue + Green-Cyan Dual Fire Plumes */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-6 -bottom-10 h-56 blur-2xl"
              style={{
                background:
                  'radial-gradient(ellipse at 22% 98%, rgba(37,99,235,0.78) 0%, rgba(56,189,248,0.4) 45%, transparent 76%)',
              }}
              animate={{
                scaleX: [1, 1.15, 0.94, 1],
                scaleY: [1, 1.24, 0.95, 1],
                y: [0, -14, 3, 0],
                opacity: [0.8, 1, 0.82],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-6 -bottom-8 h-52 blur-2xl"
              style={{
                background:
                  'radial-gradient(ellipse at 78% 95%, rgba(16,185,129,0.78) 0%, rgba(34,211,238,0.45) 45%, transparent 75%)',
              }}
              animate={{
                scaleX: [1.06, 0.92, 1.16, 1.06],
                scaleY: [0.95, 1.24, 1, 0.95],
                y: [3, -18, -2, 3],
                opacity: [0.75, 1, 0.78],
              }}
              transition={{ duration: 2.7, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
            />
            {/* Floating Blue, Green & Cyan Sparks */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              {[
                { left: '14%', color: '#3B82F6', delay: 0, dur: 2.8 },
                { left: '36%', color: '#22D3EE', delay: 0.6, dur: 3.1 },
                { left: '62%', color: '#10B981', delay: 0.3, dur: 2.9 },
                { left: '84%', color: '#60A5FA', delay: 0.9, dur: 2.6 },
              ].map((spark, sIdx) => (
                <motion.span
                  key={sIdx}
                  className="absolute bottom-2 h-1.5 w-1.5 rounded-full"
                  style={{
                    left: spark.left,
                    backgroundColor: spark.color,
                    boxShadow: `0 0 12px 2px ${spark.color}`,
                  }}
                  animate={{
                    y: [0, -170],
                    opacity: [0, 0.95, 0],
                    scale: [0.6, 1.3, 0.3],
                  }}
                  transition={{
                    duration: spark.dur,
                    repeat: Infinity,
                    delay: spark.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
                <Clock className="h-4 w-4 text-[#5EEAD4]" aria-hidden="true" />
                <span>{normalizedQuery ? 'Matching Modules' : 'Recently Studied'}</span>
              </h2>
              <button
                type="button"
                onClick={() => onSelectTopic('lists')}
                className="text-xs font-extrabold text-[#5EEAD4] hover:text-white hover:underline transition-colors"
              >
                Explore All →
              </button>
            </div>

            {visibleModules.length === 0 ? (
              <div className="relative z-10 mt-4 rounded-2xl border border-white/15 bg-black/40 p-6 text-center text-xs font-bold text-[#A7F3D0] backdrop-blur-md">
                No matching lessons found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="relative z-10 mt-4 space-y-2.5">
                {visibleModules.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={mod.onClick}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-[#22D3EE]/35 bg-[#021E2D]/78 px-3.5 py-2.5 text-left backdrop-blur-md hover:border-[#34D399]/80 hover:bg-[#042C38]/88 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white shadow-2xs">
                        <QuickAccessGraphic kind={mod.graphic} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-white">
                          {mod.title}
                        </p>
                        <p className="truncate text-xs font-semibold text-[#A5F3FC]">
                          {mod.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-[#5EEAD4] transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
        </MotionConfig>
      </div>

      {/* Bottom Bento Row: Weekly Activity (Indigo Fire) + Achievement Badges (Crimson-Gold Fire) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Weekly Activity Bar Chart */}
        <section className="relative lg:col-span-6 overflow-hidden rounded-[22px] border border-[#60A5FA]/35 bg-gradient-to-br from-[#0D1038] via-[#191D5E] to-[#0E1847] p-5 sm:p-6 shadow-[0_14px_34px_rgba(59,130,246,0.2)] text-white">
          <SwirlFireBackdrop preset="indigo-gold" opacityClass="opacity-[0.40]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0D2E]/75 via-[#14184E]/40 to-transparent"
          />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
                <Calendar className="h-4 w-4 text-[#7DD3FC]" aria-hidden="true" />
                <span>Weekly Activity</span>
              </h2>
              {activityView === 'week' && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#C7D2FE]">
                  {weeklyCaption}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-black/35 border border-white/15 p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActivityView('week')}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  activityView === 'week'
                    ? 'bg-white text-[#191944] shadow-2xs'
                    : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setActivityView('topics')}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  activityView === 'topics'
                    ? 'bg-white text-[#191944] shadow-2xs'
                    : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                By Mode
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-5 flex h-40 items-end justify-between gap-2 sm:gap-3 px-1">
            {activeBars.map((bar) => (
              <div
                key={bar.label}
                className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end"
                title={`${bar.label}: ${bar.note}`}
              >
                {bar.isPeak && (
                  <Star
                    className="h-4 w-4 text-[#FBBF24] fill-[#FBBF24] drop-shadow-xs"
                    aria-hidden="true"
                  />
                )}
                {bar.status === 'upcoming' ? (
                  <div className="w-full max-w-[34px] flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#93C5FD]">
                      Soon
                    </span>
                    <div className="h-[34%] w-full rounded-t-xl border-2 border-dashed border-[#60A5FA]/45 bg-white/5" />
                  </div>
                ) : bar.value === 0 ? (
                  <div className="w-full max-w-[34px] flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="font-mono text-[10px] font-bold text-[#94A3B8] tabular-nums">
                      0
                    </span>
                    <div className="h-1.5 w-full rounded-full bg-white/20" />
                  </div>
                ) : (
                  <div className="w-full max-w-[34px] flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        bar.isPeak
                          ? 'bg-gradient-to-t from-[#22D3EE] via-[#60A5FA] to-[#A78BFA] shadow-[0_6px_16px_rgba(34,211,238,0.35)]'
                          : 'bg-gradient-to-t from-[#6366F1] to-[#A78BFA]'
                      }`}
                      style={{ height: `${bar.value}%` }}
                    />
                  </div>
                )}
                <span
                  className={`text-[11px] font-bold ${
                    bar.status === 'upcoming'
                      ? 'text-[#93C5FD]'
                      : bar.isPeak
                      ? 'text-[#FDE047]'
                      : 'text-[#E2E8F0]'
                  }`}
                >
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Achievement Badges — Crimson-Gold Swirling Fire */}
        <section className="relative lg:col-span-6 overflow-hidden rounded-[22px] border border-[#FB923C]/40 bg-gradient-to-br from-[#230907] via-[#45130B] to-[#26091B] p-5 sm:p-6 shadow-[0_14px_34px_rgba(249,115,22,0.22)] text-white flex flex-col justify-between">
          <SwirlFireBackdrop preset="crimson-gold" opacityClass="opacity-[0.44]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1F0706]/80 via-[#380E08]/40 to-transparent"
          />

          <div className="relative z-10 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
              <Trophy className="h-4 w-4 text-[#FBBF24]" aria-hidden="true" />
              <span>Achievement Badges</span>
            </h2>
            <button
              type="button"
              onClick={onOpenProgress}
              className="text-xs font-extrabold text-[#FDE047] hover:text-white hover:underline"
            >
              See All →
            </button>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-4 gap-2 sm:gap-4">
            {badges.map((b) => (
              <button
                key={b.kind}
                type="button"
                onClick={onOpenProgress}
                className="flex flex-col items-center text-center group"
              >
                <div className="transition-transform duration-150 group-hover:-translate-y-1">
                  <SandboxAchievementBadge kind={b.kind} unlocked={b.unlocked} />
                </div>
                <span className="mt-2 text-[11px] font-extrabold leading-tight text-white">
                  {b.title}
                </span>
                <span
                  className={`mt-0.5 text-[10px] font-bold ${
                    b.unlocked ? 'text-[#6EE7B7]' : 'text-[#FED7AA]/75'
                  }`}
                >
                  {b.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
