# SkillPath AI — Architecture & Delivery Plan (2-Day MVP)

> Finalized and approved plan. See `CLAUDE.md` at the repo root for a condensed day-to-day reference.

## Context

SkillPath AI needs to go from an empty scaffold to a submission-ready MVP in ~2 days. The repo currently has only a bare `create-next-app` (JavaScript, Next.js 16.2.10) in `client/` and a completely empty `server/` folder — no backend, no DB connection, no auth, no payments, no AI wiring exists yet.

**Revision note:** this version corrects the first draft, which incorrectly treated several graded requirements as optional simplifications (Google OAuth, admin-gated course management, stub content). Those are now hard requirements. Scope stays realistic for 2 days, but nothing explicitly required by the assignment is cut — the buffer that absorbed risk in the first draft is thinner as a result, and the plan calls out exactly what drops first if time runs out (Edit-in-manage, Privacy/Terms pages).

Key facts already confirmed by inspecting the repo:
- `client/` is JS, not TS (`layout.js`, `page.js`, `jsconfig.json`) — must convert to TS first since the required stack is TypeScript.
- `client/next.config.mjs` only sets `reactCompiler: true`. `cacheComponents` (Next 16's opt-in Partial Prerendering / `"use cache"` model) is **not** enabled, and this plan keeps it that way (see Risks).
- `server/` has no `package.json` — built from scratch.

---

## 1. Recommended Architecture

**Monorepo, no shared workspace tooling** (not worth the setup time for 2 days):
```
skillpath-ai/
  client/   # Next.js App Router, TypeScript
  server/   # Express, TypeScript
```
Duplicate small shared types (e.g. `Course`) rather than building a shared package.

**Auth lives entirely in Express, proxied through Next:**
- Better Auth mounted once in `server/` via its Node/Express adapter (`toNodeHandler(auth)` from `better-auth/node`), using Better Auth's native MongoDB adapter (own `user`/`session`/`account`/`verification` collections, same database as Mongoose, no conflict).
- **Google OAuth is a required provider, configured alongside email/password from the start** — not a stretch add-on. Get the Google OAuth client ID/secret and set the authorized redirect URI (`${PUBLIC_ORIGIN}/api/auth/callback/google`) in the first hour of work so Phase 2 isn't blocked waiting on it.
- Next.js has no Better Auth server code, only the client SDK (`createAuthClient`) for sign-in/sign-up/session hooks.
- Next.js rewrite: `/api/:path*` → Express API URL, in `next.config.ts`. Browser and Google's OAuth callback see **one origin**, sidestepping cross-origin cookie/CORS complexity.
- Two-layer route protection: Next `middleware.ts` does a fast optimistic cookie-presence check for UX on all protected paths (including `/items/add`, `/items/manage`); every protected Express route re-verifies the session authoritatively via `auth.api.getSession(...)`. Never rely on the Next-side check alone (Next 16 itself warns Server Functions/route handlers are directly POST-reachable).

**Course management is owner-based, not admin-based.** Any authenticated user can create and manage their own courses. `Course.createdBy` stores the Better Auth user id; every edit/delete request checks `req.session.user.id === course.createdBy` server-side. No `role` field, no admin bootstrap, no approval queue.

**Stripe webhook**: dedicated Express route `POST /api/webhooks/stripe`, mounted with `express.raw({ type: "application/json" })` scoped only to that path and registered **before** the global `express.json()`. Hit directly by Stripe/Stripe CLI, not proxied through Next.

**Both AI features (Study Planner + Chat Assistant) live in Express** — they need direct Mongoose access to course data; keeping OpenAI calls + DB reads + auth middleware in one process is simpler to build and debug in 2 days than splitting across servers.

**Cache Components: stay off.** Already disabled in the scaffold. Its mandatory-`<Suspense>`-around-every-dynamic-API discipline collides directly with the Explore page's filters and dashboard session checks — not worth the risk in a 2-day sprint.

**Deployment target** (Day 2 polish): Next.js → Vercel, Express → Render/Railway, MongoDB → Atlas free tier.

**Action needed today:** create the Google OAuth client (required, not optional) and Stripe test-mode keys — both gate work that starts on Day 1.

---

## 2. Data Models (Mongoose, in `server/src/models/`)

Better Auth owns `user`/`session`/`account`/`verification` natively — no custom `User` model, no `role` field.

**Course**
- `title`, `slug` (unique), `shortDescription` (1–2 sentences, real specific copy — powers course cards and listings, kept short so card layout stays equal-height), `fullDescription` (longer, real copy — powers the course detail page's overview section), `whatYoullLearn: string[]`, `prerequisites: string[]`
- `category` (indexed), `tags: string[]` (indexed), `level: "beginner"|"intermediate"|"advanced"` (indexed)
- `price: number` (0 = free), `isFree: boolean` (derived, indexed), `currency`
- `instructorName`, `images: string[]` (2–4 real stock-photo URLs per course — powers the detail-page gallery and the card's single cover image), `durationHours`
- `rating`, `ratingCount` — realistic seeded aggregate numbers (this is normal product metadata, not the "fake testimonials" the content rule prohibits — no per-user review text is fabricated)
- `status: "draft"|"published"` (owner-controlled, defaults to `"published"` on create — no moderation queue), `createdBy` (Better Auth user id, indexed)
- Indexes: text index on `title + shortDescription + fullDescription + tags`; compound `{status, category, level, price}` for explore filters; `createdAt` for sort; unique `slug`; `createdBy` for the "my courses" list.
- The `/items/add` (and optional edit) form has separate inputs for `shortDescription` (short textarea, card blurb) and `fullDescription` (long textarea, detail-page overview) — never derived from one another.

**Enrollment** (covers both free enroll and paid purchase)
- `userId`, `courseId` (both indexed), `type: "free"|"paid"`, `status: "pending"|"active"|"refunded"`
- `amountPaid`, `currency`, `stripeCheckoutSessionId` (unique — webhook idempotency), `stripePaymentIntentId`, `enrolledAt`
- Compound **unique** index `{userId, courseId}` — prevents double-enrollment, doubles as "already enrolled" check.

**StudyPlan** (supports regeneration/refinement, not just one-shot)
- `userId` (indexed), `title`, `inputs: {goal, skillLevel, weeklyHours, budget, timeframeWeeks}`
- `milestones: [{title, description, courseRefs: ObjectId[], order, estimatedWeeks}]`
- `version: number` (starts at 1, increments on each refine), `feedbackHistory: [{feedback, requestedAt}]` (free-text refinement notes kept for context on the next regeneration)
- `generatedAt`, `updatedAt`, `status: "active"|"archived"`; index `{userId, generatedAt: -1}`
- Refinement is a **full-plan regeneration using prior plan + new feedback as context**, not granular per-milestone editing — keeps the feature real without unbounded scope.

**ChatConversation** (messages embedded — deliberate simplification)
- `userId` (indexed), `title` (derived from first message), `lastMessageAt` (indexed)
- `messages: [{role: "user"|"assistant"|"tool", content, toolCalls?, createdAt}]`

**ContactMessage** (backs the required Contact page)
- `name`, `email`, `message`, `createdAt` — write-only from the user's side; no admin inbox UI needed, just proof the form is real and persists.

---

## 3. API and Page Routes

### Express REST API

- **Courses**: `GET /api/courses` (search/filter/paginate/sort), `GET /api/courses/:slug` (includes `relatedCourses`: same category/tags, excluding self, limit 4), `GET /api/courses/mine` (protected, current user's own), `POST /api/courses` (protected, any authenticated user), `PUT /api/courses/:id` (protected, ownership check — optional to build, see Phase 4), `DELETE /api/courses/:id` (protected, ownership check, required)
- **Enrollment**: `POST /api/enrollments/free/:courseId`, `GET /api/enrollments/me`, `GET /api/enrollments/:courseId/status`
- **Payments**: `POST /api/payments/checkout-session` (dynamic Stripe `price_data` from `course.price`), `POST /api/webhooks/stripe` (upserts Enrollment on `checkout.session.completed`, idempotent)
- **AI**: `POST /api/study-plan` (create), `GET /api/study-plan/me`, `GET /api/study-plan/:id`, `POST /api/study-plan/:id/refine` (body: `{feedback?, inputs?}` — regenerates milestones with prior plan as context, bumps `version`)
- **Chat**: `POST /api/chat/:conversationId?/message`, `GET /api/chat`, `GET /api/chat/:conversationId`
- **Contact**: `POST /api/contact` (public, no auth required — anyone can reach the site's Contact form)
- **Auth**: `app.all("/api/auth/{*any}", toNodeHandler(auth))` — note Express 5 catch-all syntax is `/{*any}`, not `*`
- **Misc**: `GET /api/health`

### Next.js App Router pages

**Public / logged-out nav (4 routes — exceeds the required minimum of 3):** Home, Explore, About, Contact.
- `/` — landing page, Server Component, 7 real sections: hero, how-it-works, featured/free courses (fetched server-side, real seeded courses, rendered as `CourseCard`s), categories, AI-features highlight, **"Why learners choose SkillPath AI" outcomes section** (replaces testimonials — no fabricated quotes), final CTA banner
- `/explore` — Server Component initial SSR fetch from `searchParams`; Client Component owns filter/sort/pagination via TanStack Query; results rendered as a `CourseCard` grid
- `/courses/[slug]` — Server Component fetch for SEO. Sections: image gallery (from `images[]`), overview (`fullDescription` + what-you'll-learn + prerequisites), key info (level, duration, category, price), ratings, related courses grid (`CourseCard`s), and a small Client Component for Enroll/Buy (TanStack Query for status + mutation)

**Shared `CourseCard` component** (used on the landing page, `/explore`, related-courses, and `/items/manage`/`/dashboard/courses` lists — one component, not four ad-hoc renderings): cover image (`images[0]`), title, `shortDescription` (line-clamped so every card is the same height regardless of text length), meta row (level, duration, price-or-"Free" badge, rating), and a "View Details" link/button to `/courses/[slug]` pinned to the bottom of the card via a flex-column layout (`mt-auto`). Grid: 4 columns on desktop (`lg:grid-cols-4`), 2 on tablet, 1 on mobile.

**Global `Footer`** (root layout, appears on every page — separate from the landing page's own final-CTA section): real contact information (support email, and optionally phone/location — reusing the same details shown on `/contact`), working internal navigation links (Home, Explore, About, Contact, plus Login/Dashboard depending on auth state), and working social links (real URLs to actual platforms, e.g. GitHub/LinkedIn/X — never a bare `#` placeholder href).
- `/about` — real written content about the platform and its AI features
- `/contact` — real contact info + a working form that POSTs to `/api/contact` and shows a genuine confirmation state
- `/login`, `/signup` — Client Components using Better Auth's client hooks: email/password, `signIn.social("google")` (required, working). "Demo Login" button **auto-fills the visible email/password fields with the seeded demo account's credentials** (e.g. `demo@skillpathai.com` / a fixed demo password) and then submits the normal email/password sign-in — it must not silently sign in without populating the form, so the user can see and reuse those credentials.
- `/checkout/success`, `/checkout/cancel`

**Protected / logged-in nav (7 routes — exceeds the required minimum of 5), gated by `middleware.ts` + Express-side re-verification:**
- `/dashboard` — overview, Recharts chart (client, TanStack Query)
- `/dashboard/courses` — enrolled courses
- `/dashboard/study-plan` — generate, view, and **refine** plans (feedback box + "Regenerate with feedback" action)
- `/dashboard/chat` — chat assistant
- `/items/add` — course creation form, any authenticated user (this is the literal required route, not a redirect)
- `/items/manage` — list of the current user's own courses, with **View** (links to `/courses/[slug]`) and **Delete** actions required on every row; **Edit** (`/items/manage/[id]/edit`) is optional — build only if time remains after Phase 8

**Rule enforced everywhere**: Server Components do the first fetch only (SEO/initial paint); everything after is a Client Component via TanStack Query. Skip `HydrationBoundary`/prefetch-dehydration patterns — plain client fetch-on-mount is an acceptable lower-risk substitute.

---

## 4. Development Phases (Priority Order)

Ordered so the product is coherent and demoable at every checkpoint if time runs short.

- **Phase 0 (~1h)** — Convert `client/` to TS. Scaffold `server/` (TS, Express, CORS, dotenv, Mongo connection). Prove the path: Next page → rewrite proxy → Express `/api/health` → Mongo ping. Confirm `cacheComponents` stays unset. **Create Google OAuth credentials and Stripe test keys now** (do not wait for Phase 2/5).
- **Phase 1 (Day 1, ~3h)** — Course schema + indexes. Seed script with **20–40 real, specific courses** across categories/levels/free-paid — genuine titles, `shortDescription` + `fullDescription`, `whatYoullLearn`, prerequisites, 2–4 real stock-photo URLs each (not gray placeholder boxes), realistic seeded ratings. `GET /api/courses` (filter/paginate/sort) + `GET /api/courses/:slug` (with related courses).
- **Phase 2 (Day 1, ~2.5h)** — Better Auth on Express: email/password + Mongo adapter, one seeded demo account with fixed known credentials, **Google OAuth working end-to-end** (this is required — test the full redirect loop now, not later), Next `middleware.ts` protecting all six protected routes above.
- **Phase 3 (Day 1, ~4h)** — HeroUI + Tailwind v4 spike first (verify one component renders before committing all UI to it). Build the shared `CourseCard` component (image, title, `shortDescription`, meta row, View Details, equal height, 4-per-row desktop grid) and the global `Footer` (contact info, nav links, social links) once, reused everywhere. Nav components for both logged-out (4 links) and logged-in (7 links) states, plus the Demo Login auto-fill button. Explore page (SSR + client filters) using `CourseCard`. Course detail page with gallery, key info, ratings, related courses. Landing page with all 7 sections written with real copy (no lorem ipsum).
- **Phase 4 (Day 1, ~2h)** — `/items/add` (create form with separate `shortDescription`/`fullDescription` inputs, any authenticated user) and `/items/manage` (owner's course list, **View + Delete required**), backend ownership check on delete. Edit form deferred to stretch.
  **— Day 1 checkpoint: browsing, auth (incl. Google), and owner-based course management are fully functional — demoable on its own. —**
- **Phase 5 (Day 2, ~2.5h)** — Free enroll endpoint + button. Stripe Checkout (dynamic `price_data`), webhook + raw-body middleware, `Enrollment` model, test via `stripe listen --forward-to`. Success/cancel pages.
- **Phase 6 (Day 2, ~2h)** — Dashboard overview, enrolled courses list, one Recharts chart derived client-side from enrollments.
- **Phase 7 (Day 2, ~3h)** — Study Planner: `POST /api/study-plan` (OpenAI + course context, structured JSON), persistence, generate/view UI, **plus `POST /api/study-plan/:id/refine`** and a feedback box in the UI that triggers regeneration with context.
- **Phase 8 (Day 2, ~2h)** — Chat Assistant: `ChatConversation` model, one `searchCourses` tool, simple non-streaming chat page.
- **Phase 9 (Day 2, ~3h)** — About + Contact pages with real content and a working contact form (`ContactMessage` model + `/api/contact`). `loading`/`error` boundaries on all data routes. Final content QA pass — confirm zero lorem ipsum, zero placeholder images, zero stub sections anywhere. Responsive pass. Deploy. Full smoke test.
- **Stretch, only if time remains**: Edit action on `/items/manage/[id]/edit`; Privacy and/or Terms pages (beyond the required About + Contact).
- **Reserve ~1h unscheduled buffer** at the very end for integration surprises (webhook, OAuth redirect URIs, deploy env vars). This is thinner than a first draft would suggest, precisely because Google OAuth, owner-based management, real content, and study-plan refinement are now non-negotiable scope, not padding to cut.

---

## 5. Features to Simplify or Skip

- **Google OAuth**: required, implemented in Phase 2 alongside email/password — not deferred, not stubbed.
- **Course management**: owner-based for any authenticated user, not admin-gated. Ownership enforced via `createdBy` check server-side.
- **`/items/manage`**: View + Delete required; Edit is the one optional stretch item, built last if at all.
- **Course progress/lesson tracking**: skip; no curriculum/lesson editor beyond structured overview fields.
- **Payments**: one-time Checkout only — no subscriptions, no customer portal, no refund UI. Dynamic `price_data` instead of pre-provisioned Stripe Products.
- **Chat assistant**: one tool (`searchCourses`), no streaming, capped history (last ~10 messages).
- **Study Planner**: full-plan regeneration with feedback context is in scope (required); granular per-milestone drag-reorder editing and multi-plan side-by-side comparison are out of scope.
- **Ratings**: realistic seeded aggregate numbers only (legitimate product metadata); no review-submission feature, no fabricated review quotes.
- **Search**: MongoDB text index + field filters; skip vector/semantic search — AI budget goes to the two required agent features.
- **Cache Components/PPR**: stay off.
- **Automated tests**: skip a formal suite; manual smoke test before submission.
- **Images**: real, appropriately licensed stock-photo URLs (e.g., Unsplash), multiple per course for the gallery — never a placeholder/gray-box image, no upload/storage pipeline.
- **Content**: every piece of copy (course `shortDescription`/`fullDescription`, all 7 landing sections, About, Contact, Footer contact info) is genuinely written — no lorem ipsum, no "TODO" stub sections, no fabricated testimonial quotes, no broken/`#` social links.
- **Additional pages**: About + Contact are required and fully built; Privacy/Terms are stretch only if time remains after the buffer.
- **i18n, dark-mode persistence, deep a11y audits**: only if time remains.

---

## 6. Main Technical Risks

1. **Better Auth ↔ Express wiring details** — `express.json()` must not run before the auth handler; Express 5 catch-all is `/{*any}` not `*`. *Mitigate*: get auth returning a real session in Phase 2 before building anything on top; write down route registration order explicitly.
2. **Google OAuth is now a hard requirement with no fallback** — a delayed or misconfigured redirect URI directly blocks a graded feature. *Mitigate*: create credentials and test the full sign-in-with-Google loop in the first few hours of Phase 2, against the exact origin the rewrite proxy will use, not at the end of Day 1.
3. **Cross-origin cookies (Next :3000 / Express :5000 in dev)** — *Mitigate*: Next rewrites proxy all `/api/*` so the browser sees one origin; no CORS/SameSite dance needed.
4. **Stripe webhook local testing** — raw-body middleware must be scoped + ordered correctly; needs Stripe CLI tunneling. *Mitigate*: build/verify in Phase 5, not the last night; test standalone via CLI trigger before wiring UI.
5. **Next.js 16 Cache Components/PPR surprises** — *Mitigate*: already decided off; never set `cacheComponents: true` or use `"use cache"`/`cacheLife`/`cacheTag`.
6. **OpenAI tool-calling for chat** — fiddly under time pressure. *Mitigate*: exactly one tool, official SDK's typed tool-calling helpers, test with scripted prompts; fallback to a plain completion with a manually-injected top-N course list if tool-calling proves flaky.
7. **TanStack Query + Server Component boundary confusion** — *Mitigate*: enforce the Section 3 rule (Server Component = first fetch only) rather than attempting hydration/prefetch patterns.
8. **HeroUI + Tailwind v4 compatibility** — HeroUI's setup historically assumes Tailwind v3-style config; v4 is CSS-first. *Mitigate*: tiny isolated spike (one HeroUI Button rendering) in Phase 3 before committing all UI to it; if friction appears, scope HeroUI to simple primitives and hand-roll complex UI directly in Tailwind.
9. **Better Auth's native-Mongo collections vs. Mongoose collections sharing one DB** — documented to coexist, but confirm no name collisions during the Phase 0/2 spike.
10. **Content authoring time is easy to underestimate** — writing genuinely realistic copy for 20–40 courses, 7 landing sections, About, and Contact (no lorem ipsum anywhere) takes real, dedicated time. *Mitigate*: front-load course-content writing into Phase 1's seed script and draft landing/About/Contact copy in parallel with Phase 3's UI build, not as a Day 2 afterthought.
11. **Study Plan refinement adds real state/complexity beyond one-shot generation** — versioning and re-prompting with prior context is an extra design surface. *Mitigate*: keep refinement to "regenerate the whole plan using prior plan + feedback text as context," not granular editing; test the refine endpoint with 2–3 scripted feedback scenarios early in Phase 7.
12. **Owner-based (non-admin) course management means any signed-up user can add junk test courses to the public catalog** — acceptable for an MVP demo, but worth being aware of. *Mitigate*: seed enough real courses that the catalog looks populated regardless of what test accounts add; no moderation queue is being built, by design.
13. **`reactCompiler: true`** already on in the scaffold. *Mitigate*: leave it on by default; if an unfamiliar compiler-related error appears late with no time to diagnose, flip to `false` as a quick unblock.

---

## Phase 0 File-Change Plan (as executed)

**1. `CLAUDE.md`** (repo root) — permanent project reference for future sessions.

**2. `docs/PROJECT_PLAN.md`** (this file) — the finalized plan, committed for reference during implementation.

**3. Phase 0 — Client (`client/`), JS → TS conversion**
- `tsconfig.json` — new
- `next.config.ts` — replaces `next.config.mjs`; keeps `reactCompiler: true`, adds the rewrite `'/api/:path*' → '${API_URL}/api/:path*'`
- `src/app/layout.tsx`, `src/app/page.tsx` — converted from the existing `.js` files
- `jsconfig.json` — removed (superseded by `tsconfig.json`)
- `package.json` — add `typescript`, `@types/react`, `@types/react-dom`, `@types/node` as devDependencies
- `.env.local` (gitignored) + `.env.example` — `API_URL=http://localhost:5000`

**4. Phase 0 — Server (`server/`), scaffolded from empty**
- `package.json` — deps: `express`, `mongoose`, `cors`, `dotenv`, `zod`; devDeps: `typescript`, `tsx`, `@types/express`, `@types/node`, `@types/cors`
- `tsconfig.json`, `.gitignore` (node_modules, dist, .env)
- `.env.example` + `.env` (gitignored) — `PORT`, `MONGODB_URI`, `CLIENT_ORIGIN`
- `src/config/env.ts` — zod-validated env loader, fails fast with a clear error if a required var is missing
- `src/config/db.ts` — Mongoose `connect()` helper with connection event logging
- `src/routes/health.route.ts` — `GET /api/health` → `{status, uptime, db: "connected"|"disconnected"}`
- `src/app.ts` — Express app (cors, `express.json()`, mounts `/api/health`) — kept separate from `index.ts` on purpose: Phase 2's Better Auth handler must be mounted *before* `express.json()` runs, so the middleware order needs to stay easy to reason about and edit
- `src/index.ts` — entrypoint: validate env → connect Mongo → `app.listen(PORT)`

**5. Root**
- `.gitignore` — new at repo root (stray `.env`/OS files; `client/` and `server/` keep their own)

**Phase 0 verification:**
- `server`: `npm run dev` → logs Mongo connected; `curl localhost:5000/api/health` → `{"status":"ok","db":"connected"}`
- `client`: `npm run dev` → visiting `localhost:3000/api/health` (through the Next rewrite) returns the same JSON, confirming client → proxy → server → MongoDB end-to-end
- `npx tsc --noEmit` clean in both `client/` and `server/`

---

## Verification (full MVP, once all phases are implemented)

End-to-end smoke test before submission: signup via email/password **and** via Google → click "Demo Login" and confirm the email/password fields visibly auto-fill before it signs in → browse `/explore` and confirm `CourseCard`s render 4-per-row on desktop with equal height regardless of description length, each with image, title, short description, meta info, and a working "View Details" → view a course detail page (gallery, `fullDescription` overview, key info, ratings, related courses) → enroll in a free course → buy a paid course with a Stripe test card → confirm webhook-driven enrollment appears on `/dashboard` → generate a study plan, then submit feedback and confirm it regenerates with that feedback incorporated → have a chat conversation that triggers the course-search tool → go to `/items/add` and create a course as a normal user (both description fields required) → go to `/items/manage` and confirm View and Delete both work on a course you own → visit `/about` and `/contact` and submit the contact form → click every Footer nav link and social link and confirm none are dead/`#` → confirm logged-out nav shows ≥3 links and logged-in nav shows ≥5 links → check `loading`/`error` states by throttling network and forcing an API error → scan every page for any remaining lorem ipsum, placeholder image, or stub section.
