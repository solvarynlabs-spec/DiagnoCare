# DiagnoCare

AI-powered virtual patient simulation SaaS for medical education, localized for Algeria (French interface, Algerian patients and care settings, prices in DA). Students interview virtual patients, examine them, order investigations, reason to a diagnosis, propose a management plan and receive transparent, rubric-based educational feedback.

> **Educational simulation only.** All patients are fictional. DiagnoCare is not a diagnostic tool and its feedback is not medical advice.

## Quick start

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET (and optionally ANTHROPIC_API_KEY)
npm run setup               # prisma generate + create SQLite DB + seed demo data
npm run dev                 # http://localhost:3000
```

On npm 11+, approve the Prisma/esbuild install scripts if prompted: `npm install-scripts approve @prisma/client @prisma/engines prisma esbuild`.

**Demo accounts** for every role are created by `prisma/seed.ts` (credentials are listed in that file's header). In development the login page also offers one-click demo sign-in buttons (disabled in production unless `ENABLE_DEMO_LOGIN=true`).

`npm run db:reset` wipes and reseeds the database.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS, Inter + Space Grotesk, lucide icons, Recharts, light/dark mode |
| Motion & 3D | Framer Motion (scroll reveals, tilt cards, parallax, counters), three.js via React Three Fiber + drei (procedural anatomical heart, DNA helix) — lazy-loaded, paused off-screen, reduced-motion aware |
| Photography | Real photographs only, from Unsplash (`src/lib/photos.ts`, free Unsplash License). **No AI-generated images or 3D renders**: every photo was published before 2022 by an identified photographer or institution; check camera EXIF before adding anything newer |
| Locale | French / English, switched with the FR · EN control on every page (cookie `dc-lang`). The switch covers the interface, case content, exam results, scoring, reports, PDFs and the patient. Prices in Algerian dinars (DA). The offline engine also understands common Algerian darija (`wach bik`, `dwa`, `chemma`…) |
| Data | Prisma ORM — SQLite locally, PostgreSQL-ready (change `provider` in `prisma/schema.prisma`) |
| Auth | Email/password (bcrypt), signed JWT in an httpOnly cookie, edge middleware + server-side RBAC |
| AI | Anthropic Claude via the server-side SDK (`@anthropic-ai/sdk`), structured outputs, server-side refusal fallback |
| PDF | `pdf-lib` server-generated evaluation reports |

## Architecture

```
src/
  app/
    (site)/          public SEO pages: home, features, specialties, pricing, about, contact, faq, legal
    (auth)/          login, register
    app/             student area: dashboard, case library, consultation room, reports, billing, settings
    teach/           teacher: dashboard, case authoring + review workflow, assignments, students, groups, review
    institution/     university admin: overview analytics, people, programs, audit
    admin/           platform admin: overview, users, subscriptions, AI settings, contact inbox, audit
    api/             route handlers (zod-validated, RBAC-checked, audit-logged)
  lib/
    sim/             simulation engine
      engines/       PatientEngine interface · anthropic.ts (LLM) · scripted.ts (offline) · index.ts (selection + fallback)
      brief.ts       patient-visible projection of a case (no diagnosis / rubric / results)
      scoring.ts     deterministic rubric scoring
      feedback.ts    rubric feedback + optional AI narrative (cannot change scores)
      service.ts     session lifecycle: start, message, examine, submit
    cases/           demo cases (fictional), repository, zod schema, template
    catalog/         specialties, interview topic taxonomy (EN/FR/AR keywords), exam & investigation catalogs
    billing/         plans + PaymentProvider abstraction (demo provider; Stripe integration point)
    auth/, rbac.ts, access.ts, audit.ts, rate-limit.ts, analytics.ts, settings.ts
  components/
    sim/             consultation room, avatar renderer (2D, 3D-ready), vitals monitor, voice provider, report view
```

### Clinical safety design

- **Case is the authoritative source.** The patient engine only receives `toPatientBrief(case)` — persona, interview facts and history. The diagnosis, rubric and investigation results are never sent to it, so it cannot reveal or alter them.
- **Sessions are version-locked** (`caseVersion`). Editing a published case bumps its version and returns it to DRAFT.
- **Expert review workflow:** DRAFT → IN_REVIEW → PUBLISHED requires a named reviewer and four attestations (fictional data, consistent facts, rubric reviewed, safety checked). Only published cases can be assigned.
- **Transparent scoring:** `scoring.ts` computes every point from explicit rubric items (history topics, essential exams/tests, low-value test penalties, diagnosis + must-consider differentials, essential/appropriate/contraindicated management). The AI narrative explains the score; it never sets it.
- Disclaimers on consultation, reports, PDFs, registration and public pages.

### AI modes

| `AI_PROVIDER` | Behaviour |
|---|---|
| unset | `anthropic` if `ANTHROPIC_API_KEY` is set, else `demo` |
| `anthropic` | Claude (`ANTHROPIC_MODEL`, default `claude-opus-5-5`) role-plays the patient with structured JSON output (reply, emotion, topics). On error the scripted engine answers that turn and the UI says so. Pro/University users also get an AI narrative on their evaluation. |
| `demo` | Deterministic scripted engine answering verbatim from authored case facts. Clearly labelled in the UI. |

Effort levels for patient replies and feedback are adjustable in **Admin → AI & platform settings**.

### Extension points (prepared, not yet implemented)

- **3D patients:** `components/sim/patient-avatar.tsx` defines `AvatarRendererProps` (`emotion`, `speaking`, avatar config). A three.js / glTF renderer with emotion blendshapes can replace `AVATAR_RENDERER`.
- **Voice:** `components/sim/voice.ts` defines `VoiceProvider`; the current implementation uses the browser Web Speech API (works in Chromium browsers; Pro/University plans). A server STT/TTS provider can implement the same interface.
- **Payments:** `lib/billing/providers.ts` — implement `stripeProvider.checkout/cancel` with Stripe Checkout and add a webhook route that activates subscriptions.
- **Localisation:** `src/lib/i18n` (inline `t(fr, en)` pairs, `getT()` on the server, `useT()` / `<Tr>` on the client). Demo cases have full English versions in `src/lib/cases/i18n`; teacher-written cases show their authored text in both languages.
- **Rate limiting** is in-memory; use Redis for multi-instance deployments.

## Data model

Users · Roles (permissions JSON mirrors `lib/rbac.ts`) · Universities · StudentGroups/GroupMemberships · TrainingPrograms · ClinicalCases (+ VirtualPatient, CaseSymptom, MedicalHistoryItem, EvaluationRubric) · ConsultationSessions · ConversationMessages · MedicalExaminations · DiagnosisSubmissions · AssessmentResults · Assignments · Subscriptions · Payments · Notifications · AuditLogs · PlatformSettings · ContactRequests.

## Production notes

- Set a strong `AUTH_SECRET` (≥ 32 chars); the app refuses to start without it in production.
- Switch Prisma to PostgreSQL and run migrations (`prisma migrate deploy`). Note SQLite `contains` is case-insensitive for ASCII; on PostgreSQL add `mode: "insensitive"` to library search filters.
- Demo cases are seeded as published with a "demonstration content" review note — have your clinical experts review or replace them before formal use.
- Replace the illustrative educator quotes on the homepage with verified testimonials.
