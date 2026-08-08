# ✅ Vrata — To‑Do & Habit Tracker

A React + TypeScript productivity app that mixes a task tracker, a habit/routine
scheduler, an exam calendar, and even a running‑training planner — with AI‑generated
insights on your progress via the Gemini API.

---

## ✨ Features
- **Tasks with frequencies** — daily, weekly, monthly, exam, or running routines
- **Scheduling** — schedule tasks to specific dates and mark completion over time
- **Exam calendar** — colour‑coded exam events to plan study around
- **Running planner** — tempo / interval / long / easy / recovery run types
- **Voice assistant** — tap the mic and speak: "add a daily task to revise
  calculus", "mark laundry done", "what's on my schedule". Speech is captured
  with the browser's Web Speech API and parsed into commands by Gemini.
- **Google Calendar (two‑way)** — see your upcoming schedule in the app and push
  scheduled tasks/exams out as calendar events.
- **YouTube study library** — save YouTube lectures as study tasks with a
  thumbnail and an in‑app player, and track what you've watched.
- **Progress tracking** — completion‑rate history you can visualise
- **AI insights** — Gemini generates feedback on your progress trends

## 🛠 Tech Stack
React · TypeScript · Vite · Google Gemini API · Google Calendar API ·
Web Speech API

---

## 🚀 Run locally

**Prerequisites:** Node.js

```bash
git clone https://github.com/dhxvxn/Vrata-To-do-tracker-app.git
cd Vrata-To-do-tracker-app
npm install
```

Copy `.env.local.example` to `.env.local` and fill in the values:

```env
# Powers voice command parsing + AI insights. https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=your_gemini_key

# Powers the two‑way Google Calendar integration (optional).
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Start the dev server:
```bash
npm run dev
```

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
