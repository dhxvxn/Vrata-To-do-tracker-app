# ✅ Vrata — To‑Do & Habit Tracker

A React + TypeScript productivity PWA that mixes a task tracker, a habit/routine
scheduler, an exam calendar, a running‑training planner, a YouTube study library,
and optional Google Calendar sync — usable on **phone and desktop with real‑time
sync between them**. It runs **100% free with no API keys**; a few optional keys
unlock extras.

---

## ✨ Features
- **Tasks with frequencies** — daily, weekly, monthly, exam, running, or study
- **Scheduling** — schedule tasks to specific dates and mark completion over time
- **Exam calendar** — colour‑coded exam events to plan study around
- **Running planner** — tempo / interval / long / easy / recovery run types
- **Voice input** — tap the mic in the task box and just speak your task; the
  browser's built‑in speech‑to‑text fills it in. No key, no cost.
- **YouTube study library** — save YouTube lectures as study tasks with a
  thumbnail and an in‑app player, and track what you've watched.
- **Cross‑device sync** *(optional)* — sign in with Google and your tasks sync in
  real time between phone and desktop (Firebase Firestore).
- **Google Calendar (two‑way)** *(optional)* — see your upcoming schedule in the
  app and push scheduled tasks/exams out as calendar events.
- **Progress tracking + insights** — completion‑rate charts, plus a productivity
  insight generated locally (or by Gemini if you add a key).
- **Installable PWA** — works offline and installs to your home screen.

## 🛠 Tech Stack
React · TypeScript · Vite · Web Speech API · Firebase (Firestore + Auth) ·
Google Calendar API · Google Gemini API *(optional)*

---

## 🚀 Run locally

**Prerequisites:** Node.js

```bash
git clone https://github.com/dhxvxn/Vrata-To-do-tracker-app.git
cd Vrata-To-do-tracker-app
npm install
npm run dev
```

That's it — the app is fully usable with **no configuration**. Everything below
is optional. To enable extras, copy `.env.local.example` to `.env.local` and fill
in only what you want, then restart the dev server.

### ☁️ Enable cross‑device sync (Firebase) — optional

Sign in once with Google and your tasks follow you between phone and desktop.

1. Create a free project at the [Firebase Console](https://console.firebase.google.com/).
2. **Build → Authentication → Sign‑in method:** enable **Google**.
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

All Firebase web‑config values are **public** and safe to ship in the browser.
Without them, the app just stays local to each device.

### 🤖 AI‑written insight (Gemini) — optional

The Analytics insight is generated **locally from your own stats by default** — no
key needed. If you'd like it written by AI instead, add a
[Gemini API key](https://aistudio.google.com/apikey) as `VITE_GEMINI_API_KEY`.

### 🔑 Setting up Google Calendar (optional)

The Calendar integration runs entirely in the browser — only the **public**
OAuth Client ID is used (no secret is shipped).

1. Go to the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. **Enable the "Google Calendar API"** for your project.
3. Create an **OAuth 2.0 Client ID** of type **Web application**.
4. Under **Authorized JavaScript origins**, add your dev and prod URLs
   (e.g. `http://localhost:5173` and your deployed site).
5. Copy the Client ID into `VITE_GOOGLE_CLIENT_ID` in `.env.local` and restart
   the dev server.

Without `VITE_GOOGLE_CLIENT_ID` the app still runs — the Schedule tab simply
shows a "not configured" note and calendar sync buttons are hidden.

### 📜 Scripts
```bash
npm run dev        # start the dev server
npm run build      # production build
npm run typecheck  # TypeScript type‑check (tsc --noEmit)
```

## 👨‍💻 Author
**Dhavan** — CSE student
