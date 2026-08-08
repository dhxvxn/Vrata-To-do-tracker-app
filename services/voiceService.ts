// Thin wrapper around the browser-native SpeechRecognition API for dictating
// text into form fields. No external service or key required. Best support is
// Chrome / Edge (desktop + Android); iOS Safari support is partial.

type SpeechRecognitionCtor = new () => any;

const getRecognitionCtor = (): SpeechRecognitionCtor | undefined =>
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const isSpeechRecognitionSupported = (): boolean => !!getRecognitionCtor();

export interface RecognitionHandlers {
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export interface RecognitionController {
  start: () => void;
  stop: () => void;
}

/**
 * Create a single-utterance recognizer. Calls onResult with the final
 * transcript, then onEnd. Returns null if the browser has no support.
 */
export const createRecognition = (handlers: RecognitionHandlers): RecognitionController | null => {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? '';
    if (transcript) handlers.onResult(transcript.trim());
  };
  recognition.onerror = (event: any) => {
    handlers.onError?.(event?.error || 'speech-recognition-error');
  };
  recognition.onend = () => {
    handlers.onEnd?.();
  };

  return {
    start: () => {
      try { recognition.start(); } catch { /* already started */ }
    },
    stop: () => {
      try { recognition.stop(); } catch { /* already stopped */ }
    },
  };
};
