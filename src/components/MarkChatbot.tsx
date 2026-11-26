import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { InterfaceLanguage, TopicId } from '../types/learning';
import { t } from '../utils/i18n';
import { playGeminiVoice, stopGeminiVoice } from '../utils/voicePlayer';
import { MarkBrainLogo } from './MarkBrainLogo';

interface ChatMessage {
  id: string;
  role: 'mark' | 'user';
  text: string;
  isError?: boolean;
}

interface MarkChatbotProps {
  activeTopic: TopicId;
  preferredLanguage: InterfaceLanguage;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'mark-welcome',
  role: 'mark',
  text: "Hi! I'm MARK, your Python study buddy. Ask me any doubt about Python Data Types or Python Lists!",
};

const STARTER_PROMPTS = [
  'Difference between list and tuple?',
  'Why does numbers[1:3] skip index 3?',
  'remove() vs pop() in Python?',
  'Why is bool("False") True?',
];

function renderInlineSegments(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="rounded bg-[#e8dcff] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#352078]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-black text-[#191944]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderFormattedText(text: string): React.ReactNode {
  const segments = text.split(/```(?:python|py)?\n?([\s\S]*?)```/g);
  return segments.map((seg, idx) => {
    if (idx % 2 === 1) {
      return (
        <pre
          key={idx}
          className="my-2 overflow-x-auto rounded-xl bg-[#17183e] p-3 font-mono text-[11px] leading-relaxed text-[#42dce8]"
        >
          <code>{seg.trim()}</code>
        </pre>
      );
    }
    if (!seg.trim()) return null;
    return (
      <span key={idx} className="whitespace-pre-wrap">
        {renderInlineSegments(seg)}
      </span>
    );
  });
}

export const MarkChatbot: React.FC<MarkChatbotProps> = ({
  activeTopic,
  preferredLanguage,
  isOpen,
  onToggleOpen,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 8;
    setCanScrollUp(hasOverflow && el.scrollTop > 16);
    setCanScrollDown(hasOverflow && el.scrollTop + el.clientHeight < el.scrollHeight - 16);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const timer = window.setTimeout(updateScrollState, 50);
    return () => window.clearTimeout(timer);
  }, [messages, isOpen, loading, updateScrollState]);

  useEffect(() => {
    return () => {
      stopGeminiVoice();
    };
  }, []);

  const handleScrollUp = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: -180, behavior: 'smooth' });
  };

  const handleScrollDown = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const handleResetChat = () => {
    stopGeminiVoice();
    setSpeakingMsgId(null);
    setLoadingVoiceId(null);
    setVoiceError(null);
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  };

  const handleToggleVoice = (msg: ChatMessage) => {
    setVoiceError(null);
    if (speakingMsgId === msg.id || loadingVoiceId === msg.id) {
      stopGeminiVoice();
      setSpeakingMsgId(null);
      setLoadingVoiceId(null);
      return;
    }

    setLoadingVoiceId(msg.id);
    setSpeakingMsgId(null);
    void playGeminiVoice({
      text: msg.text,
      preferredLanguage,
      onStart: () => {
        setLoadingVoiceId(null);
        setSpeakingMsgId(msg.id);
      },
      onEnd: () => {
        setLoadingVoiceId(null);
        setSpeakingMsgId(null);
      },
      onError: (errText) => {
        setLoadingVoiceId(null);
        setSpeakingMsgId(null);
        setVoiceError(errText);
      },
    });
  };

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const priorHistory = messages
      .filter((m) => !m.isError && m.id !== WELCOME_MESSAGE.id)
      .slice(-8)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setVoiceError(null);

    try {
      const res = await fetch('/api/mark/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          activeTopic,
          preferredLanguage,
          history: priorHistory,
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'mark',
            text: data.error ?? 'Sorry, I could not answer right now.',
            isError: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            role: 'mark',
            text: data.reply!,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'mark',
          text: 'Network error reaching MARK. Please try again.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  return (
    <>
      {/* Floating Launcher Button (desktop & tablet) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => onToggleOpen(true)}
          aria-label="Ask MARK chatbot"
          className="fixed bottom-20 right-5 z-40 hidden md:inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#40ddeb] to-[#7041ed] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_32px_rgba(112,65,237,0.4)] transition-transform duration-150 hover:-translate-y-0.5 lg:bottom-6 lg:right-6"
        >
          <MarkBrainLogo className="h-9 w-9 shrink-0 drop-shadow-[0_2px_8px_rgba(23,24,62,0.35)]" />
          <span>Ask MARK</span>
        </button>
      )}

      {/* Compact MARK Chat Drawer */}
      {isOpen && (
        <aside
          aria-label="MARK Python Doubt Assistant"
          className="fixed bottom-20 right-4 z-50 flex h-[500px] max-h-[calc(100vh-6.5rem)] w-[calc(100vw-2rem)] max-w-[395px] flex-col overflow-hidden rounded-[24px] border border-[#e3dcf5] bg-white shadow-[0_18px_50px_rgba(23,24,62,0.28)] lg:bottom-6 lg:right-6"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-[#17183e] px-5 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#40ddeb]/20 to-[#7041ed]/40 border border-[#42dce8]/45">
                <MarkBrainLogo className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-sm font-black leading-tight">MARK</h2>
                <p className="text-[11px] font-semibold text-[#c0bddc]">
                  Data Types &amp; Lists · Pegasus Voice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                aria-label="Clear chat history"
                title="New chat"
                className="rounded-lg p-1.5 text-[#dedcf3] hover:bg-white/15 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  stopGeminiVoice();
                  onToggleOpen(false);
                }}
                aria-label="Close MARK chat"
                className="rounded-lg p-1.5 text-[#dedcf3] hover:bg-white/15 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Message Viewport Wrapper */}
          <div className="relative flex min-h-0 flex-1 flex-col bg-[#f6f3ff]">
            <div
              ref={scrollRef}
              onScroll={updateScrollState}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 pr-11"
            >
              {messages.map((msg) => {
                const isSpeaking = speakingMsgId === msg.id;
                const isLoadingVoice = loadingVoiceId === msg.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#7041ed] font-semibold text-white whitespace-pre-wrap'
                          : msg.isError
                            ? 'border border-rose-300 bg-rose-50 font-semibold text-rose-800 whitespace-pre-wrap'
                            : 'border border-[#e3dcf5] bg-white font-medium text-[#191944] shadow-2xs'
                      }`}
                    >
                      {msg.role === 'mark' && !msg.isError
                        ? renderFormattedText(msg.text)
                        : msg.text}
                    </div>

                    {/* Gemini-style Listen Voice button on every MARK response */}
                    {msg.role === 'mark' && !msg.isError && (
                      <button
                        type="button"
                        onClick={() => handleToggleVoice(msg)}
                        aria-label={
                          isSpeaking
                            ? t(preferredLanguage, 'stopVoice')
                            : t(preferredLanguage, 'listenMessage')
                        }
                        className="mt-1 ml-1 inline-flex items-center gap-1.5 rounded-full border border-[#e0d5ff] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#7041ed] hover:bg-[#f4efff] transition-colors"
                      >
                        {isLoadingVoice ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                            <span>Loading voice...</span>
                          </>
                        ) : isSpeaking ? (
                          <>
                            <Square className="h-2.5 w-2.5 fill-current text-rose-600" aria-hidden="true" />
                            <span className="text-rose-700">{t(preferredLanguage, 'stopVoice')}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" aria-hidden="true" />
                            <span>{t(preferredLanguage, 'listenMessage')}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-[#e3dcf5] bg-white px-3.5 py-2 text-xs font-bold text-[#5e5878]">
                    MARK is thinking...
                  </div>
                </div>
              )}

              {voiceError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-800">
                  {voiceError}
                </div>
              )}

              {messages.length <= 1 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] font-extrabold text-[#5e5878]">
                    Try asking MARK:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTER_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => void sendQuestion(q)}
                        className="rounded-xl border border-[#e0d5ff] bg-white px-2.5 py-1.5 text-left text-[11px] font-bold text-[#7041ed] hover:bg-[#f4efff] transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated Scroll Up / Scroll Down Controls */}
            {(canScrollUp || canScrollDown) && (
              <div className="absolute bottom-3 right-2.5 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleScrollUp}
                  disabled={!canScrollUp}
                  aria-label="Scroll up to previous messages"
                  title="Scroll up"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e0d5ff] bg-white text-[#7041ed] shadow-md transition-opacity hover:bg-[#f4efff] disabled:opacity-35"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleScrollDown}
                  disabled={!canScrollDown}
                  aria-label="Scroll down to latest messages"
                  title="Scroll to latest"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e0d5ff] bg-white text-[#7041ed] shadow-md transition-opacity hover:bg-[#f4efff] disabled:opacity-35"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 items-center gap-2 border-t border-[#e3dcf5] bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Data Types or Lists..."
              aria-label="Ask MARK a Python question"
              className="flex-1 rounded-full border border-[#e0d5ff] bg-[#faf8ff] px-4 py-2 text-xs font-semibold text-[#191944] placeholder:text-[#9693b7] focus:border-[#7041ed] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send question to MARK"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#352078] text-white hover:bg-[#542bd5] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <MessageSquare className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
