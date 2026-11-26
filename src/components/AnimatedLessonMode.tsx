import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Lock,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ANIMATED_VIDEO_TRACKS } from '../data/curriculum';
import { AnimatedStage, InterfaceLanguage, TopicId } from '../types/learning';
import { playGeminiVoice, stopGeminiVoice } from '../utils/voicePlayer';
import { SwirlFireBackdrop } from './SwirlFireBackdrop';

interface AnimatedLessonModeProps {
  topic: TopicId;
  preferredLanguage: InterfaceLanguage;
  onCompleteVideo?: (trackTitle: string, trackId: string) => void;
}

type ScenePhase = 'before' | 'action' | 'after';

export const AnimatedLessonMode: React.FC<AnimatedLessonModeProps> = ({
  topic,
  preferredLanguage,
  onCompleteVideo,
}) => {
  const tracks = ANIMATED_VIDEO_TRACKS[topic];
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0].id);
  const activeTrack = tracks.find((tr) => tr.id === selectedTrackId) ?? tracks[0];
  const stages = activeTrack.stages;

  const [stageIndex, setStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [pausedAtCheckpoint, setPausedAtCheckpoint] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'loading' | 'speaking'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [completedTrackIds, setCompletedTrackIds] = useState<string[]>([]);
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});

  // Choreography phase & replay counter for step-by-step stage animation
  const [phase, setPhase] = useState<ScenePhase>('before');
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [replayNonce, setReplayNonce] = useState<number>(0);

  const fallbackTimerRef = useRef<number | null>(null);
  const stage: AnimatedStage = stages[stageIndex] ?? stages[0];
  const checkpoint = stage.checkpoint;
  const checkpointSolved =
    !checkpoint || (selectedOption !== null && selectedOption === checkpoint.correctIndex);
  const isLastStage = stageIndex >= stages.length - 1;
  const isTrackCompleted = completedTrackIds.includes(activeTrack.id);

  const stopAudioAndTimers = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    stopGeminiVoice();
    setVoiceState('idle');
  }, []);

  // Reset when parent topic changes
  useEffect(() => {
    stopAudioAndTimers();
    const firstId = ANIMATED_VIDEO_TRACKS[topic][0].id;
    setSelectedTrackId(firstId);
    setStageIndex(0);
    setIsPlaying(false);
    setSelectedOption(null);
    setPausedAtCheckpoint(false);
    setVoiceError(null);
    setRevealedQuestions({});
    setReplayNonce((n) => n + 1);
  }, [topic, stopAudioAndTimers]);

  useEffect(() => {
    return () => {
      stopAudioAndTimers();
    };
  }, [stopAudioAndTimers]);

  // Run visual phase choreography ('before' -> 'action' -> 'after') on scene change / replay
  useEffect(() => {
    setPhase('before');
    setScanIndex(0);

    const tAction = window.setTimeout(() => {
      setPhase('action');
    }, 750);

    const tAfter = window.setTimeout(() => {
      setPhase('after');
    }, 2400);

    let scanInterval: number | null = null;
    if (stage.animationKind === 'index-scan' && stage.items.length > 0) {
      const targetIdx = Math.max(
        0,
        stage.items.findIndex((item) => item.scanTarget)
      );
      let cursor = 0;
      scanInterval = window.setInterval(() => {
        cursor = Math.min(targetIdx, cursor + 1);
        setScanIndex(cursor);
        if (cursor >= targetIdx && scanInterval !== null) {
          window.clearInterval(scanInterval);
        }
      }, 650);
    }

    return () => {
      window.clearTimeout(tAction);
      window.clearTimeout(tAfter);
      if (scanInterval !== null) {
        window.clearInterval(scanInterval);
      }
    };
  }, [stage.id, stage.animationKind, stage.items, replayNonce]);

  // Play Gemini Pegasus Indian-accent narration when isPlaying is true
  useEffect(() => {
    stopAudioAndTimers();
    if (!isPlaying) return;

    let cancelled = false;
    const current = stages[stageIndex] ?? stages[0];
    const hasUnsolvedCheckpoint =
      Boolean(current.checkpoint) && selectedOption !== current.checkpoint?.correctIndex;

    const handleFinishNarration = () => {
      if (cancelled) return;
      setVoiceState('idle');
      // Automatically STOP at checkpoints for the questions!
      if (hasUnsolvedCheckpoint) {
        setIsPlaying(false);
        setPausedAtCheckpoint(true);
        return;
      }
      if (stageIndex < stages.length - 1) {
        setStageIndex((prev) => prev + 1);
        setSelectedOption(null);
        setPausedAtCheckpoint(false);
        setReplayNonce((n) => n + 1);
      } else {
        setIsPlaying(false);
        setCompletedTrackIds((prev) => (prev.includes(activeTrack.id) ? prev : [...prev, activeTrack.id]));
        onCompleteVideo?.(activeTrack.title, activeTrack.id);
      }
    };

    if (!audioMuted) {
      setVoiceState('loading');
      setVoiceError(null);
      void playGeminiVoice({
        text: current.spokenScript,
        preferredLanguage,
        playbackRate: speechRate,
        onStart: () => {
          if (!cancelled) setVoiceState('speaking');
        },
        onEnd: () => {
          handleFinishNarration();
        },
        onError: (msg) => {
          if (!cancelled) {
            setVoiceState('idle');
            setIsPlaying(false);
            setVoiceError(msg);
          }
        },
      });
    } else {
      fallbackTimerRef.current = window.setTimeout(() => {
        handleFinishNarration();
      }, 4500);
    }

    return () => {
      cancelled = true;
      stopAudioAndTimers();
    };
  }, [
    isPlaying,
    stageIndex,
    stages,
    audioMuted,
    speechRate,
    preferredLanguage,
    selectedOption,
    stopAudioAndTimers,
  ]);

  const handleSelectTrack = (trackId: string) => {
    stopAudioAndTimers();
    setIsPlaying(false);
    setVoiceError(null);
    setSelectedTrackId(trackId);
    setStageIndex(0);
    setSelectedOption(null);
    setPausedAtCheckpoint(false);
    setRevealedQuestions({});
    setReplayNonce((n) => n + 1);
  };

  const handleMarkVideoComplete = () => {
    stopAudioAndTimers();
    setIsPlaying(false);
    setCompletedTrackIds((prev) =>
      prev.includes(activeTrack.id) ? prev : [...prev, activeTrack.id]
    );
    onCompleteVideo?.(activeTrack.title, activeTrack.id);
  };

  const goToStage = (idx: number) => {
    stopAudioAndTimers();
    setVoiceError(null);
    setStageIndex(idx);
    setSelectedOption(null);
    setPausedAtCheckpoint(false);
    setReplayNonce((n) => n + 1);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudioAndTimers();
      setIsPlaying(false);
      return;
    }
    if (checkpoint && !checkpointSolved && pausedAtCheckpoint) {
      return;
    }
    setVoiceError(null);
    setPausedAtCheckpoint(false);
    setReplayNonce((n) => n + 1);
    setIsPlaying(true);
  };

  const handleAnswerCheckpoint = (optIdx: number) => {
    setSelectedOption(optIdx);
    if (checkpoint && optIdx === checkpoint.correctIndex) {
      setPausedAtCheckpoint(false);
    }
  };

  const handleContinueAfterCheckpoint = () => {
    if (stageIndex < stages.length - 1) {
      setSelectedOption(null);
      setPausedAtCheckpoint(false);
      setStageIndex((prev) => prev + 1);
      setReplayNonce((n) => n + 1);
      setIsPlaying(true);
    } else {
      handleMarkVideoComplete();
    }
  };

  const isListModule = topic === 'lists';

  // Filter items that collapse/disappear after fade-out in pop-fade, delete-fade, set-dedup
  const visibleItems = stage.items.filter((item) => {
    if (phase === 'after' && (item.removed || item.duplicate)) {
      return false;
    }
    return true;
  });

  const actionTriggered = phase === 'action' || phase === 'after';

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Divided Video Selector per Function (Lists) or Data Type (Data Types) */}
        <section
          aria-label={isListModule ? 'Choose list function video' : 'Choose data type video'}
          className="relative overflow-hidden rounded-[24px] border border-[#22D3EE]/35 bg-gradient-to-br from-[#061830] via-[#0B254B] to-[#082B36] p-5 sm:p-6 shadow-[0_14px_34px_rgba(14,165,233,0.18)] text-white space-y-3"
        >
          <SwirlFireBackdrop preset="blue-cyan" opacityClass="opacity-[0.38]" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#5EEAD4]">
                {isListModule ? 'Choose a List Function Video' : 'Choose a Data Type Video'}
              </p>
              <h2 className="mt-0.5 text-base font-black text-white">
                {activeTrack.title}
              </h2>
            </div>
            <p className="text-xs font-semibold text-[#BAE6FD]">{activeTrack.subtitle}</p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {tracks.map((tr) => {
              const selected = tr.id === activeTrack.id;
              const done = completedTrackIds.includes(tr.id);
              return (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => handleSelectTrack(tr.id)}
                  className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-all duration-150 ${
                    selected
                      ? 'border-[#22D3EE] bg-white text-[#191944] shadow-md'
                      : 'border-white/15 bg-black/35 text-white hover:border-[#5EEAD4]/70 hover:bg-black/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span
                      className={`font-mono text-xs font-black ${
                        selected ? 'text-[#5B44EB]' : 'text-[#5EEAD4]'
                      }`}
                    >
                      {tr.shortLabel}
                    </span>
                    {done && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" aria-label="Completed" />
                    )}
                  </div>
                  <span
                    className={`mt-1 text-xs font-extrabold line-clamp-1 ${
                      selected ? 'text-[#191944]' : 'text-white'
                    }`}
                  >
                    {tr.title}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Video Player & Animated Stage (Indigo-Gold Swirling Fire) */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#60A5FA]/35 bg-gradient-to-br from-[#0D1038] via-[#191D5E] to-[#0E1847] p-6 sm:p-8 shadow-[0_14px_34px_rgba(59,130,246,0.22)] text-white space-y-6">
          <SwirlFireBackdrop preset="indigo-gold" opacityClass="opacity-[0.36]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0D2E]/75 via-[#14184E]/35 to-transparent"
          />
          {/* Video Controls Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#7DD3FC] tabular-nums">
                Animated Video Lesson · {activeTrack.shortLabel} · Scene {stageIndex + 1} of{' '}
                {stages.length}
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">{stage.title}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  goToStage(Math.max(0, stageIndex - 1));
                }}
                disabled={stageIndex === 0}
                aria-label="Previous scene"
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-40 hover:border-[#7DD3FC] transition-colors"
              >
                <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                disabled={Boolean(checkpoint && !checkpointSolved && pausedAtCheckpoint)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#6366F1] px-4 py-2 text-xs font-black text-white shadow-sm disabled:opacity-45 hover:brightness-110 transition-all"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Pause Video</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Play Video</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setReplayNonce((n) => n + 1)}
                title="Replay this scene animation"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3.5 py-2 text-xs font-bold text-white hover:border-[#7DD3FC]"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#7DD3FC]" aria-hidden="true" />
                <span>Replay Animation</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioMuted((m) => !m)}
                aria-label={audioMuted ? 'Unmute voice narration' : 'Mute voice narration'}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3.5 py-2 text-xs font-bold text-white hover:border-[#7DD3FC]"
              >
                {audioMuted ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                    <span>Muted</span>
                  </>
                ) : voiceState === 'loading' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7DD3FC]" aria-hidden="true" />
                    <span>Loading Voice...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-[#7DD3FC]" aria-hidden="true" />
                    <span>{voiceState === 'speaking' ? 'Speaking' : 'Voice On'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setSpeechRate((r) => (r === 1 ? 1.25 : r === 1.25 ? 0.85 : 1))
                }
                className="rounded-full border border-white/20 bg-black/35 px-3 py-2 font-mono text-xs font-bold text-[#FDE047] hover:border-[#FDE047]"
              >
                {speechRate}x
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  goToStage(Math.min(stages.length - 1, stageIndex + 1));
                }}
                disabled={stageIndex >= stages.length - 1 || (Boolean(checkpoint) && !checkpointSolved)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-40 hover:border-[#7DD3FC]"
              >
                <span>Next</span>
                <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  goToStage(0);
                }}
                aria-label="Restart video lesson"
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-3 py-2 text-xs font-bold text-white/80 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {voiceError && (
            <div className="relative z-10 rounded-2xl border border-rose-400/50 bg-rose-950/70 px-4 py-3 text-xs font-bold text-rose-200">
              {voiceError}
            </div>
          )}

          {/* Scene Timeline Scrubber */}
          <div
            className="relative z-10 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
            aria-label="Video lesson scenes"
          >
            {stages.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (idx <= stageIndex || checkpointSolved) {
                    setIsPlaying(false);
                    goToStage(idx);
                  }
                }}
                className={`h-2.5 rounded-full transition-colors duration-200 ${
                  idx < stageIndex
                    ? 'bg-[#22D3EE]'
                    : idx === stageIndex
                      ? 'bg-gradient-to-r from-[#FDE047] to-[#22D3EE]'
                      : 'bg-white/20'
                }`}
                aria-label={`Jump to ${s.title}`}
              />
            ))}
          </div>

          {/* Animated Video Stage Canvas */}
          <div className="relative z-10 rounded-[22px] border border-white/15 bg-black/45 backdrop-blur-xs p-6 sm:p-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#c0bddc]">
              <span>
                {pausedAtCheckpoint
                  ? 'Video stopped automatically at checkpoint'
                  : isPlaying
                    ? 'Playing voice narration & step animation...'
                    : 'Press Play Video to watch with voice narration, or click Replay Animation'}
              </span>
              <span className="font-mono font-bold text-[#42dce8]">
                {stage.actionBadge ?? (checkpoint ? 'Checkpoint Inside' : 'Visual Scene')}
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-white sm:text-base">
              {stage.narration}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-block rounded-xl bg-black/35 px-4 py-2 font-mono text-xs text-[#ffd45f]">
                {stage.codeLine}
              </div>

              {stage.returnedValue && actionTriggered && (
                <motion.div
                  key={`${stage.id}-ret-${replayNonce}`}
                  initial={{ opacity: 0, scale: 0.85, x: -12 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#42dce8]/60 bg-[#42dce8]/15 px-3.5 py-2 font-mono text-xs font-bold text-[#42dce8]"
                >
                  <span>Returned:</span>
                  <span className="text-white">{stage.returnedValue}</span>
                </motion.div>
              )}
            </div>

            {/* Choreographed Visual Canvas */}
            <div className="mt-7 min-h-[180px] rounded-2xl border border-white/15 bg-black/20 p-5 sm:p-6 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${stage.id}-${replayNonce}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col items-center justify-center gap-4"
                >
                  {/* EMPTY LIST ANIMATION */}
                  {stage.animationKind === 'empty-list' && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: [0.95, 1.02, 1], opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-[#42dce8]/70 bg-white/5 px-8 py-6"
                    >
                      <span className="font-mono text-4xl font-black text-[#42dce8]">[</span>
                      <div className="text-center px-4">
                        <p className="font-mono text-sm font-bold text-[#dedcf3]">
                          empty list
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#ffd45f] tabular-nums">
                          len(nums) = 0
                        </p>
                      </div>
                      <span className="font-mono text-4xl font-black text-[#42dce8]">]</span>
                    </motion.div>
                  )}

                  {/* DICTIONARY KEY -> VALUE PAIR ANIMATION */}
                  {stage.animationKind === 'dict-pair' && (
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      {stage.items.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.25, duration: 0.35 }}
                          className="flex items-center gap-2 rounded-2xl border border-[#ffd45f]/50 bg-white/10 px-4 py-3"
                        >
                          <span className="font-mono text-sm font-bold text-[#ffd45f]">
                            {item.label}
                          </span>
                          <motion.span
                            animate={{ x: actionTriggered ? [0, 4, 0] : 0 }}
                            transition={{ duration: 0.5, delay: 0.3 + idx * 0.2 }}
                          >
                            <ArrowRight className="h-4 w-4 text-[#42dce8]" />
                          </motion.span>
                          <span className="rounded-lg bg-[#42dce8]/20 px-2.5 py-1 font-mono text-sm font-black text-white">
                            {item.pairValue}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* STANDARD & CHOREOGRAPHED LIST / TYPE BOXES */}
                  {stage.animationKind !== 'empty-list' &&
                    stage.animationKind !== 'dict-pair' && (
                      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                        {isListModule && (
                          <span className="font-mono text-3xl font-black text-[#42dce8] select-none">
                            [
                          </span>
                        )}

                        {stage.animationKind === 'tuple-lock' && (
                          <span className="font-mono text-3xl font-black text-[#ffd45f] select-none">
                            (
                          </span>
                        )}

                        {stage.animationKind === 'set-dedup' && (
                          <span className="font-mono text-3xl font-black text-[#42dce8] select-none">
                            &#123;
                          </span>
                        )}

                        <AnimatePresence mode="popLayout">
                          {visibleItems.map((item, idx) => {
                            const isJumpingIn =
                              (stage.animationKind === 'jump-in' ||
                                stage.animationKind === 'insert-shift') &&
                              item.added;

                            const isFadingOut =
                              actionTriggered &&
                              (item.removed || item.duplicate) &&
                              (stage.animationKind === 'pop-fade' ||
                                stage.animationKind === 'delete-fade' ||
                                stage.animationKind === 'set-dedup');

                            const isScannerHere =
                              stage.animationKind === 'index-scan' &&
                              scanIndex === idx;

                            const isHighlighted =
                              item.highlight || isScannerHere;

                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={
                                  isJumpingIn
                                    ? { opacity: 0, y: -58, scale: 0.55 }
                                    : { opacity: 0, scale: 0.9 }
                                }
                                animate={
                                  isFadingOut
                                    ? {
                                        opacity: 0.18,
                                        y: stage.animationKind === 'pop-fade' ? -36 : 10,
                                        scale: 0.72,
                                      }
                                    : stage.animationKind === 'tuple-lock' && actionTriggered
                                      ? { opacity: 1, x: [0, -4, 4, 0], scale: 1 }
                                      : {
                                          opacity: item.dimmed ? 0.38 : 1,
                                          y: isHighlighted ? -4 : 0,
                                          scale: isHighlighted ? 1.06 : 1,
                                        }
                                }
                                exit={{
                                  opacity: 0,
                                  y: stage.animationKind === 'pop-fade' ? -40 : 12,
                                  scale: 0.6,
                                  transition: { duration: 0.38 },
                                }}
                                transition={
                                  isJumpingIn
                                    ? {
                                        type: 'spring',
                                        stiffness: 320,
                                        damping: 17,
                                        delay: 0.45 + idx * 0.38,
                                      }
                                    : { duration: 0.45 }
                                }
                                className={`relative min-w-[96px] rounded-2xl border px-4 py-3.5 text-center ${
                                  isFadingOut
                                    ? 'border-rose-400/70 bg-rose-500/20'
                                    : isHighlighted
                                      ? 'border-[#ffd45f] bg-white/18 shadow-[0_0_24px_rgba(255,212,95,0.28)]'
                                      : 'border-white/20 bg-white/10'
                                }`}
                              >
                                {isScannerHere && (
                                  <span className="mb-1 block font-mono text-[10px] font-black uppercase tracking-wider text-[#42dce8]">
                                    Scanning
                                  </span>
                                )}

                                <div
                                  className={`font-mono text-base font-bold ${
                                    isFadingOut ? 'line-through text-rose-200' : 'text-white'
                                  }`}
                                >
                                  {item.label}
                                </div>
                                <div className="mt-1 font-mono text-[11px] text-[#ffd45f]">
                                  {item.tag}
                                </div>
                                {item.stateLabel && (
                                  <div className="mt-1 text-[10px] font-bold text-[#dedcf3]">
                                    {item.stateLabel}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>

                        {isListModule && (
                          <span className="font-mono text-3xl font-black text-[#42dce8] select-none">
                            ]
                          </span>
                        )}

                        {stage.animationKind === 'tuple-lock' && (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-3xl font-black text-[#ffd45f] select-none">
                              )
                            </span>
                            <Lock className="h-5 w-5 text-[#ffd45f]" aria-hidden="true" />
                          </div>
                        )}

                        {stage.animationKind === 'set-dedup' && (
                          <span className="font-mono text-3xl font-black text-[#42dce8] select-none">
                            &#125;
                          </span>
                        )}
                      </div>
                    )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Checkpoint Prompt */}
          {checkpoint && (
            <div className="relative z-10 rounded-2xl border border-white/15 bg-black/45 p-5 sm:p-6 backdrop-blur-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black tracking-wider uppercase text-[#7DD3FC]">
                  Checkpoint Question (Playback Pauses Here)
                </p>
                {!checkpointSolved && (
                  <span className="text-xs font-bold text-[#CBD5E1]">
                    Solve correctly to continue video
                  </span>
                )}
              </div>

              <h3 className="text-base font-extrabold text-white">{checkpoint.question}</h3>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {checkpoint.options.map((opt, idx) => {
                  const isPicked = selectedOption === idx;
                  const isRight = idx === checkpoint.correctIndex;
                  let style =
                    'border-white/20 bg-white/10 text-white hover:border-[#7DD3FC] hover:bg-white/15';

                  if (selectedOption !== null) {
                    if (isPicked && isRight) {
                      style = 'border-emerald-400 bg-emerald-950/80 text-emerald-100';
                    } else if (isPicked && !isRight) {
                      style = 'border-rose-400 bg-rose-950/80 text-rose-100';
                    } else if (isRight && selectedOption === checkpoint.correctIndex) {
                      style = 'border-emerald-400 bg-emerald-950/80 text-emerald-100';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAnswerCheckpoint(idx)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left font-mono text-xs font-semibold transition-colors ${style}`}
                    >
                      <span>{opt}</span>
                      {selectedOption !== null && isPicked && isRight && (
                        <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" aria-hidden="true" />
                      )}
                      {selectedOption !== null && isPicked && !isRight && (
                        <XCircle className="h-4 w-4 text-rose-400" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedOption !== null && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                    selectedOption === checkpoint.correctIndex
                      ? 'border-emerald-400/40 bg-emerald-950/75 text-emerald-100'
                      : 'border-rose-400/40 bg-rose-950/75 text-rose-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {selectedOption === checkpoint.correctIndex ? (
                      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    )}
                    <div>
                      <strong>
                        {selectedOption === checkpoint.correctIndex ? 'Correct: ' : 'Try again: '}
                      </strong>
                      {selectedOption === checkpoint.correctIndex
                        ? checkpoint.explanation
                        : 'Review the animation above and choose another answer.'}
                    </div>
                  </div>

                  {selectedOption === checkpoint.correctIndex && (
                    <button
                      type="button"
                      onClick={handleContinueAfterCheckpoint}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#6366F1] px-4 py-2 text-xs font-black text-white hover:brightness-110"
                    >
                      {isLastStage ? (
                        <>
                          <Award className="h-3.5 w-3.5" />
                          <span>Complete Video Lesson (+20 pts)</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>Continue Video</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Scene Footer Action for Completing Video Lesson */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
            <p className="text-xs font-semibold text-[#C7D2FE]">
              {isTrackCompleted
                ? `Completed "${activeTrack.title}"! Review the full breakdown and exam questions below.`
                : isLastStage
                  ? 'You reached the final scene — mark this video lesson complete to earn +20 pts!'
                  : `Scene ${stageIndex + 1} of ${stages.length} · Watch all scenes or review the full concept sheet below.`}
            </p>
            <button
              type="button"
              onClick={handleMarkVideoComplete}
              disabled={!checkpointSolved}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#40ddeb] via-[#7041ed] to-[#542bd5] px-5 py-2.5 text-xs font-black text-white shadow-sm disabled:opacity-45 hover:opacity-95 transition-opacity"
            >
              <Award className="h-4 w-4" aria-hidden="true" />
              <span>
                {isTrackCompleted ? 'Celebrate Completion Again' : 'Complete Video Lesson (+20 pts)'}
              </span>
            </button>
          </div>
        </div>

        {/* Elaborate Study Breakdown & Testable Exam Questions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Complete Concept Coverage */}
          <section
            aria-label="Detailed concepts covered in this video"
            className="relative overflow-hidden lg:col-span-5 rounded-[24px] border border-[#A855F7]/35 bg-gradient-to-br from-[#160B33] via-[#26114B] to-[#110829] p-6 shadow-[0_14px_34px_rgba(124,58,237,0.2)] text-white space-y-4"
          >
            <SwirlFireBackdrop preset="violet" opacityClass="opacity-[0.38]" />
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-[#DDD6FE]">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#C4B5FD]">
                  Complete Topic Coverage
                </p>
                <h3 className="text-base font-black text-white">
                  Key Concepts &amp; Rules
                </h3>
              </div>
            </div>

            <ul className="relative z-10 space-y-2.5">
              {activeTrack.detailedConcepts.map((concept, idx) => (
                <li
                  key={`${activeTrack.id}-concept-${idx}`}
                  className="flex items-start gap-2.5 rounded-2xl border border-white/12 bg-black/40 px-3.5 py-3 text-xs leading-relaxed text-white/95 backdrop-blur-xs"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#7041ed] font-mono text-[10px] font-black text-white">
                    {idx + 1}
                  </span>
                  <span>{concept}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Likely Exam & Quiz Questions From This Video */}
          <section
            aria-label="Questions that can be asked from this video"
            className="relative overflow-hidden lg:col-span-7 rounded-[24px] border border-[#FB923C]/35 bg-gradient-to-br from-[#230907] via-[#45130B] to-[#280A19] p-6 shadow-[0_14px_34px_rgba(249,115,22,0.2)] text-white space-y-4"
          >
            <SwirlFireBackdrop preset="crimson-gold" opacityClass="opacity-[0.38]" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#F59E0B]/20 text-[#FDE047]">
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#FDBA74]">
                    Exam &amp; Quiz Prep
                  </p>
                  <h3 className="text-base font-black text-white">
                    Questions That Can Be Asked From This Video
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const allOpen = activeTrack.examQuestions.every((_, i) => revealedQuestions[i]);
                  const next: Record<number, boolean> = {};
                  activeTrack.examQuestions.forEach((_, i) => {
                    next[i] = !allOpen;
                  });
                  setRevealedQuestions(next);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-[#FDE047]/35 bg-black/40 px-3 py-1.5 text-[11px] font-extrabold text-[#FEF08A] hover:bg-black/60"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>
                  {activeTrack.examQuestions.every((_, i) => revealedQuestions[i])
                    ? 'Hide All Answers'
                    : 'Reveal All Answers'}
                </span>
              </button>
            </div>

            <div className="relative z-10 space-y-3">
              {activeTrack.examQuestions.map((item, idx) => {
                const isOpen = Boolean(revealedQuestions[idx]);
                return (
                  <div
                    key={`${activeTrack.id}-eq-${idx}`}
                    className="rounded-2xl border border-white/15 bg-black/45 overflow-hidden backdrop-blur-xs transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedQuestions((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }))
                      }
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 rounded-md bg-[#F59E0B] px-1.5 py-0.5 font-mono text-[10px] font-black text-[#230907] shrink-0">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs font-extrabold text-white sm:text-sm">
                          {item.q}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-[#FDE047]" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-[#FDE047]" aria-hidden="true" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/10 bg-black/60 px-4 py-3.5 space-y-2 text-xs">
                        <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/35 px-3 py-2 text-emerald-200">
                          <span className="font-black uppercase tracking-wider text-[10px] block text-emerald-400">
                            Expected Answer
                          </span>
                          <span className="font-mono font-bold text-xs text-white">{item.answer}</span>
                        </div>
                        <p className="text-white/90 leading-relaxed">
                          <strong className="text-[#FDE047]">Why / Exam Trap:</strong> {item.note}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </MotionConfig>
  );
};
