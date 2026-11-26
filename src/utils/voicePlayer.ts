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
    let dataUrl = audioCache.get(cacheKey);
    if (!dataUrl) {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, preferredLanguage }),
        signal: controller.signal,
      });

      const data = (await res.json()) as {
        audioBase64?: string;
        mimeType?: string;
        error?: string;
      };

      if (!res.ok || !data.audioBase64) {
        onError?.(data.error ?? 'Unable to generate Pegasus voice audio.');
        return;
      }

      dataUrl = `data:${data.mimeType ?? 'audio/wav'};base64,${data.audioBase64}`;
      if (audioCache.size > 40) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey) audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, dataUrl);
    }

    if (controller.signal.aborted) return;

    const audio = new Audio(dataUrl);
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
