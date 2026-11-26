import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Code2,
  Home,
  LogIn,
  LogOut,
  PlaySquare,
  Settings,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { AuthUser, InterfaceLanguage, ModeId, TopicId } from '../types/learning';
import { t } from '../utils/i18n';
import { MarkBrainLogo } from './MarkBrainLogo';
import { GiftBoxIllustration, SandboxHourglassLogo } from './SendBoxIllustrations';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';

export type DashboardRoute = 'dashboard' | 'topic' | 'workspace' | 'collaborate' | 'progress';

interface SidebarProps {
  route: DashboardRoute;
  currentTopic: TopicId;
  currentMode: ModeId;
  user: AuthUser | null;
  points: number;
  language: InterfaceLanguage;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigateDashboard: () => void;
  onSelectTopic: (topic: TopicId) => void;
  onSelectTopicMode: (topic: TopicId, mode: ModeId) => void;
  onNavigateCollaborate: () => void;
  onNavigateProgress: () => void;
  onOpenMark: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  route,
  currentTopic,
  currentMode,
  user,
  points,
  language,
  mobileOpen,
  onCloseMobile,
  onNavigateDashboard,
  onSelectTopic,
  onSelectTopicMode,
  onNavigateCollaborate,
  onNavigateProgress,
  onOpenMark,
  onOpenSettings,
  onOpenAuth,
  onLogout,
}) => {
  const [openMenu, setOpenMenu] = useState<'learn' | 'practice' | null>(null);

  const navBtnClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-[13.5px] font-bold transition-all duration-150 whitespace-nowrap ${
      active
        ? 'bg-gradient-to-r from-[#FFF5F5] to-[#FFE4E6] text-[#88131B] shadow-[0_8px_20px_rgba(32,3,7,0.45)]'
        : 'text-white/95 hover:bg-[#EF4444]/24 hover:text-white'
    }`;

  const subNavBtnClass = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-xl py-1.5 pl-9 pr-3 text-left text-[12.5px] font-semibold transition-colors whitespace-nowrap ${
      active
        ? 'bg-[#EF4444]/34 text-white border border-[#FCA5A5]/30'
        : 'text-white/85 hover:bg-[#EF4444]/18 hover:text-white'
    }`;

  const isLearnActive =
    route === 'topic' || (route === 'workspace' && currentMode === 'theory');
  const isPracticeActive =
    route === 'workspace' && (currentMode === 'video' || currentMode === 'quiz' || currentMode === 'game');
  const isProjectsActive =
    (route === 'workspace' && currentMode === 'lab') || route === 'collaborate';

  const sidebarContent = (
    <div className="relative flex h-full flex-col justify-between bg-gradient-to-b from-[#2A0306] via-[#5E0C14] to-[#1E0205] text-white lg:rounded-[26px] border border-[#F87171]/30 shadow-[0_14px_38px_rgba(127,29,29,0.52)] overflow-hidden">
      {/* Dark Red & Light Red Fire Backdrop */}
      <SwirlFireBackdrop preset="crimson-red" opacityClass="opacity-[0.62]" className="scale-110" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(248,113,113,0.34),transparent_48%),radial-gradient(circle_at_22%_72%,rgba(239,68,68,0.28),transparent_52%),linear-gradient(180deg,rgba(42,3,6,0.48)_0%,rgba(69,7,12,0.28)_50%,rgba(24,2,5,0.72)_100%)]"
      />
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-5">
        {/* Centered Sandbox ((⌛)) Brand Lockup */}
        <div className="relative flex flex-col items-center text-center">
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="absolute right-0 top-0 rounded-lg p-1.5 text-white/80 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateDashboard();
              onCloseMobile();
            }}
            className="flex flex-col items-center group"
          >
            <SandboxHourglassLogo
              className="h-12 w-20 transition-transform duration-150 group-hover:scale-105"
              variant="light"
            />
            <span className="mt-1 text-[23px] font-extrabold tracking-tight text-white">
              Sandbox
            </span>
          </button>
        </div>

        {/* Navigation Links matching Mockup */}
        <nav aria-label="Sandbox Sidebar" className="space-y-1.5">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => {
              onNavigateDashboard();
              onCloseMobile();
            }}
            className={navBtnClass(route === 'dashboard')}
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t(language, 'dashboard')}</span>
          </button>

          {/* Learn (Data Types & Python Lists) */}
          <div>
            <button
              type="button"
              onClick={() =>
                setOpenMenu((prev) => (prev === 'learn' ? null : 'learn'))
              }
              className={navBtnClass(isLearnActive)}
            >
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">Learn</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  openMenu === 'learn' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            {openMenu === 'learn' && (
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTopic('types');
                    onCloseMobile();
                  }}
                  className={subNavBtnClass(
                    (route === 'topic' || route === 'workspace') && currentTopic === 'types'
                  )}
                >
                  <span>{t(language, 'dataTypes')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTopic('lists');
                    onCloseMobile();
                  }}
                  className={subNavBtnClass(
                    (route === 'topic' || route === 'workspace') && currentTopic === 'lists'
                  )}
                >
                  <span>{t(language, 'pythonLists')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Practice (Video Lessons, Quiz, Code Game) */}
          <div>
            <button
              type="button"
              onClick={() =>
                setOpenMenu((prev) => (prev === 'practice' ? null : 'practice'))
              }
              className={navBtnClass(isPracticeActive)}
            >
              <PlaySquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">Practice</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  openMenu === 'practice' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            {openMenu === 'practice' && (
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTopicMode(currentTopic, 'video');
                    onCloseMobile();
                  }}
                  className={subNavBtnClass(route === 'workspace' && currentMode === 'video')}
                >
                  <span>Animated Videos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTopicMode(currentTopic, 'quiz');
                    onCloseMobile();
                  }}
                  className={subNavBtnClass(route === 'workspace' && currentMode === 'quiz')}
                >
                  <span>{t(language, 'adaptiveQuiz')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTopicMode(currentTopic, 'game');
                    onCloseMobile();
                  }}
                  className={subNavBtnClass(route === 'workspace' && currentMode === 'game')}
                >
                  <span>{t(language, 'codeGame')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Projects (Playground) */}
          <button
            type="button"
            onClick={() => {
              onSelectTopicMode(currentTopic, 'lab');
              onCloseMobile();
            }}
            className={navBtnClass(isProjectsActive && route !== 'collaborate')}
          >
            <Code2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Projects</span>
          </button>

          {/* Collaborate & Invite Friends */}
          <button
            type="button"
            onClick={() => {
              onNavigateCollaborate();
              onCloseMobile();
            }}
            className={navBtnClass(route === 'collaborate')}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t(language, 'collaborateInvite')}</span>
          </button>

          {/* AI Tutor (MARK with Brain + Sunglasses Logo) */}
          <button
            type="button"
            onClick={() => {
              onOpenMark();
              onCloseMobile();
            }}
            className={navBtnClass(false)}
          >
            <MarkBrainLogo className="h-7 w-7 shrink-0" />
            <span>AI Tutor · MARK</span>
          </button>

          {/* Progress */}
          <button
            type="button"
            onClick={() => {
              onNavigateProgress();
              onCloseMobile();
            }}
            className={navBtnClass(route === 'progress')}
          >
            <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Progress</span>
          </button>

          {/* Achievements */}
          <button
            type="button"
            onClick={() => {
              onNavigateProgress();
              onCloseMobile();
            }}
            className={navBtnClass(false)}
          >
            <Trophy className="h-4 w-4 shrink-0 text-[#FDE047]" aria-hidden="true" />
            <span>Achievements</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className={navBtnClass(false)}
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Bottom Crown Promo / Level Up Card + Account Footer */}
      <div className="relative z-10 px-4 pb-4 space-y-3">
        <div className="relative pt-3">
          {/* Sparkles */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 text-xs font-black text-[#FCA5A5]"
          >
            ✦ &nbsp; ✦ &nbsp; ✦
          </span>

          <div className="rounded-[20px] bg-gradient-to-b from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3] p-4 text-center text-[#3B070B] shadow-md border border-[#FCA5A5]/50">
            <div className="mx-auto -mt-1 flex justify-center">
              <GiftBoxIllustration className="h-11 w-11" />
            </div>
            <h3 className="mt-1 text-sm font-extrabold text-[#3B070B]">
              {user ? `${points} XP Saved` : t(language, 'levelUpTitle')}
            </h3>
            <p className="mt-1 text-[11px] font-semibold leading-snug text-[#7F1D1D]">
              {user
                ? 'Keep solving quizzes & projects to unlock Python Master!'
                : 'Sign in to save your XP, streaks & badges!'}
            </p>
            <button
              type="button"
              onClick={() => {
                if (user) {
                  onNavigateProgress();
                } else {
                  onOpenAuth();
                }
                onCloseMobile();
              }}
              className="mt-3 w-full rounded-full bg-gradient-to-r from-[#EF4444] to-[#991B1B] px-3 py-2 text-xs font-extrabold text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              {user ? 'View Rewards →' : `${t(language, 'signIn')} →`}
            </button>
          </div>
        </div>

        {user ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#FCA5A5]/25 bg-black/35 px-3 py-2 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 shrink-0 rounded-full object-cover border border-white/50"
                />
              ) : (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EF4444]/40 text-xs font-black text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-white">{user.name}</p>
                <p className="truncate text-[10.5px] text-white/75">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title={t(language, 'signOut')}
              aria-label={t(language, 'signOut')}
              className="rounded-xl p-1.5 text-white/85 hover:bg-white/15 hover:text-white transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onOpenAuth();
              onCloseMobile();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#FCA5A5]/25 bg-black/35 px-3 py-2 text-xs font-bold text-white hover:bg-[#EF4444]/25 transition-colors backdrop-blur-xs"
          >
            <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t(language, 'createAccount')}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-[238px] lg:shrink-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#17183e]/55 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[264px] max-w-[85vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
