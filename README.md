<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ✅ Vrata — Discipline Tracker

A React + TypeScript productivity PWA: tasks, a fitness/gym planner, exam
countdowns, a YouTube study library, a Pomodoro timer, streaks, notes, goals, an
Indian festivals calendar, and a GitHub/LeetCode tracker — usable on **phone and
desktop with real-time sync between them**, and **installable as an app**. It runs
**100% free with no API keys**; a couple of optional keys unlock extras.

## ✨ Features
- **Today dashboard** — a home screen with everything due today, your streak, focus
  minutes and the soonest exam.
- **Tasks with frequencies** — Daily, Weekly, Monthly, Exam, Fitness, Study — with
  **priorities, tags, subtask checklists, search, and reminders**.
- **Fitness/gym planner** — schedule runs (Tempo/Interval/Long/Easy) and gym days
  (Upper/Lower/Core), and log **sets × reps × weight** per session.
- **YouTube study library** — save lectures as study tasks with a thumbnail + in-app
  player. Plus a **Pomodoro focus timer** that logs your focus minutes.
- **Streaks, XP, badges & a contribution heatmap** to keep you consistent.
- **Notes & Goals** — quick notes, and goals broken into milestones with a % bar.
- **Indian holidays & festivals calendar** — a built-in month calendar + upcoming
  festival countdowns (no setup).
- **Coding tracker** — your GitHub contribution streak + LeetCode solved counts.
- **Voice input** — tap the mic and speak your task (browser speech-to-text, no key).
- **Cross-device sync** *(optional)* — sign in with Google; tasks sync in real time
  between phone and desktop (Firebase Firestore).
- **Installable PWA** — add it to your laptop & phone home screen; works offline.
- Quotes / insights / "Wrapped" are AI-written with a Gemini key, or generated
  locally (keyless) otherwise.

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

## 📲 Install as an app (free) — laptop & phone

Vrata is an installable PWA. Host it once for free, then install it on any device.

**1. Deploy (free, ~2 min):**
1. Push this repo to GitHub (already done if you cloned it from there).
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import this repo.
3. Vercel auto-detects **Vite** (Build `npm run build`, Output `dist`). Click
   **Deploy**. You get a URL like `https://vrata-xxxx.vercel.app`.

   *(Netlify works the same way — connect the repo, it detects Vite.)*

**2. Install on your devices:**
- **Laptop (Chrome/Edge):** open the URL → click the **install icon** in the
  address bar (or ⋮ menu → *Install Vrata*).
- **Android (Chrome):** open the URL → ⋮ menu → **Add to Home screen / Install app**.
- **iPhone (Safari):** open the URL → Share → **Add to Home Screen**.

It then launches full-screen with its own icon and works offline.

**3. Turn on sync for the hosted app (free):**
- In your Vercel project → **Settings → Environment Variables**, add your
  `VITE_FIREBASE_*` values (see the Firebase section above). Redeploy.
- In the [Firebase Console](https://console.firebase.google.com/) →
  **Authentication → Settings → Authorized domains**, add your `*.vercel.app`
  domain so Google sign-in works on the hosted app.

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
