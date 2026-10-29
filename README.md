# NUB Student Portal — Concept Redesign

A static, front-end concept redesign of the Northern University Bangladesh (NUB) student portal built from data captured from the official portal. It uses real student records, but no real credentials, payments, or university actions are processed.

## Login

- Open `index.html`.
- Use Student ID `41230301841` with **any** password.
- Choose “Remember me” to stay signed in via `localStorage`; otherwise the session uses `sessionStorage`.

## What is included

- Login page with a modern split-screen layout.
- Hash-routed SPA (`app.html`) with a fixed sidebar, topbar, search palette, profile menu, and notifications dropdown.
- Dashboard, notifications, semester schedule, registration, class routine, TER fill-up, clearance, results, academic credentials, course structure, waiver info, cost package, payable list, payment history, financial summary, financial details, profile, edit profile, and change password.
- Captured data only: 10 semesters, 61 completed courses, 11 payments, three semesters of schedule data, and the current Fall 2026 registration.
- Local local interactions: profile edits, sensitive-value reveal, clearance request, password-strength feedback, copy buttons, and print-friendly views.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to Vercel

This is a static site with no build step.

```bash
npx vercel
```

Or import the repository into Vercel and use the default static settings. No environment variables or build command are required.

## Privacy and data notes

- Phone numbers and birth certificate numbers are masked by default.
- Profile edits and clearance requests are stored only in the current browser.
- The real portal password is not included in this build.
- Empty or closed official pages are represented honestly as unavailable states rather than fabricated data.
