/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional Google Gemini API key — only upgrades the Analytics insight to
  // AI-written text. Without it, a local insight is generated instead.
  readonly VITE_GEMINI_API_KEY?: string;
  // Optional Google OAuth 2.0 Client ID (Web) — Calendar (+ later Fit).
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  // Optional Firebase web config — enables cross-device sync + Google sign-in.
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
