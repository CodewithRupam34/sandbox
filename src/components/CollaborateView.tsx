import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  HelpCircle,
  Play,
  Send,
  Users,
  XCircle,
} from 'lucide-react';
import { QUESTION_BANK } from '../data/curriculum';
import { AuthUser, LibrarySnippet, TopicId } from '../types/learning';
import { runPythonCode } from '../utils/pythonRunner';
import { SwirlFireBackdrop, SwirlFirePreset } from './SwirlFireBackdrop';

interface RoomParticipant {
  clientId: string;
  name: string;
  score: number;
  answeredIndices: number[];
  isHost: boolean;
}

interface RoomChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface CollabRoomState {
  code: string;
  mode: 'quiz' | 'code';
  topic: TopicId;
  hostClientId: string;
  status: 'lobby' | 'active' | 'finished';
  currentQuestionIndex: number;
  quizQuestionIds: string[];
  sharedCode: string;
  sharedOutput: string[];
  sharedError: string | null;
  lastUpdatedBy: string;
  participants: RoomParticipant[];
  chat: RoomChatMessage[];
}

interface CollaborateViewProps {
  user: AuthUser | null;
  authToken: string | null;
  initialRoomCode?: string | null;
  onBack: () => void;
  onAwardPoints: (amount: number, reason: string) => void;
  onCelebrate?: (title: string, subtitle: string, badgeText?: string) => void;
}

export const CollaborateView: React.FC<CollaborateViewProps> = ({
  user,
  authToken,
  initialRoomCode,
  onBack,
  onAwardPoints,
  onCelebrate,
}) => {
  const [collabTab, setCollabTab] = useState<'quiz' | 'code'>('quiz');
  const [topic, setTopic] = useState<TopicId>('lists');
  const [guestName, setGuestName] = useState(user?.name ?? 'Learner');
  const [joinCode, setJoinCode] = useState(initialRoomCode ?? '');
  const [wsConnected, setWsConnected] = useState(false);
  const [clientId, setClientId] = useState<string>('');
  const [room, setRoom] = useState<CollabRoomState | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [pickedQuizOption, setPickedQuizOption] = useState<number | null>(null);
  const [localSharedCode, setLocalSharedCode] = useState('');
  const [chatText, setChatText] = useState('');
  const [librarySnippets, setLibrarySnippets] = useState<LibrarySnippet[]>([]);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isRemoteCodeUpdateRef = useRef(false);

  useEffect(() => {
    if (user?.name) setGuestName(user.name);
  }, [user]);

  useEffect(() => {
    fetch('/api/library')
      .then((r) => r.json())
      .then((data: { snippets?: LibrarySnippet[] }) => {
        if (Array.isArray(data.snippets)) setLibrarySnippets(data.snippets);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      if (initialRoomCode) {
        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomCode: initialRoomCode.toUpperCase(),
            name: (user?.name ?? guestName).trim() || 'Friend',
          })
        );
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        if (msg.type === 'session:init' && typeof msg.clientId === 'string') {
          setClientId(msg.clientId);
        } else if (msg.type === 'room:error' && typeof msg.message === 'string') {
          setRoomError(msg.message);
        } else if (msg.type === 'room:state' && msg.room) {
          const nextRoom = msg.room as CollabRoomState;
          setRoom(nextRoom);
          setRoomError(null);
          setCollabTab(nextRoom.mode);
          isRemoteCodeUpdateRef.current = true;
          setLocalSharedCode(nextRoom.sharedCode);
        } else if (msg.type === 'code:synced' && typeof msg.code === 'string') {
          isRemoteCodeUpdateRef.current = true;
          setLocalSharedCode(msg.code);
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  sharedCode: msg.code as string,
                  lastUpdatedBy:
                    typeof msg.updatedBy === 'string' ? msg.updatedBy : prev.lastUpdatedBy,
                }
              : prev
          );
        }
      } catch {
        // Ignore invalid WS messages
      }
    };

    return () => {
      ws.close();
    };
  }, [initialRoomCode]);

  const prevRoomStatusRef = useRef<string | null>(null);

  useEffect(() => {
    setPickedQuizOption(null);
  }, [room?.currentQuestionIndex, room?.status]);

  useEffect(() => {
    const currentStatus = room?.status ?? null;
    if (prevRoomStatusRef.current === 'active' && currentStatus === 'finished') {
      onCelebrate?.(
        'Quiz Battle Complete!',
        'Awesome teamwork! Check the live scoreboard for the final standings.',
        'Friend Quiz Complete'
      );
    }
    prevRoomStatusRef.current = currentStatus;
  }, [room?.status, onCelebrate]);

  const sendWs = (payload: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const handleCreateRoom = (mode: 'quiz' | 'code') => {
    setRoomError(null);
    const displayName = guestName.trim() || 'Learner';
    const questionIds = QUESTION_BANK[topic].slice(0, 6).map((q) => q.id);
    const initialCode =
      topic === 'lists'
        ? `# Collaborative Python Library — Lists\nscores = [75, 88, 92, 64]\nscores.append(99)\nprint("Sorted:", sorted(scores))`
        : `# Collaborative Python Library — Data Types\nprofile = {"name": "Team", "active": True}\nprint(type(profile), profile)`;

    sendWs({
      type: 'room:create',
      mode,
      topic,
      name: displayName,
      questionIds,
      initialCode,
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setRoomError(null);
    if (!joinCode.trim()) return;
    sendWs({
      type: 'room:join',
      roomCode: joinCode.trim().toUpperCase(),
      name: guestName.trim() || 'Friend',
    });
  };

  const handleCopyInvite = async () => {
    if (!room) return;
    const inviteUrl = `${window.location.origin}/?room=${room.code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Room code displayed directly on screen as fallback
    }
  };

  const allQuestionsMap = useMemo(() => {
    const map = new Map<string, (typeof QUESTION_BANK)['types'][number]>();
    [...QUESTION_BANK.types, ...QUESTION_BANK.lists].forEach((q) => map.set(q.id, q));
    return map;
  }, []);

  const activeQuizQuestion =
    room && room.mode === 'quiz'
      ? allQuestionsMap.get(room.quizQuestionIds[room.currentQuestionIndex] ?? '')
      : undefined;

  const isHost = Boolean(room && room.hostClientId === clientId);

  const handleAnswerCollabQuiz = (optIdx: number) => {
    if (!room || !activeQuizQuestion || pickedQuizOption !== null) return;
    setPickedQuizOption(optIdx);
    const isCorrect = optIdx === activeQuizQuestion.correctIndex;
    sendWs({
      type: 'quiz:answer',
      questionIndex: room.currentQuestionIndex,
      isCorrect,
    });
    if (isCorrect) {
      onAwardPoints(20, 'Collaborative quiz correct answer');
    } else {
      onAwardPoints(5, 'Collaborative quiz participation');
    }
  };

  const handleCodeChange = (next: string) => {
    setLocalSharedCode(next);
    if (isRemoteCodeUpdateRef.current) {
      isRemoteCodeUpdateRef.current = false;
    }
    sendWs({ type: 'code:update', code: next });
  };

  const handleRunSharedCode = () => {
    const res = runPythonCode(localSharedCode);
    sendWs({
      type: 'code:output',
      output: res.output,
      error: res.error,
    });
    onAwardPoints(10, 'Collaborative code run');
  };

  const handleSaveToLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedTitle = snippetTitle.trim();
    if (!savedTitle || !localSharedCode.trim()) return;
    setSaveNotice(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/library', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: savedTitle,
          topic: room?.topic ?? topic,
          code: localSharedCode,
          authorName: guestName.trim() || 'Learner',
        }),
      });
      const data = (await res.json()) as { snippets?: LibrarySnippet[]; error?: string };
      if (res.ok && data.snippets) {
        setLibrarySnippets(data.snippets);
        setSnippetTitle('');
        setSaveNotice('Saved to shared Python library (+15 pts)');
        onAwardPoints(15, 'Published snippet to shared library');
        onCelebrate?.(
          'Project Published!',
          `"${savedTitle}" was added to the Shared Code Library.`,
          '+15 pts · Collab Project'
        );
      } else {
        setSaveNotice(data.error ?? 'Could not save snippet.');
      }
    } catch {
      setSaveNotice('Network error while saving snippet.');
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    sendWs({ type: 'room:chat', text: chatText.trim() });
    setChatText('');
  };

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7557F6] hover:text-[#5B3EE0] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Previous Page</span>
        </button>

        <p className="mt-4 text-xs font-bold tracking-[0.16em] uppercase text-[#7557F6]">
          Real-Time Friend Sessions
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold text-[#29243B] sm:text-4xl">
          Collaborate &amp; Invite Friends
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#575070]">
          Launch a synchronized quiz battle or co-develop Python scripts inside the shared Code Library with friends.
        </p>
      </div>

      {/* Lobby / Join Bar when not inside a room */}
      {!room ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Create Room — Violet Swirling Fire */}
          <div className="relative overflow-hidden lg:col-span-7 rounded-[24px] border border-[#A855F7]/35 bg-gradient-to-br from-[#160B33] via-[#27114E] to-[#11092B] p-6 shadow-[0_14px_34px_rgba(124,58,237,0.22)] text-white space-y-5">
            <SwirlFireBackdrop preset="violet" opacityClass="opacity-[0.38]" />
            <div className="relative z-10 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white">Start a Friend Room</h2>
              <span className="text-xs font-bold text-[#6EE7B7]">
                {wsConnected ? 'Live sync ready' : 'Connecting...'}
              </span>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="collab-name" className="block text-xs font-bold text-[#DDD6FE]">
                  Your Display Name
                </label>
                <input
                  id="collab-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/20 bg-black/45 px-3.5 py-2 text-sm text-white placeholder:text-white/45 focus:border-[#A78BFA] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="collab-topic" className="block text-xs font-bold text-[#DDD6FE]">
                  Python Topic
                </label>
                <select
                  id="collab-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as TopicId)}
                  className="w-full rounded-xl border border-white/20 bg-[#1B103A] px-3.5 py-2 text-sm text-white focus:border-[#A78BFA] focus:outline-none"
                >
                  <option value="types">Module 01 · Python Data Types</option>
                  <option value="lists">Module 02 · Python Lists</option>
                </select>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={!wsConnected}
                onClick={() => handleCreateRoom('quiz')}
                className="flex flex-col items-start gap-2 rounded-2xl border border-white/20 bg-black/40 p-4 text-left backdrop-blur-xs hover:border-[#A78BFA] hover:bg-black/55 transition-colors disabled:opacity-50"
              >
                <HelpCircle className="h-5 w-5 text-[#C4B5FD]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-white">Invite for Quiz Battle</p>
                  <p className="mt-1 text-xs text-[#DDD6FE]">
                    Compete live on synchronized questions and track scores.
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={!wsConnected}
                onClick={() => handleCreateRoom('code')}
                className="flex flex-col items-start gap-2 rounded-2xl border border-white/20 bg-black/40 p-4 text-left backdrop-blur-xs hover:border-[#F472B6] hover:bg-black/55 transition-colors disabled:opacity-50"
              >
                <Code2 className="h-5 w-5 text-[#F472B6]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-white">Develop in Code Library</p>
                  <p className="mt-1 text-xs text-[#FBCFE8]">
                    Co-edit Python code live, run outputs together, and save snippets.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Join Existing Room — Blue-Cyan Swirling Fire */}
          <div className="relative overflow-hidden lg:col-span-5 rounded-[24px] border border-[#22D3EE]/35 bg-gradient-to-br from-[#061830] via-[#0B254B] to-[#082B36] p-6 shadow-[0_14px_34px_rgba(14,165,233,0.2)] text-white space-y-5">
            <SwirlFireBackdrop preset="blue-cyan" opacityClass="opacity-[0.40]" />
            <h2 className="relative z-10 text-lg font-extrabold text-white">
              Join with an Invite Code
            </h2>
            <p className="relative z-10 text-xs leading-relaxed text-[#BAE6FD]">
              Enter the 6-character code shared by a friend to enter their live quiz or collaborative code editor.
            </p>

            <form onSubmit={handleJoinRoom} className="relative z-10 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="join-room-code" className="block text-xs font-bold text-[#7DD3FC]">
                  Room Code
                </label>
                <input
                  id="join-room-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PY48K2"
                  maxLength={8}
                  className="w-full rounded-xl border border-white/25 bg-black/45 px-3.5 py-2.5 font-mono text-sm font-bold uppercase tracking-widest text-[#67E8F9] placeholder:text-white/40 focus:border-[#22D3EE] focus:outline-none"
                />
              </div>

              {roomError && (
                <p className="rounded-xl border border-rose-400/50 bg-rose-950/75 px-3 py-2 text-xs text-rose-200">
                  {roomError}
                </p>
              )}

              <button
                type="submit"
                disabled={!wsConnected || !joinCode.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#3B82F6] px-5 py-2.5 text-xs font-black text-[#04182B] shadow-sm hover:brightness-110 disabled:opacity-50 transition-all"
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Active Room Banner + Mode Workspace */
        <div className="space-y-6">
          <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[#60A5FA]/35 bg-gradient-to-br from-[#0D1038] via-[#191D5E] to-[#0E1847] px-5 py-4 shadow-[0_14px_34px_rgba(59,130,246,0.2)] text-white">
            <SwirlFireBackdrop preset="indigo-gold" opacityClass="opacity-[0.38]" />
            <div className="relative z-10 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-[11px] font-bold text-[#BAE6FD]">Invite Code</p>
                <p className="font-mono text-xl font-extrabold tracking-widest text-[#FDE047]">
                  {room.code}
                </p>
              </div>
              <div className="h-8 w-px bg-white/20 hidden sm:block" />
              <div className="text-xs text-[#C7D2FE]">
                <span className="font-bold text-white">
                  {room.mode === 'quiz' ? 'Live Quiz Battle' : 'Collaborative Code Library'}
                </span>
                <span className="mx-2 text-white/40">·</span>
                <span>{room.participants.length} online</span>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#7DD3FC]/40 bg-black/40 px-3.5 py-2 text-xs font-bold text-[#7DD3FC] hover:border-[#7DD3FC] transition-colors"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Invite Link Copied' : 'Copy Invite Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setRoom(null)}
                className="rounded-xl border border-white/25 bg-black/35 px-3.5 py-2 text-xs font-semibold text-white hover:border-rose-400 transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>

          {collabTab === 'quiz' && room.mode === 'quiz' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Main Quiz Stage — Violet Swirling Fire */}
              <div className="relative overflow-hidden lg:col-span-8 rounded-[24px] border border-[#A855F7]/35 bg-gradient-to-br from-[#160B33] via-[#27114E] to-[#11092B] p-6 shadow-[0_14px_34px_rgba(124,58,237,0.22)] text-white space-y-6">
                <SwirlFireBackdrop preset="violet" opacityClass="opacity-[0.38]" />
                {room.status === 'lobby' && (
                  <div className="relative z-10 space-y-4 py-4">
                    <h2 className="font-display text-xl font-bold text-white">
                      Waiting for friends to join...
                    </h2>
                    <p className="text-sm text-[#DDD6FE]">
                      Share code <strong className="font-mono text-[#FDE047]">{room.code}</strong> or copy the invite link above. When everyone is ready, the host can start the quiz.
                    </p>
                    {isHost ? (
                      <button
                        type="button"
                        onClick={() => sendWs({ type: 'quiz:start' })}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7557F6] to-[#B45BFF] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110"
                      >
                        <Play className="h-4 w-4" />
                        <span>Start Quiz for Everyone</span>
                      </button>
                    ) : (
                      <p className="text-xs font-bold text-[#C4B5FD]">
                        Waiting for host to start the match...
                      </p>
                    )}
                  </div>
                )}

                {room.status === 'active' && activeQuizQuestion && (
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between text-xs text-[#DDD6FE] tabular-nums">
                      <span className="font-bold text-[#FDE047]">
                        Question {room.currentQuestionIndex + 1} of {room.quizQuestionIds.length}
                      </span>
                      <span>{activeQuizQuestion.subtopic}</span>
                    </div>

                    <h2 className="text-lg font-bold text-white">
                      {activeQuizQuestion.question}
                    </h2>

                    <div className="space-y-2.5">
                      {activeQuizQuestion.options.map((opt, idx) => {
                        const isPicked = pickedQuizOption === idx;
                        const isRight = idx === activeQuizQuestion.correctIndex;
                        let style =
                          'border-white/20 bg-black/40 text-white hover:border-[#A78BFA] hover:bg-black/55';
                        if (pickedQuizOption !== null) {
                          if (isRight) style = 'border-emerald-400 bg-emerald-950/80 text-emerald-100';
                          else if (isPicked) style = 'border-rose-400 bg-rose-950/80 text-rose-100';
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={pickedQuizOption !== null}
                            onClick={() => handleAnswerCollabQuiz(idx)}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left font-mono text-xs font-semibold transition-colors ${style}`}
                          >
                            <span>{opt}</span>
                            {pickedQuizOption !== null && isRight && (
                              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                            )}
                            {pickedQuizOption !== null && isPicked && !isRight && (
                              <XCircle className="h-4 w-4 text-rose-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isHost && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => sendWs({ type: 'quiz:next' })}
                          className="rounded-xl bg-gradient-to-r from-[#7557F6] to-[#B45BFF] px-5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
                        >
                          {room.currentQuestionIndex + 1 >= room.quizQuestionIds.length
                            ? 'Finish Match'
                            : 'Advance Everyone to Next Question'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {room.status === 'finished' && (
                  <div className="relative z-10 space-y-4">
                    <h2 className="font-display text-2xl font-extrabold text-white">
                      Quiz Match Complete
                    </h2>
                    <p className="text-sm text-[#DDD6FE]">
                      Final standings are shown on the live scoreboard.
                    </p>
                    {isHost && (
                      <button
                        type="button"
                        onClick={() => sendWs({ type: 'quiz:start' })}
                        className="rounded-xl bg-gradient-to-r from-[#7557F6] to-[#B45BFF] px-5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
                      >
                        Play Another Round
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Live Scoreboard — Emerald-Cyan Swirling Fire */}
              <div className="relative overflow-hidden lg:col-span-4 rounded-[24px] border border-[#34D399]/35 bg-gradient-to-br from-[#04241E] via-[#073B32] to-[#062C42] p-6 shadow-[0_14px_34px_rgba(16,185,129,0.2)] text-white space-y-4">
                <SwirlFireBackdrop preset="emerald-cyan" opacityClass="opacity-[0.38]" />
                <h3 className="relative z-10 flex items-center gap-2 text-base font-extrabold text-white">
                  <Users className="h-4 w-4 text-[#5EEAD4]" />
                  <span>Live Scoreboard</span>
                </h3>
                <div className="relative z-10 space-y-2.5">
                  {[...room.participants]
                    .sort((a, b) => b.score - a.score)
                    .map((p, idx) => (
                      <div
                        key={p.clientId}
                        className="flex items-center justify-between rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-xs backdrop-blur-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[#5EEAD4] tabular-nums">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-white">
                            {p.name}
                            {p.clientId === clientId ? ' (You)' : ''}
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-[#FDE047] tabular-nums">
                          {p.score} pts
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {collabTab === 'code' && room.mode === 'code' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Shared Editor + Output */}
              <div className="lg:col-span-8 space-y-5">
                <div className="relative overflow-hidden rounded-[24px] border border-[#A855F7]/35 bg-gradient-to-br from-[#160B33] via-[#27114E] to-[#11092B] p-5 shadow-[0_14px_34px_rgba(124,58,237,0.22)] text-white space-y-4">
                  <SwirlFireBackdrop preset="violet" opacityClass="opacity-[0.36]" />
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-white">
                        Shared Python Editor
                      </h2>
                      <p className="text-xs text-[#DDD6FE]">
                        Last edit by {room.lastUpdatedBy} · Changes sync live with everyone in the room
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunSharedCode}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7557F6] to-[#B45BFF] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Run for Room</span>
                    </button>
                  </div>

                  <textarea
                    value={localSharedCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    rows={12}
                    spellCheck={false}
                    aria-label="Collaborative Python editor"
                    className="relative z-10 code-editor w-full rounded-2xl border border-white/20 bg-[#120E24]/95 p-4 font-mono text-[13px] leading-relaxed text-[#C7F9EC] focus:border-[#A78BFA] focus:outline-none"
                  />

                  <div className="relative z-10 rounded-2xl border border-white/15 bg-black/65 p-4 font-mono text-xs">
                    <p className="text-[#C4B5FD] font-semibold">Shared Output</p>
                    {room.sharedError ? (
                      <pre className="mt-2 whitespace-pre-wrap text-[#FF9EAA]">
                        {room.sharedError}
                      </pre>
                    ) : room.sharedOutput.length > 0 ? (
                      <pre className="mt-2 whitespace-pre-wrap text-[#6EE7B7]">
                        {room.sharedOutput.join('\n')}
                      </pre>
                    ) : (
                      <p className="mt-2 text-[#9E95B8]">
                        Click &ldquo;Run for Room&rdquo; to execute and broadcast output.
                      </p>
                    )}
                  </div>
                </div>

                {/* Save to Shared Library — Blue-Cyan Swirling Fire */}
                <form
                  onSubmit={handleSaveToLibrary}
                  className="relative overflow-hidden flex flex-wrap items-center gap-3 rounded-[20px] border border-[#22D3EE]/35 bg-gradient-to-br from-[#061830] via-[#0B254B] to-[#082B36] p-4 shadow-md text-white"
                >
                  <SwirlFireBackdrop preset="blue-cyan" opacityClass="opacity-[0.38]" />
                  <input
                    type="text"
                    value={snippetTitle}
                    onChange={(e) => setSnippetTitle(e.target.value)}
                    placeholder="Snippet title to publish in Shared Library..."
                    className="relative z-10 min-w-[220px] flex-1 rounded-xl border border-white/20 bg-black/45 px-3.5 py-2 text-xs text-white placeholder:text-white/45 focus:border-[#22D3EE] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="relative z-10 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#3B82F6] px-4 py-2 text-xs font-black text-[#04182B] hover:brightness-110"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    <span>Save to Library (+15 pts)</span>
                  </button>
                  {saveNotice && (
                    <p className="relative z-10 w-full text-xs font-semibold text-[#6EE7B7]">
                      {saveNotice}
                    </p>
                  )}
                </form>
              </div>

              {/* Collaborators & Room Chat */}
              <div className="lg:col-span-4 space-y-5">
                <div className="relative overflow-hidden rounded-[24px] border border-[#34D399]/35 bg-gradient-to-br from-[#04241E] via-[#073B32] to-[#062C42] p-5 shadow-[0_14px_34px_rgba(16,185,129,0.2)] text-white space-y-3">
                  <SwirlFireBackdrop preset="emerald-cyan" opacityClass="opacity-[0.38]" />
                  <h3 className="relative z-10 text-sm font-extrabold text-white">
                    Collaborators ({room.participants.length})
                  </h3>
                  <div className="relative z-10 space-y-2">
                    {room.participants.map((p) => (
                      <div
                        key={p.clientId}
                        className="flex items-center justify-between rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs backdrop-blur-xs"
                      >
                        <span className="font-semibold text-white">
                          {p.name}
                          {p.clientId === clientId ? ' (You)' : ''}
                        </span>
                        <span className="font-bold text-[#5EEAD4]">
                          {p.isHost ? 'Host' : 'Editor'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden flex flex-col rounded-[24px] border border-[#FB923C]/40 bg-gradient-to-br from-[#230907] via-[#45130B] to-[#26091B] p-5 shadow-[0_14px_34px_rgba(249,115,22,0.22)] text-white space-y-3">
                  <SwirlFireBackdrop preset="crimson-gold" opacityClass="opacity-[0.38]" />
                  <h3 className="relative z-10 text-sm font-extrabold text-white">
                    Room Notes &amp; Chat
                  </h3>
                  <div className="relative z-10 max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
                    {room.chat.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-xs"
                      >
                        <span className="font-bold text-[#FDE047]">{c.sender}: </span>
                        <span className="text-white/90">{c.text}</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChat} className="relative z-10 flex gap-2 pt-1">
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Message collaborators..."
                      className="flex-1 rounded-xl border border-white/20 bg-black/45 px-3 py-2 text-xs text-white placeholder:text-white/45 focus:border-[#FB923C] focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Send message"
                      className="rounded-xl bg-gradient-to-r from-[#F97316] to-[#FBBF24] px-3 py-2 text-[#230907] hover:brightness-110"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shared Code Library Catalog — Each card uses a distinct remaining fire preset */}
      <section className="space-y-4 border-t border-[#7557F6]/15 pt-7">
        <div>
          <h2 className="font-display text-xl font-bold text-[#29243B]">Shared Code Library</h2>
          <p className="mt-1 text-xs text-[#6A6382]">
            Community Python scripts saved during collaborative sessions. Click Load into Room when inside a collaborative coding session.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {librarySnippets.map((snippet, idx) => {
            const libraryStyles: Array<{
              preset: SwirlFirePreset;
              shell: string;
              badge: string;
            }> = [
              {
                preset: 'rose-amber',
                shell: 'border-[#FB7185]/35 from-[#2A061A] via-[#500724] to-[#581C0C]',
                badge: 'text-[#FDBA74]',
              },
              {
                preset: 'lime-teal',
                shell: 'border-[#A3E635]/35 from-[#0A220B] via-[#0E3A2D] to-[#083344]',
                badge: 'text-[#BEF264]',
              },
              {
                preset: 'magenta-pink',
                shell: 'border-[#F472B6]/35 from-[#2B072D] via-[#4A084E] to-[#1D0B42]',
                badge: 'text-[#FBCFE8]',
              },
              {
                preset: 'sapphire-gold',
                shell: 'border-[#38BDF8]/35 from-[#061C3D] via-[#0B335E] to-[#102657]',
                badge: 'text-[#7DD3FC]',
              },
            ];
            const style = libraryStyles[idx % libraryStyles.length];
            return (
              <div
                key={snippet.id}
                className={`relative overflow-hidden flex flex-col justify-between rounded-[22px] border bg-gradient-to-br ${style.shell} p-5 shadow-md text-white space-y-3`}
              >
                <SwirlFireBackdrop preset={style.preset} opacityClass="opacity-[0.38]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 text-xs text-white/80">
                    <span className={`font-extrabold ${style.badge}`}>
                      {snippet.topic === 'lists' ? 'Python Lists' : 'Data Types'}
                    </span>
                    <span>by {snippet.authorName}</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-extrabold text-white">{snippet.title}</h3>
                  <pre className="mt-3 max-h-36 overflow-auto rounded-xl border border-white/15 bg-black/60 p-3 font-mono text-xs text-[#C7F9EC]">
                    <code>{snippet.code}</code>
                  </pre>
                </div>

                {room && room.mode === 'code' && (
                  <button
                    type="button"
                    onClick={() => handleCodeChange(snippet.code)}
                    className="relative z-10 self-start rounded-xl border border-white/25 bg-black/45 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white hover:text-[#191944] transition-colors"
                  >
                    Load into Shared Editor
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
