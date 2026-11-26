import { InterfaceLanguage } from '../types/learning';

export interface VoicePlayOptions {
  text: string;
  preferredLanguage?: InterfaceLanguage;
  playbackRate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

const audioCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let activeAbortController: AbortController | null = null;

function base64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function stopGeminiVoice(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore browser speech cleanup failures
    }
  }
}

export async function playGeminiVoice({
  text,
  preferredLanguage = 'en',
  playbackRate = 1,
  onStart,
  onEnd,
  onError,
}: VoicePlayOptions): Promise<void> {
  stopGeminiVoice();

  const cacheKey = `${preferredLanguage}::${text}`;
  const controller = new AbortController();
  activeAbortController = controller;

  try {
    let audioUrl = audioCache.get(cacheKey);
    if (!audioUrl) {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, preferredLanguage }),
        signal: controller.signal,
      });

      const rawBody = await res.text();
      let data: {
        audioBase64?: string;
        mimeType?: string;
        error?: string;
      } = {};

      if (rawBody) {
        try {
          data = JSON.parse(rawBody) as {
            audioBase64?: string;
            mimeType?: string;
            error?: string;
          };
        } catch {
          onError?.(
            res.status === 429
              ? 'Daily free Gemini voice quota reached — using device voice.'
              : 'Using built-in device voice while studio voice service is busy.'
          );
          return;
        }
      }

      if (!res.ok || !data.audioBase64) {
        onError?.(data.error ?? 'Unable to generate voice audio right now.');
        return;
      }

      audioUrl = base64ToBlobUrl(data.audioBase64, data.mimeType ?? 'audio/wav');
      if (audioCache.size > 40) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey) {
          const evictedUrl = audioCache.get(firstKey);
          audioCache.delete(firstKey);
          if (evictedUrl && evictedUrl.startsWith('blob:')) {
            URL.revokeObjectURL(evictedUrl);
          }
        }
      }
      audioCache.set(cacheKey, audioUrl);
    }

    if (controller.signal.aborted) return;

    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackRate;
    activeAudio = audio;

    audio.onplay = () => {
      onStart?.();
    };
    audio.onended = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      onEnd?.();
    };
    audio.onerror = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      onError?.('Audio playback failed in the browser.');
    };

    await audio.play();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return;
    }
    onError?.(err instanceof Error ? err.message : 'Unable to play voice audio.');
  } finally {
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}
