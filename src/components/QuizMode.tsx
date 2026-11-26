import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react';
import { QUESTION_BANK, SUBJECTIVE_QUESTIONS } from '../data/curriculum';
import {
  MistakeFlashcard,
  ProgressData,
  QuizFormat,
  QuizQuestion,
  SubjectiveQuestion,
  TopicId,
} from '../types/learning';
import { getWeakSubtopics } from '../utils/progressStorage';
import { runPythonCode } from '../utils/pythonRunner';
import { AnimatedFlashcardDeck, StudyFlashcard } from './AnimatedFlashcardDeck';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';

interface QuizModeProps {
  topic: TopicId;
  progress: ProgressData;
  onRecordAnswer: (topic: TopicId, subtopic: string, isCorrect: boolean) => void;
  onOpenProgress: () => void;
  onOpenInPlayground?: (code: string) => void;
  onQuizComplete?: (score: number, total: number, format: QuizFormat) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildObjectiveDeck(
  topic: TopicId,
  progressSnapshot: ProgressData,
  useAdaptive: boolean
): QuizQuestion[] {
  const bank = QUESTION_BANK[topic];
  const weakList = getWeakSubtopics(progressSnapshot, topic).map((w) => w.subtopic);

  if (useAdaptive && weakList.length > 0) {
    const focused = bank.filter((q) => weakList.includes(q.subtopic));
    const others = bank.filter((q) => !weakList.includes(q.subtopic));
    return [...shuffleArray(focused), ...shuffleArray(others).slice(0, 3)];
  }

  return shuffleArray(bank).sort((a, b) => {
    const aWeak = weakList.includes(a.subtopic) ? 0 : 1;
    const bWeak = weakList.includes(b.subtopic) ? 0 : 1;
    return aWeak - bWeak;
  });
}

const RAPID_SECONDS = 10;

export const QuizMode: React.FC<QuizModeProps> = ({
  topic,
  progress,
  onRecordAnswer,
  onOpenProgress,
  onOpenInPlayground,
  onQuizComplete,
}) => {
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const weakSubtopics = getWeakSubtopics(progress, topic).map((w) => w.subtopic);

  const [quizFormat, setQuizFormat] = useState<QuizFormat>('objective');
  const [adaptiveOnly, setAdaptiveOnly] = useState(false);

  // Locked session decks (never reshuffle mid-session)
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    buildObjectiveDeck(topic, progress, false)
  );
  const [subjectiveDeck, setSubjectiveDeck] = useState<SubjectiveQuestion[]>(() =>
    shuffleArray(SUBJECTIVE_QUESTIONS[topic])
  );

  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [subjectiveInput, setSubjectiveInput] = useState('');
  const [subjectiveFeedback, setSubjectiveFeedback] = useState<{
    passed: boolean;
    message: string;
    actualOutput?: string;
  } | null>(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState<MistakeFlashcard[]>([]);
  const [finished, setFinished] = useState(false);

  // Rapid fire countdown
  const [timeLeft, setTimeLeft] = useState(RAPID_SECONDS);

  // Animated Flashcards state (Mistake review + anytime Concept Study)
  const [viewingMistakes, setViewingMistakes] = useState(false);
  const [studyingFlashcards, setStudyingFlashcards] = useState(false);

  const activeDeckLength =
    quizFormat === 'subjective' ? subjectiveDeck.length : questions.length;

  const startSession = useCallback(
    (targetTopic: TopicId, format: QuizFormat, useAdaptive: boolean) => {
      setQuizFormat(format);
      setAdaptiveOnly(useAdaptive);
      if (format === 'subjective') {
        const deck = shuffleArray(SUBJECTIVE_QUESTIONS[targetTopic]);
        setSubjectiveDeck(deck);
        setSubjectiveInput(deck[0]?.starterCode ?? '');
      } else {
        setQuestions(buildObjectiveDeck(targetTopic, progressRef.current, useAdaptive));
      }
      setIndex(0);
      setSelectedOption(null);
      setSubjectiveFeedback(null);
      setScore(0);
      setStreak(0);
      setMistakes([]);
      setFinished(false);
      setTimeLeft(RAPID_SECONDS);
      setViewingMistakes(false);
      setStudyingFlashcards(false);
    },
    []
  );

  useEffect(() => {
    startSession(topic, quizFormat, false);
  }, [topic, startSession, quizFormat]);

  const currentQuestion = questions[index];
  const currentSubjective = subjectiveDeck[index];

  // Rapid Fire timer
  useEffect(() => {
    if (quizFormat !== 'rapid' || finished || selectedOption !== null || !currentQuestion) {
      return;
    }

    if (timeLeft <= 0) {
      // Time expired -> mark missed
      setSelectedOption(-1);
      setStreak(0);
      setMistakes((prev) => [
        ...prev,
        {
          id: currentQuestion.id,
          subtopic: currentQuestion.subtopic,
          questionText: currentQuestion.question,
          yourAnswer: 'Timed out (0s left)',
          correctAnswer: currentQuestion.options[currentQuestion.correctIndex],
          theoryExplanation: currentQuestion.explanation,
          supportiveExample: currentQuestion.supportiveExample,
        },
      ]);
      onRecordAnswer(topic, currentQuestion.subtopic, false);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [quizFormat, finished, selectedOption, timeLeft, currentQuestion, topic, onRecordAnswer]);

  const handleSelectOption = (optIdx: number) => {
    if (selectedOption !== null || !currentQuestion) return;
    setSelectedOption(optIdx);

    const isCorrect = optIdx === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
      setMistakes((prev) => [
        ...prev,
        {
          id: currentQuestion.id,
          subtopic: currentQuestion.subtopic,
          questionText: currentQuestion.question,
          yourAnswer: currentQuestion.options[optIdx],
          correctAnswer: currentQuestion.options[currentQuestion.correctIndex],
          theoryExplanation: currentQuestion.explanation,
          supportiveExample: currentQuestion.supportiveExample,
        },
      ]);
    }

    onRecordAnswer(topic, currentQuestion.subtopic, isCorrect);
  };

  const handleSubmitSubjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectiveFeedback || !currentSubjective) return;
    const trimmed = subjectiveInput.trim();
    if (!trimmed) return;

    let passed = false;
    let message = '';
    let actualOutput = '';

    if (currentSubjective.mode === 'code') {
      const res = runPythonCode(trimmed);
      actualOutput = res.output.join('\n').trim();
      passed = !res.error && actualOutput === (currentSubjective.expectedOutput ?? '').trim();
      message = passed
        ? 'Your Python code produced the exact expected output!'
        : res.error
          ? `Python raised ${res.error}`
          : `Expected "${currentSubjective.expectedOutput}", got "${actualOutput || '(no output)'}".`;
    } else {
      const lower = trimmed.toLowerCase();
      const keywords = currentSubjective.requiredKeywords ?? [];
      const matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
      passed = matched.length >= Math.max(1, Math.ceil(keywords.length / 2)) && trimmed.length >= 15;
      message = passed
        ? 'Great explanation covering the core Python concept!'
        : 'Key concept details were missing. Review the model answer below.';
    }

    if (passed) {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
      setMistakes((prev) => [
        ...prev,
        {
          id: currentSubjective.id,
          subtopic: currentSubjective.subtopic,
          questionText: currentSubjective.prompt,
          yourAnswer: trimmed,
          correctAnswer: currentSubjective.modelAnswer,
          theoryExplanation: currentSubjective.theorySummary,
          supportiveExample: currentSubjective.supportiveExample,
        },
      ]);
    }

    setSubjectiveFeedback({ passed, message, actualOutput });
    onRecordAnswer(topic, currentSubjective.subtopic, passed);
  };

  const handleNext = () => {
    if (index + 1 >= activeDeckLength) {
      setFinished(true);
      onQuizComplete?.(score, activeDeckLength, quizFormat);
    } else {
      const nextIdx = index + 1;
      setIndex(nextIdx);
      setSelectedOption(null);
      setSubjectiveFeedback(null);
      setTimeLeft(RAPID_SECONDS);
      if (quizFormat === 'subjective') {
        setSubjectiveInput(subjectiveDeck[nextIdx]?.starterCode ?? '');
      }
    }
  };

  const progressPercent = Math.round(
    ((finished ? activeDeckLength : index) / Math.max(1, activeDeckLength)) * 100
  );

  const conceptStudyCards: StudyFlashcard[] = QUESTION_BANK[topic].map((q) => ({
    id: q.id,
    subtopic: q.subtopic,
    questionText: q.question,
    codeSnippet: q.codeSnippet,
    yourAnswer: '',
    correctAnswer: q.options[q.correctIndex],
    theoryExplanation: q.explanation,
    supportiveExample: q.supportiveExample,
    modeLabel: 'concept',
  }));

  // Format selector bar rendered above quiz — Indigo-Gold Swirling Fire
  const formatTabs = (
    <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#60A5FA]/35 bg-gradient-to-br from-[#0D1038] via-[#191D5E] to-[#0E1847] p-3 shadow-[0_12px_28px_rgba(59,130,246,0.18)] text-white">
      <SwirlFireBackdrop preset="indigo-gold" opacityClass="opacity-[0.38]" />
      <div className="relative z-10 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => startSession(topic, 'objective', adaptiveOnly)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            !studyingFlashcards && quizFormat === 'objective'
              ? 'bg-gradient-to-r from-[#7557F6] to-[#B45BFF] text-white shadow-sm'
              : 'border border-white/15 bg-black/35 text-white/90 hover:border-[#A78BFA] hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Objective (MCQ)</span>
        </button>

        <button
          type="button"
          onClick={() => startSession(topic, 'rapid', adaptiveOnly)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            !studyingFlashcards && quizFormat === 'rapid'
              ? 'bg-gradient-to-r from-[#FF795C] to-[#FFB36B] text-white shadow-sm'
              : 'border border-white/15 bg-black/35 text-[#FED7AA] hover:border-[#FB923C] hover:text-white'
          }`}
        >
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Rapid Fire (10s)</span>
        </button>

        <button
          type="button"
          onClick={() => startSession(topic, 'subjective', false)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            !studyingFlashcards && quizFormat === 'subjective'
              ? 'bg-gradient-to-r from-[#7557F6] to-[#FF78A8] text-white shadow-sm'
              : 'border border-white/15 bg-black/35 text-[#FBCFE8] hover:border-[#F472B6] hover:text-white'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Subjective (Written / Code)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStudyingFlashcards((prev) => !prev);
            setViewingMistakes(false);
          }}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            studyingFlashcards
              ? 'bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white shadow-sm'
              : 'border border-[#34D399]/35 bg-black/35 text-[#6EE7B7] hover:border-[#34D399] hover:text-white'
          }`}
        >
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Animated Flashcards</span>
        </button>
      </div>

      {!studyingFlashcards && quizFormat !== 'subjective' && weakSubtopics.length > 0 && (
        <button
          type="button"
          onClick={() => startSession(topic, quizFormat, !adaptiveOnly)}
          className={`relative z-10 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
            adaptiveOnly
              ? 'border-[#FDE047] bg-[#FDE047]/20 text-[#FDE047]'
              : 'border-white/25 bg-black/35 text-[#CBD5E1] hover:border-[#7DD3FC] hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{adaptiveOnly ? 'Weak Topics Active' : 'Focus Weak Topics'}</span>
        </button>
      )}
    </div>
  );

  // Anytime Animated Concept Flashcards View
  if (studyingFlashcards) {
    return (
      <div className="space-y-6">
        {formatTabs}
        <AnimatedFlashcardDeck
          cards={conceptStudyCards}
          mode="study"
          onBack={() => setStudyingFlashcards(false)}
          backLabel="Back to Quiz"
          onOpenInPlayground={onOpenInPlayground}
        />
      </div>
    );
  }

  // End-of-Quiz Mistake Flashcards View (Pinterest-style Animated Deck)
  if (finished && viewingMistakes && mistakes.length > 0) {
    return (
      <div className="space-y-6">
        {formatTabs}
        <AnimatedFlashcardDeck
          cards={mistakes}
          mode="mistakes"
          onBack={() => setViewingMistakes(false)}
          backLabel="Back to Quiz Summary"
          onOpenInPlayground={onOpenInPlayground}
        />
      </div>
    );
  }

  // Quiz Complete Summary — Crimson-Gold Swirling Fire
  if (finished) {
    const pct = Math.round((score / Math.max(1, activeDeckLength)) * 100);
    return (
      <div className="space-y-6">
        {formatTabs}

        <div className="relative overflow-hidden rounded-3xl border border-[#FB923C]/40 bg-gradient-to-br from-[#230907] via-[#45130B] to-[#26091B] p-6 sm:p-8 shadow-[0_14px_34px_rgba(249,115,22,0.22)] text-white space-y-6">
          <SwirlFireBackdrop preset="crimson-gold" opacityClass="opacity-[0.40]" />
          <div className="relative z-10">
            <p className="text-xs font-extrabold tracking-[0.14em] text-[#FDE047]">
              {quizFormat.toUpperCase()} QUIZ COMPLETE
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-white tabular-nums">
              You scored {score} / {activeDeckLength} ({pct}%)
            </h2>
            <p className="mt-2 text-sm text-[#FED7AA]">
              {mistakes.length === 0
                ? 'Flawless run! Zero mistakes recorded in this session.'
                : `You missed ${mistakes.length} question${mistakes.length > 1 ? 's' : ''}. Open your Mistake Flashcards to review the exact theory and supportive examples.`}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-2">
            {mistakes.length > 0 && (
              <button
                type="button"
                onClick={() => setViewingMistakes(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF795C] to-[#FFB36B] px-5 py-2.5 text-xs font-black text-[#230907] shadow-sm hover:brightness-110"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>See My Mistakes ({mistakes.length} Flashcards)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => startSession(topic, quizFormat, false)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7557F6] to-[#B45BFF] px-5 py-2.5 text-xs font-bold text-white hover:brightness-110"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retry Quiz</span>
            </button>

            <button
              type="button"
              onClick={onOpenProgress}
              className="rounded-xl border border-white/25 bg-black/35 px-4 py-2.5 text-xs font-semibold text-white hover:border-[#FDE047]"
            >
              View Progress
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cardTheme =
    quizFormat === 'rapid'
      ? {
          preset: 'rose-amber' as const,
          shell: 'border-[#FB7185]/40 from-[#2A061A] via-[#500724] to-[#581C0C]',
          accent: 'text-[#FDBA74]',
        }
      : quizFormat === 'subjective'
        ? {
            preset: 'emerald-cyan' as const,
            shell: 'border-[#34D399]/40 from-[#04241E] via-[#073B32] to-[#062C42]',
            accent: 'text-[#5EEAD4]',
          }
        : {
            preset: 'violet' as const,
            shell: 'border-[#A855F7]/40 from-[#160B33] via-[#27114E] to-[#11092B]',
            accent: 'text-[#C4B5FD]',
          };

  return (
    <div className="space-y-5">
      {formatTabs}

      <div
        className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${cardTheme.shell} p-6 sm:p-8 shadow-[0_14px_34px_rgba(30,20,70,0.24)] text-white space-y-6`}
      >
        <SwirlFireBackdrop preset={cardTheme.preset} opacityClass="opacity-[0.38]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent"
        />

        {/* Top Metadata + Rapid Timer */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-white/80 tabular-nums">
            <span className={`font-extrabold ${cardTheme.accent}`}>
              Question {index + 1} of {activeDeckLength}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {quizFormat === 'subjective'
                ? currentSubjective?.subtopic
                : currentQuestion?.subtopic}
            </span>
            {streak >= 2 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-[#FDE047]">{streak} streak</span>
              </>
            )}
          </div>

          {quizFormat === 'rapid' && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-bold tabular-nums ${
                timeLeft <= 3
                  ? 'border-rose-400/60 bg-rose-950/80 text-rose-200'
                  : 'border-amber-400/50 bg-amber-950/75 text-amber-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] via-[#A78BFA] to-[#FF78A8] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Objective & Rapid Fire Questions */}
        {quizFormat !== 'subjective' && currentQuestion && (
          <div className="relative z-10 space-y-5 rounded-2xl border border-white/15 bg-black/45 p-5 sm:p-6 backdrop-blur-xs">
            <h2 className="text-lg font-bold text-white">{currentQuestion.question}</h2>

            {currentQuestion.codeSnippet && (
              <pre className="overflow-x-auto rounded-xl border border-white/15 bg-[#120E24] p-4 font-mono text-[13px] text-[#A5F3FC]">
                <code>{currentQuestion.codeSnippet}</code>
              </pre>
            )}

            <div className="space-y-2.5">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrectOpt = optIdx === currentQuestion.correctIndex;

                let optionClass =
                  'border-white/20 bg-white/10 text-white hover:border-[#7DD3FC] hover:bg-white/15';
                if (selectedOption !== null) {
                  if (isCorrectOpt) {
                    optionClass = 'border-emerald-400 bg-emerald-950/80 text-emerald-100';
                  } else if (isSelected && !isCorrectOpt) {
                    optionClass = 'border-rose-400 bg-rose-950/80 text-rose-100';
                  } else {
                    optionClass = 'border-white/10 bg-black/30 text-white/50';
                  }
                }

                return (
                  <button
                    key={`${currentQuestion.id}-opt-${optIdx}`}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${optionClass}`}
                  >
                    <span className="font-mono text-[13px] font-medium">{opt}</span>
                    {selectedOption !== null && isCorrectOpt && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 shrink-0">
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        <span>Correct</span>
                      </span>
                    )}
                    {selectedOption !== null && isSelected && !isCorrectOpt && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 shrink-0">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="flex flex-col gap-4 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-[#FDE047]">
                    {selectedOption === currentQuestion.correctIndex
                      ? '+15 points earned'
                      : selectedOption === -1
                        ? 'Time expired (+5 participation points)'
                        : '+5 participation points'}
                  </p>
                  <p className="text-xs leading-relaxed text-white/90">
                    <strong className={cardTheme.accent}>Explanation:</strong>{' '}
                    {currentQuestion.explanation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-[#7557F6] to-[#B45BFF] px-5 py-2.5 text-xs font-bold text-white whitespace-nowrap shrink-0 hover:brightness-110"
                >
                  <span>{index + 1 >= activeDeckLength ? 'Finish Quiz' : 'Next Question'}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Subjective Written / Code Quiz */}
        {quizFormat === 'subjective' && currentSubjective && (
          <form
            onSubmit={handleSubmitSubjective}
            className="relative z-10 space-y-4 rounded-2xl border border-white/15 bg-black/45 p-5 sm:p-6 backdrop-blur-xs"
          >
            <div className="flex items-center justify-between text-xs font-bold text-[#5EEAD4]">
              <span>
                {currentSubjective.mode === 'code'
                  ? 'Write Python Code'
                  : 'Short Written Explanation'}
              </span>
              <span>{currentSubjective.subtopic}</span>
            </div>

            <h2 className="text-lg font-bold text-white">{currentSubjective.prompt}</h2>

            <textarea
              value={subjectiveInput}
              onChange={(e) => setSubjectiveInput(e.target.value)}
              disabled={Boolean(subjectiveFeedback)}
              rows={currentSubjective.mode === 'code' ? 5 : 4}
              placeholder={
                currentSubjective.mode === 'code'
                  ? 'Write your Python solution here...'
                  : 'Explain in your own words...'
              }
              className={`w-full rounded-xl border p-4 text-sm focus:border-[#34D399] focus:outline-none ${
                currentSubjective.mode === 'code'
                  ? 'code-editor border-white/20 bg-[#120E24] font-mono text-[#E2DCFF]'
                  : 'border-white/20 bg-black/50 text-white placeholder:text-white/45'
              }`}
            />

            {!subjectiveFeedback ? (
              <button
                type="submit"
                disabled={!subjectiveInput.trim()}
                className="rounded-xl bg-gradient-to-r from-[#10B981] to-[#22D3EE] px-5 py-2.5 text-xs font-black text-[#022C22] disabled:opacity-50"
              >
                Submit Answer
              </button>
            ) : (
              <div className="space-y-4 border-t border-white/15 pt-4">
                <div
                  className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs ${
                    subjectiveFeedback.passed
                      ? 'border-emerald-400/50 bg-emerald-950/75 text-emerald-100'
                      : 'border-rose-400/50 bg-rose-950/75 text-rose-100'
                  }`}
                >
                  {subjectiveFeedback.passed ? (
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{subjectiveFeedback.message}</p>
                    <p>
                      <strong className="text-[#FDE047]">Model Answer:</strong>{' '}
                      {currentSubjective.modelAnswer}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#22D3EE] px-5 py-2.5 text-xs font-black text-[#022C22]"
                >
                  <span>{index + 1 >= activeDeckLength ? 'Finish Quiz' : 'Next Question'}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
