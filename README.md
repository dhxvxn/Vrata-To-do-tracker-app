<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ✅ Vrata — Discipline Tracker

A React + TypeScript productivity PWA: a task tracker, fitness/gym planner, exam
calendar, YouTube study library, and (optionally) Google Calendar sync — usable
on **phone and desktop with real-time sync between them**. It runs **100% free
with no API keys**; a few optional keys unlock extras.

## ✨ Features
- **Tasks with frequencies** — Daily, Weekly, Monthly, Exam, Fitness, Study
- **Fitness/gym planner** — schedule runs (Tempo/Interval/Long/Easy) and gym days
  (Upper Body / Lower Body / Core & Abs) across the week
- **Exam calendar** — colour-coded exam events to plan study around
- **Voice input** — tap the mic in the task box and just speak your task; the
  browser's built-in speech-to-text fills it in. No key, no cost.
- **YouTube study library** — save YouTube lectures as study tasks with a
  thumbnail and an in-app player, and track what you've watched.
- **Cross-device sync** *(optional)* — sign in with Google and your tasks sync in
  real time between phone and desktop (Firebase Firestore).
- **Google Calendar (two-way)** *(optional)* — see your schedule in the app and
  push scheduled tasks/exams out as calendar events.
- **Analytics, History & "Wrapped"** — completion charts, a completed log, and a
  poetic period summary. Daily motivational quotes.
- Quotes / insights / Wrapped are AI-written when a Gemini key is present, and
  generated locally (keyless) otherwise.

## 🛠 Tech Stack
React · TypeScript · Vite · Web Speech API · Firebase (Firestore + Auth) ·
Google Calendar API · Google Gemini API *(optional)*

---

## 🚀 Run Locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

That's it — the app is fully usable with **no configuration**. Everything below is
optional. To enable extras, copy `.env.local.example` to `.env.local`, fill in
only what you want, and restart the dev server. The dev server runs on
**http://localhost:3000**.

### ☁️ Enable cross-device sync (Firebase) — optional

Sign in once with Google and your tasks follow you between phone and desktop.

1. Create a free project at the [Firebase Console](https://console.firebase.google.com/).
2. **Build → Authentication → Sign-in method:** enable **Google**.
3. **Build → Firestore Database:** create a database (production mode is fine).
4. **Project settings → General → Your apps:** register a **Web** app and copy the
   `firebaseConfig` values into the `VITE_FIREBASE_*` vars in `.env.local`.
5. Add your dev/prod domains under **Authentication → Settings → Authorized domains**
   (`localhost` is there by default).
6. Set Firestore security rules so each user only accesses their own document:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

All Firebase web-config values are **public** and safe to ship. Without them, the
app just stays local to each device.

### 🗓️ Enable Google Calendar (two-way) — optional

Only the **public** OAuth Client ID is used (no secret is shipped).

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Enable the **Google Calendar API**.
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Under **Authorized JavaScript origins**, add `http://localhost:3000` (and your
   deployed URL).
5. Put the Client ID in `VITE_GOOGLE_CLIENT_ID` in `.env.local`.

Without it, the Schedule tab shows a "not configured" note and sync buttons hide.

### 🤖 AI quotes & insights (Gemini) — optional

Quotes, the productivity insight, and the "Wrapped" report are generated
**locally by default** — no key needed. To have them written by AI instead, set a
[Gemini API key](https://aistudio.google.com/apikey) as `GEMINI_API_KEY` in
`.env.local`.

### 📜 Scripts
```bash
npm run dev        # start the dev server (http://localhost:3000)
npm run build      # production build
npm run typecheck  # TypeScript type-check (tsc --noEmit)
```
