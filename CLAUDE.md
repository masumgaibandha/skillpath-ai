# SkillPath AI — Project Reference

Permanent context for anyone (human or Claude) working on this repo. For the full architecture rationale, data models, phase-by-phase plan, and risk analysis, see **`docs/PROJECT_PLAN.md`** — this file is a condensed index, not a replacement.

## What this is

SkillPath AI is a full-stack AI-powered course discovery and learning platform: browse/search/filter courses, enroll free or buy paid courses via Stripe, get an AI-generated study roadmap, and chat with a course-aware AI assistant. Built as a 2-day MVP — scope decisions favor "working and demoable" over "complete."

## Tech stack

- **Frontend** (`client/`): Next.js App Router, TypeScript, Tailwind CSS v4, HeroUI, TanStack Query, Recharts
- **Backend** (`server/`): Express.js, TypeScript, MongoDB, Mongoose
- **Auth**: Better Auth (email/password, Google OAuth, demo login, protected routes)
- **Payments**: Stripe test-mode one-time checkout + webhook-driven enrollment
- **AI**: OpenAI (Study Planner agent, Chat Assistant with course-search tool)

## Architecture decisions (why things are wired this way)

- **Monorepo, no shared workspace tooling.** `client/` and `server/` are independent npm projects. Duplicate small shared types (e.g. `Course`) rather than building a shared package — not worth the setup time for 2 days.
- **Auth lives entirely in Express**, mounted via Better Auth's Node/Express adapter (`toNodeHandler(auth)` from `better-auth/node`) using Better Auth's native MongoDB adapter (its own `user`/`session`/`account`/`verification` collections, same database as Mongoose — no conflict, no custom `User` model).
- **Google OAuth is required**, configured alongside email/password from the start — never treat it as optional or stub it out.
- **Next.js proxies to Express** via a rewrite (`/api/:path*` → `API_URL`) in `next.config.ts`. This makes the browser see one origin, avoiding CORS/cross-site-cookie complexity, and gives Google's OAuth callback a single stable origin.
- **Two-layer route protection**: Next `middleware.ts` does a fast optimistic cookie check for UX; every protected Express route independently re-verifies the session via `auth.api.getSession(...)`. **Never rely on client-side gating alone** — Next.js route handlers/Server Functions are directly reachable over HTTP regardless of UI state.
- **Course management is owner-based, not admin-based.** Any authenticated user can create and manage their own courses. `Course.createdBy` stores the Better Auth user id; every mutating request must check `req.session.user.id === course.createdBy` server-side. There is no `role` field and no admin bootstrap.
- **Both AI features live in Express** (not Next.js route handlers) — they need direct Mongoose access to course data, and keeping OpenAI calls + DB reads + auth middleware in one process is simpler than splitting across two runtimes.
- **Stripe webhook** (`POST /api/webhooks/stripe`) needs the **raw** request body for signature verification — its `express.raw(...)` middleware must be registered, scoped to that one path, **before** the global `express.json()`.
- **Cache Components (Next.js 16's opt-in PPR/`"use cache"` model) stays OFF.** Do not set `cacheComponents: true` in `next.config.ts` and do not reach for `"use cache"`/`cacheLife`/`cacheTag`. Its mandatory-`<Suspense>`-around-every-dynamic-API discipline collides with the Explore page's `searchParams` filters and the dashboard's session checks — too risky for this timeline.

## Data models (condensed — see PROJECT_PLAN.md §2 for full field lists)

- **Course** — `createdBy` (owner), `shortDescription` + `fullDescription` (two distinct fields, never derived from one another), `images: string[]` (2–4 real photos, gallery), `rating`/`ratingCount` (realistic seeded aggregates, not fabricated reviews), text + compound indexes for search/filter.
- **Enrollment** — one model for both free enroll and paid purchase; unique `{userId, courseId}`; unique `stripeCheckoutSessionId` for webhook idempotency.
- **StudyPlan** — supports regeneration/refinement (`version`, `feedbackHistory`), not just one-shot generation.
- **ChatConversation** — messages embedded in the conversation document, not a separate collection.
- **ContactMessage** — backs the required `/contact` page form.

## Coding rules

1. **TypeScript everywhere, strict mode.** No `.js`/`.jsx` in `client/src` or `server/src`.
2. **Every mutating Express route re-checks auth and ownership server-side**, regardless of what the client already gated. This is non-negotiable for course edit/delete, enrollments, payments, and AI endpoints.
3. **No fabricated content.** No lorem ipsum, no placeholder/gray-box images, no fake testimonial quotes, no `#`-href nav/social links. Course content, landing page copy, About/Contact copy, and Footer contact info must be genuinely written or genuinely functional.
4. **Reuse shared UI components** — one `CourseCard` (image, title, `shortDescription`, meta row, "View Details", equal height via flex + line-clamp, 4-per-row desktop grid) and one global `Footer` (real contact info, working nav links, working social links), used everywhere courses/site-chrome appear. Don't hand-roll ad-hoc variants per page.
5. **Server Components fetch once; Client Components own everything after that** via TanStack Query. Don't reach for `HydrationBoundary`/prefetch-dehydration patterns — plain client fetch-on-mount is the accepted lower-risk substitute for this timeline.
6. **Demo Login must visibly auto-fill** the email/password fields with seeded demo credentials before submitting — never a silent direct sign-in.
7. **Required literal routes**: `/items/add` and `/items/manage` must exist exactly as named (not just conceptually equivalent routes elsewhere). `/items/manage` must have working View and Delete actions on every row; Edit is optional.
8. **Nav minimums**: logged-out nav ≥ 3 routes, logged-in nav ≥ 5 routes.

## Phase workflow

Implementation proceeds in the priority-ordered phases defined in `docs/PROJECT_PLAN.md` §4 (Phase 0 → Phase 9, plus stretch items). Each phase is a checkpoint — if time runs out, whatever is complete up to the most recent phase should still be a coherent, demoable product. Do not start a later phase's scope while an earlier phase is incomplete unless explicitly told to. Currently in progress: **Phase 0** (TypeScript conversion, Express scaffold, Mongo connection, `/api/health`, Next rewrite proxy — no course model, auth, or seed data yet).

## Key risks to keep in mind while building (full list + mitigations in PROJECT_PLAN.md §6)

- Better Auth ↔ Express middleware ordering (`express.json()` must not precede the auth handler; Express 5 catch-all is `/{*any}`, not `*`).
- Google OAuth redirect URI must be tested end-to-end early — it's a hard requirement with no fallback.
- Stripe webhook raw-body middleware scoping/ordering.
- HeroUI + Tailwind v4 setup friction — spike one component before committing all UI to it.
