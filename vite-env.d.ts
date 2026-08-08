/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Google Gemini API key — voice command parsing + productivity insights.
  readonly VITE_GEMINI_API_KEY?: string;
  // Google OAuth 2.0 Client ID (Web) — Calendar + Fit integration.
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
