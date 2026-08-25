# Vrata Focus — browser extension

A companion extension that tracks how you spend time in your **browser** and flags
whether the **YouTube videos** you watch are study‑related. It's separate from the
Vrata web app and runs locally — all data stays in your browser (`chrome.storage`).

> A browser extension can only see the **browser**, not other apps on your laptop.
> Full-OS monitoring would need an invasive native background agent — out of scope.

## What it does
- Tracks **active time per site** while a window is focused and you're not idle.
- Splits your day into **productive** (study sites + study‑related YouTube) vs
  **distraction** (social/entertainment sites + off‑topic YouTube), with a **focus
  score**.
- Logs each **YouTube video** you watch and marks it **Study / Off‑topic / GATE**.
  *Productive = any genuine learning* — GATE subjects, other subjects, AI/ML,
  programming, tutorials, lectures — not just GATE.
- A **popup dashboard** for today, and an **options page** to edit the site
  categories and study keywords.

## Install (Chrome, Edge, or Brave)
1. Open the extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Turn on **Developer mode** (top‑right toggle).
3. Click **Load unpacked** and select this **`extension/`** folder.
4. Pin **Vrata Focus** and click it to see today's focus dashboard.

To tweak what counts as study vs distraction: right‑click the icon → **Options**
(or the ⚙ link in the popup).

## Notes
- Classification is **keyword-based and local** (no API key, instant, private).
- It counts time in ~1‑minute increments and pauses when your screen is idle/locked.
- Data is per‑browser and not synced to the Vrata web app in this version.
