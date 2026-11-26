import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Award, BookOpen, Home, Users } from 'lucide-react';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AnimatedLessonMode } from './components/AnimatedLessonMode';
import { AuthModal } from './components/AuthModal';
import { CelebrationOverlay, CelebrationPayload } from './components/CelebrationOverlay';
import { CodeGameMode } from './components/CodeGameMode';
import { CollaborateView } from './components/CollaborateView';
import { DashboardHeader } from './components/DashboardHeader';
import { HomeView } from './components/HomeView';
import { MarkBrainLogo } from './components/MarkBrainLogo';
import { MarkChatbot } from './components/MarkChatbot';
import { OpeningIntro } from './components/OpeningIntro';
import { PlaygroundMode } from './components/PlaygroundMode';
import { ProgressView } from './components/ProgressView';
import { QuizMode } from './components/QuizMode';
import { DashboardRoute, Sidebar } from './components/Sidebar';
import { TheoryMode } from './components/TheoryMode';
import { TopicMenuView } from './components/TopicMenuView';
import heroRengokuFireBgImg from './assets/images/hero_rengoku_fire_bg_1795683793073.jpg';
import { MODULES, THEORY_LESSONS } from './data/curriculum';
import {
  AppNotification,
  AuthUser,
  InterfaceLanguage,
  ModeId,
  ProgressData,
  QuizFormat,
  TopicId,
} from './types/learning';
import { t } from './utils/i18n';
import {
  clearGuestLocalStorage,
  createDefaultProgress,
  markGameCompletedInMemory,
  markLessonCompletedInMemory,
  recordQuizAnswerInMemory,
} from './utils/progressStorage';

const MODE_TITLES: Record<ModeId, string> = {
  theory: 'Concepts & Theory',
  video: 'Animated Video Lessons',
  quiz: 'Quizzes & Flashcards',
  game: 'Code Continuation Game',
  lab: 'Python Code Playground',
};

export default function App() {
  const [route, setRoute] = useState<DashboardRoute>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') ? 'collaborate' : 'dashboard';
  });
  const [inviteRoomCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room')?.toUpperCase() ?? null;
  });

  const [currentTopic, setCurrentTopic] = useState<TopicId>('types');
  const [currentMode, setCurrentMode] = useState<ModeId>('theory');
  const [navHistory, setNavHistory] = useState<
    Array<{ route: DashboardRoute; topic: TopicId; mode: ModeId }>
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playgroundSeedCode, setPlaygroundSeedCode] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const handleFinishIntro = useCallback(() => setShowIntro(false), []);
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);
  const triggerCelebration = useCallback(
    (title: string, subtitle: string, badgeText?: string) => {
      setCelebration({
        id: Date.now(),
        title,
        subtitle,
        badgeText,
      });
    },
    []
  );
  const handleCloseCelebration = useCallback(() => setCelebration(null), []);

  // Auth token held strictly in JS memory (never localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Strict in-memory only state when not signed in (never saved unless signed in)
  const [guestProgress, setGuestProgress] = useState<ProgressData>(() =>
    createDefaultProgress()
  );
  const [guestPoints, setGuestPoints] = useState<number>(0);
  const [sessionLanguage, setSessionLanguage] = useState<InterfaceLanguage>('en');

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'welcome-1',
      title: 'Welcome to Sandbox',
      detail: 'Sign in to save your XP points, lesson progress, and preferred language.',
      time: 'Now',
      read: false,
    },
  ]);

  // Remove any legacy guest localStorage keys so unsigned-in sessions do not persist
  useEffect(() => {
    clearGuestLocalStorage();
  }, []);

  const activeProgress = user ? user.progress : guestProgress;
  const activePoints = user ? user.points : guestPoints;
  const activeLanguage: InterfaceLanguage = user
    ? user.preferredLanguage
    : sessionLanguage;

  const pushNotification = useCallback((title: string, detail: string) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        detail,
        time: 'Just now',
        read: false,
      },
      ...prev.slice(0, 14),
    ]);
  }, []);

  const syncWithServer = useCallback(
    async (payload: Record<string, unknown>, noticeTitle?: string) => {
      if (!authToken) return;
      try {
        const res = await fetch('/api/progress/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: AuthUser; pointsAwarded?: number };
        if (data.user) {
          setUser(data.user);
          if (noticeTitle && data.pointsAwarded && data.pointsAwarded > 0) {
            pushNotification(`+${data.pointsAwarded} pts saved`, noticeTitle);
          }
        }
      } catch {
        // Keep UI responsive
      }
    },
    [authToken, pushNotification]
  );

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navigateTo = useCallback(
    (
      nextRoute: DashboardRoute,
      nextTopic: TopicId = currentTopic,
      nextMode: ModeId = currentMode
    ) => {
      if (nextRoute === route && nextTopic === currentTopic && nextMode === currentMode) {
        return;
      }
      setNavHistory((prev) => [
        ...prev.slice(-19),
        { route, topic: currentTopic, mode: currentMode },
      ]);
      setCurrentTopic(nextTopic);
      setCurrentMode(nextMode);
      setRoute(nextRoute);
      scrollToTop();
    },
    [route, currentTopic, currentMode]
  );

  const handleGoBack = useCallback(() => {
    setNavHistory((prev) => {
      if (prev.length === 0) {
        setRoute('dashboard');
        return prev;
      }
      const previous = prev[prev.length - 1];
      setCurrentTopic(previous.topic);
      setCurrentMode(previous.mode);
      setRoute(previous.route);
      scrollToTop();
      return prev.slice(0, -1);
    });
  }, []);

  const handleGoDashboard = () => {
    navigateTo('dashboard');
  };

  const handleSelectTopic = (topic: TopicId) => {
    navigateTo('topic', topic);
  };

  const handleSelectTopicMode = (topic: TopicId, mode: ModeId) => {
    navigateTo('workspace', topic, mode);
  };

  const handleSelectMode = (mode: ModeId) => {
    navigateTo('workspace', currentTopic, mode);
  };

  const handleOpenInPlayground = (code: string) => {
    setPlaygroundSeedCode(code);
    navigateTo('workspace', currentTopic, 'lab');
  };

  const handleClearSeedCode = useCallback(() => {
    setPlaygroundSeedCode(null);
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim() && route !== 'dashboard') {
      navigateTo('dashboard');
    }
  };

  const handleRecordAnswer = (topic: TopicId, subtopic: string, isCorrect: boolean) => {
    if (user && authToken) {
      void syncWithServer(
        { action: 'record_quiz', topic, subtopic, isCorrect },
        isCorrect ? `Correct answer in ${subtopic}` : `Practiced ${subtopic}`
      );
    } else {
      setGuestProgress((prev) => recordQuizAnswerInMemory(prev, topic, subtopic, isCorrect));
      const pts = isCorrect ? 15 : 5;
      setGuestPoints((p) => p + pts);
      pushNotification(
        `+${pts} pts (unsaved guest session)`,
        `Sign in to save your ${subtopic} progress.`
      );
    }
  };

  const handleCompleteLesson = (lessonId: string) => {
    const allLessons = [...THEORY_LESSONS.types, ...THEORY_LESSONS.lists];
    const matchedLesson = allLessons.find((l) => l.id === lessonId);
    const lessonTitle = matchedLesson?.title ?? 'Python Theory Lesson';
    const wasAlreadyDone = activeProgress.completedLessonIds.includes(lessonId);

    if (user && authToken) {
      if (!user.progress.completedLessonIds.includes(lessonId)) {
        void syncWithServer({ action: 'complete_lesson', lessonId }, 'Theory lesson completed');
      }
    } else {
      setGuestProgress((prev) => {
        if (!prev.completedLessonIds.includes(lessonId)) {
          setGuestPoints((p) => p + 25);
          pushNotification(
            '+25 pts (unsaved guest session)',
            'Sign in to save completed lessons.'
          );
        }
        return markLessonCompletedInMemory(prev, lessonId);
      });
    }

    if (!wasAlreadyDone) {
      triggerCelebration(
        'Lesson Completed!',
        `Awesome work finishing "${lessonTitle}"!`,
        '+25 pts · Theory Complete'
      );
    }
  };

  const handleCompleteGame = (gameId: string, challengeTitle?: string) => {
    if (user && authToken) {
      if (!user.progress.completedGameIds.includes(gameId)) {
        void syncWithServer({ action: 'complete_game', gameId }, 'Solved coding challenge');
      }
    } else {
      setGuestProgress((prev) => {
        if (!prev.completedGameIds.includes(gameId)) {
          setGuestPoints((p) => p + 30);
          pushNotification(
            '+30 pts (unsaved guest session)',
            'Sign in to save challenge wins.'
          );
        }
        return markGameCompletedInMemory(prev, gameId);
      });
    }

    triggerCelebration(
      'Challenge Solved!',
      challengeTitle
        ? `Your Python code solved "${challengeTitle}"!`
        : 'Your Python code matched the target output!',
      '+30 pts · Code Challenge'
    );
  };

  const handleAwardPoints = useCallback(
    (amount: number, reason: string) => {
      if (user && authToken) {
        void syncWithServer({ action: 'award_points', amount }, reason);
      } else {
        setGuestPoints((p) => p + amount);
        pushNotification(`+${amount} pts (unsaved guest session)`, `${reason} — sign in to save.`);
      }
    },
    [user, authToken, syncWithServer, pushNotification]
  );

  const handleCompleteVideo = useCallback(
    (trackTitle: string) => {
      handleAwardPoints(20, `Completed animated video: ${trackTitle}`);
      triggerCelebration(
        'Video Lesson Complete!',
        `You finished "${trackTitle}"! Review the exam Q&A below anytime.`,
        '+20 pts · Video Mastered'
      );
    },
    [handleAwardPoints, triggerCelebration]
  );

  const handleQuizComplete = useCallback(
    (score: number, total: number, format: QuizFormat) => {
      const label =
        format === 'rapid'
          ? 'Rapid Fire Quiz'
          : format === 'subjective'
            ? 'Subjective Quiz'
            : 'Objective Quiz';
      const pct = Math.round((score / Math.max(1, total)) * 100);
      triggerCelebration(
        `${label} Complete!`,
        `You scored ${score} out of ${total} (${pct}%). Keep building your Python streak!`,
        `${pct}% Accuracy`
      );
    },
    [triggerCelebration]
  );

  const handleCompleteProject = useCallback(
    (projectTitle: string) => {
      handleAwardPoints(20, `Completed Python project: ${projectTitle}`);
      triggerCelebration(
        'Project Built!',
        `Your Python project "${projectTitle}" ran cleanly with zero errors!`,
        '+20 pts · Python Project'
      );
    },
    [handleAwardPoints, triggerCelebration]
  );

  const handleResetProgress = () => {
    if (user && authToken) {
      void syncWithServer({ action: 'reset_progress' });
    } else {
      setGuestProgress(createDefaultProgress());
      setGuestPoints(0);
    }
  };

  const handleUpdateLanguage = async (lang: InterfaceLanguage) => {
    setSessionLanguage(lang);
    if (user && authToken) {
      try {
        const res = await fetch('/api/auth/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ preferredLanguage: lang }),
        });
        if (res.ok) {
          const data = (await res.json()) as { user?: AuthUser };
          if (data.user) {
            setUser(data.user);
            pushNotification('Language updated', 'Preferred interface language saved to your account.');
          }
        }
      } catch {
        // Keep session preview active
      }
    }
  };

  const handleUpdateAvatar = async (avatarUrl: string | null) => {
    if (!user || !authToken) return;
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ avatarUrl }),
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: AuthUser };
        if (data.user) {
          setUser(data.user);
          pushNotification('Profile photo updated', 'Your account avatar has been updated.');
        }
      }
    } catch {
      // Keep UI responsive
    }
  };

  const handleAuthSuccess = (token: string, authedUser: AuthUser, isNewAccount: boolean) => {
    setAuthToken(token);
    setUser(authedUser);
    setSessionLanguage(authedUser.preferredLanguage);
    pushNotification(
      isNewAccount ? 'Account created (+50 pts)' : `Signed in as ${authedUser.name}`,
      isNewAccount
        ? 'Your progress, points, and language preference are now saved.'
        : `Welcome back! Saved balance: ${authedUser.points} pts.`
    );
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setGuestProgress(createDefaultProgress());
    setGuestPoints(0);
    setSessionLanguage('en');
  };

  return (
    <div className="flex min-h-screen bg-[#EAE5FF] text-[#191944] lg:gap-4 lg:p-4">
      {showIntro && <OpeningIntro onComplete={handleFinishIntro} />}
      <CelebrationOverlay celebration={celebration} onClose={handleCloseCelebration} />
      {/* Vibrant Purple Left Sidebar (Sandbox) */}
      <Sidebar
        route={route}
        currentTopic={currentTopic}
        currentMode={currentMode}
        user={user}
        points={activePoints}
        language={activeLanguage}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onNavigateDashboard={handleGoDashboard}
        onSelectTopic={handleSelectTopic}
        onSelectTopicMode={handleSelectTopicMode}
        onNavigateCollaborate={() => navigateTo('collaborate')}
        onNavigateProgress={() => navigateTo('progress')}
        onOpenMark={() => setMarkOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Right Main Column inside Rounded Card Shell */}
      <div className="relative flex min-w-0 flex-1 flex-col bg-gradient-to-b from-[#EDE6FF] via-[#F3EEFF] to-[#FCEEE3] lg:rounded-[28px] lg:shadow-[0_18px_48px_rgba(78,56,226,0.12)] overflow-x-clip">
        {/* Visible Fading Rengoku Fire Backdrop in Lower Half of UI */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[560px] overflow-hidden lg:rounded-b-[28px]"
        >
          <img
            src={heroRengokuFireBgImg}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-bottom opacity-[0.46] [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,0.72)_58%,transparent_100%)]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFF1E6]/25 via-transparent to-[#EFEAFF]/90" />
        </div>

        <DashboardHeader
          user={user}
          language={activeLanguage}
          notifications={notifications}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          canGoBack={navHistory.length > 0 || route !== 'dashboard'}
          onGoBack={handleGoBack}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onMarkAllRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        <main className="relative z-10 mx-auto w-full max-w-[1240px] flex-1 px-4 pt-4 pb-24 sm:px-7 sm:pb-10">
          {route === 'dashboard' && (
            <HomeView
              user={user}
              points={activePoints}
              progress={activeProgress}
              language={activeLanguage}
              searchQuery={searchQuery}
              onSelectTopic={handleSelectTopic}
              onSelectTopicMode={handleSelectTopicMode}
              onOpenProgress={() => navigateTo('progress')}
              onOpenCollaborate={() => navigateTo('collaborate')}
              onOpenMark={() => setMarkOpen(true)}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {route === 'topic' && (
            <TopicMenuView
              topic={currentTopic}
              onBackHome={handleGoBack}
              onSelectMode={handleSelectMode}
            />
          )}

          {route === 'workspace' && (
            <div className="space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <button
                    type="button"
                    onClick={() => navigateTo('topic', currentTopic, currentMode)}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-[#7041ed] hover:text-[#352078] transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Back to {MODULES[currentTopic].title} Modes</span>
                  </button>
                  <p className="mt-4 text-xs font-extrabold tracking-[0.14em] uppercase text-[#7041ed]">
                    {MODULES[currentTopic].title}
                  </p>
                  <h1 className="mt-1.5 text-3xl font-black text-[#191944] sm:text-4xl">
                    {MODE_TITLES[currentMode]}
                  </h1>
                </div>

                {/* Quick Mode Switcher */}
                <div className="flex flex-wrap items-center gap-1 rounded-full border border-[#A78BFA]/35 bg-[#160B33]/92 p-1.5 shadow-md backdrop-blur-xs">
                  {(['theory', 'video', 'quiz', 'game', 'lab'] as ModeId[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => navigateTo('workspace', currentTopic, m)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold whitespace-nowrap transition-all ${
                        currentMode === m
                          ? 'bg-gradient-to-r from-[#22D3EE] to-[#7C5CFF] text-white shadow-xs'
                          : 'text-[#DDD6FE] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {m === 'theory'
                        ? 'Theory'
                        : m === 'video'
                          ? 'Video Lessons'
                          : m === 'quiz'
                            ? 'Quiz'
                            : m === 'game'
                              ? 'Game'
                              : 'Playground'}
                    </button>
                  ))}
                </div>
              </div>

              {currentMode === 'theory' && (
                <TheoryMode
                  topic={currentTopic}
                  completedLessonIds={activeProgress.completedLessonIds}
                  onCompleteLesson={handleCompleteLesson}
                  onOpenInPlayground={handleOpenInPlayground}
                />
              )}

              {currentMode === 'video' && (
                <AnimatedLessonMode
                  topic={currentTopic}
                  preferredLanguage={activeLanguage}
                  onCompleteVideo={handleCompleteVideo}
                />
              )}

              {currentMode === 'quiz' && (
                <QuizMode
                  topic={currentTopic}
                  progress={activeProgress}
                  onRecordAnswer={handleRecordAnswer}
                  onOpenProgress={() => navigateTo('progress')}
                  onOpenInPlayground={handleOpenInPlayground}
                  onQuizComplete={handleQuizComplete}
                />
              )}

              {currentMode === 'game' && (
                <CodeGameMode
                  topic={currentTopic}
                  completedGameIds={activeProgress.completedGameIds}
                  onCompleteGame={handleCompleteGame}
                />
              )}

              {currentMode === 'lab' && (
                <PlaygroundMode
                  topic={currentTopic}
                  initialCode={playgroundSeedCode}
                  onClearInitialCode={handleClearSeedCode}
                  onCompleteProject={handleCompleteProject}
                />
              )}
            </div>
          )}

          {route === 'collaborate' && (
            <CollaborateView
              user={user}
              authToken={authToken}
              initialRoomCode={inviteRoomCode}
              onBack={handleGoBack}
              onAwardPoints={handleAwardPoints}
              onCelebrate={triggerCelebration}
            />
          )}

          {route === 'progress' && (
            <ProgressView
              user={user}
              points={activePoints}
              progress={activeProgress}
              onBackHome={handleGoBack}
              onPracticeTopic={(topic) => navigateTo('workspace', topic, 'quiz')}
              onResetProgress={handleResetProgress}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}
        </main>

        <footer className="relative z-10 hidden lg:block border-t border-[#ECE7FF] bg-white/75 backdrop-blur-xs py-4 text-center text-xs font-bold text-[#6E6796]">
          Sandbox · Learn. Code. Grow.
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-[#e0d5ff] bg-white/95 px-2 py-2 backdrop-blur-md shadow-[0_-6px_24px_rgba(25,25,68,0.08)]"
      >
        <button
          type="button"
          onClick={handleGoDashboard}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-extrabold whitespace-nowrap transition-colors ${
            route === 'dashboard' ? 'text-[#7041ed]' : 'text-[#5e5878]'
          }`}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span>{t(activeLanguage, 'dashboard')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTopic(currentTopic)}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-extrabold whitespace-nowrap transition-colors ${
            route === 'topic' || route === 'workspace' ? 'text-[#7041ed]' : 'text-[#5e5878]'
          }`}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>Curriculum</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('collaborate')}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-extrabold whitespace-nowrap transition-colors ${
            route === 'collaborate' ? 'text-[#7041ed]' : 'text-[#5e5878]'
          }`}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          <span>Collab</span>
        </button>

        <button
          type="button"
          onClick={() => setMarkOpen(true)}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-extrabold whitespace-nowrap transition-colors ${
            markOpen ? 'text-[#7041ed]' : 'text-[#5e5878]'
          }`}
        >
          <MarkBrainLogo className="h-7 w-7" />
          <span>MARK</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('progress')}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-extrabold whitespace-nowrap transition-colors ${
            route === 'progress' ? 'text-[#7041ed]' : 'text-[#5e5878]'
          }`}
        >
          <Award className="h-4 w-4" aria-hidden="true" />
          <span>Progress</span>
        </button>
      </nav>

      {/* MARK AI Study Buddy Drawer (with Gemini Pegasus Indian-accent voice) */}
      <MarkChatbot
        activeTopic={currentTopic}
        preferredLanguage={activeLanguage}
        isOpen={markOpen}
        onToggleOpen={setMarkOpen}
      />

      <AuthModal
        isOpen={authModalOpen}
        currentLanguage={activeLanguage}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <AccountSettingsModal
        isOpen={settingsModalOpen}
        user={user}
        currentLanguage={activeLanguage}
        onClose={() => setSettingsModalOpen(false)}
        onUpdateLanguage={handleUpdateLanguage}
        onUpdateAvatar={handleUpdateAvatar}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />
    </div>
  );
}
