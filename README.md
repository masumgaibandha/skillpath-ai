# SkillPath AI

A full-stack, AI-powered course discovery and learning platform. Browse and filter a real course catalog, enroll for free or pay with Stripe, get a personalized AI-generated study roadmap, and chat with a course-aware AI assistant that searches the real catalog instead of inventing answers.

## Live deployment

- **Frontend:** https://skillpath-ai-frontend-umber.vercel.app
- **Backend API:** https://skillpath-ai-api.vercel.app
- **Repository:** https://github.com/masumgaibandha/skillpath-ai

> **Deployment status note:** as of this writing, the deployed **backend** has not yet been redeployed since the AI Study Planner and AI Chat Assistant were added — `/api/study-plan/*` and `/api/chat/*` currently 404 in production even though the corresponding frontend pages are live. See [Known limitations](#known-limitations) for exactly what needs to happen before those two features work on the live site.

## Main features

- **Course catalog** — search, category/level/free filters, sorting, and pagination over real, seeded course data (Explore page), plus a public course detail page with an image gallery, ratings, and related courses.
- **Authentication** — email/password and Google OAuth via Better Auth, plus a one-click **Demo Login** that visibly fills in seeded demo credentials before signing in (never a silent sign-in).
- **Course management** — any signed-in user can add and manage their own courses (owner-based, not admin-gated) at `/items/add` and `/items/manage`, with real server-side ownership checks on every mutation.
- **Enrollment & payments** — free enrollment, and paid enrollment via a real Stripe Checkout Session with a signed, idempotent webhook that activates the enrollment only after payment is confirmed.
- **Dashboard** — enrollment/ownership stats and a Recharts bar chart of enrollments by category, computed from the signed-in user's real data.
- **AI Study Planner** (`/dashboard/study-plan`) — generates a personalized roadmap (recommended courses, weekly milestones, risks, next actions) from a goal, skill level, budget, and timeframe. Recommendations are always drawn from and validated against real published MongoDB courses.
- **AI Chat Assistant** (`/dashboard/chat`) — a course-aware chat assistant with one `searchCourses` tool. Answers plain learning questions directly, and searches the real catalog (never invents a course, price, or ID) whenever the learner asks about topics, budgets, comparisons, or "what's next."
- Custom 404 page, per-route loading skeletons, empty/error states with retry, and toast notifications throughout.

## Technology stack

**Client** (`client/`): Next.js (App Router), TypeScript (strict), Tailwind CSS v4, HeroUI, TanStack Query, Recharts, Better Auth client.

**Server** (`server/`): Express.js, TypeScript (strict), MongoDB + Mongoose, Better Auth (Node/Express adapter, native MongoDB adapter), Stripe SDK, official OpenAI SDK, Zod for all input/output validation.

## Architecture summary

- **Monorepo, no shared workspace tooling** — `client/` and `server/` are independent npm projects; small shared types are duplicated rather than published as a shared package.
- **Auth lives entirely in Express**, mounted via Better Auth's `toNodeHandler`, using Better Auth's own MongoDB collections (`user`/`session`/`account`/`verification`) alongside the app's own Mongoose models in the same database.
- **Next.js proxies `/api/*` to Express** via a rewrite in `next.config.ts`, so the browser only ever talks to one origin — this is what makes cross-site cookies and the Google OAuth callback work without CORS complexity.
- **Two-layer route protection**: Next's `middleware.ts` does a fast client-side redirect for UX; every protected Express route independently re-verifies the session and, where relevant, resource ownership. The client-side check is never trusted alone.
- **Course management is owner-based**: any authenticated user can create/manage courses; `Course.createdBy` is checked against the session user on every mutating request. There's no admin role.
- **AI features live in Express**, not in Next.js route handlers — they need direct Mongoose access to course data, and this keeps OpenAI calls, DB reads, and auth in one process.
- **Demo AI Mode** (`AI_DEMO_MODE`): see [AI Study Planner & Chat Assistant](#ai-study-planner--chat-assistant-modes) below — a deterministic, cost-free stand-in for the real OpenAI integration, sharing the exact same validation/search code paths.
- **Stripe webhook** uses Express's raw body parser scoped to just that one route, registered before the global JSON body parser — required for signature verification to work.

## Local installation

Prerequisites: Node.js 20+, a MongoDB connection (local `mongod` or an Atlas free-tier cluster), and npm.

```bash
git clone https://github.com/masumgaibandha/skillpath-ai.git
cd skillpath-ai

# Server
cd server
cp .env.example .env   # then fill in the required values, see below
npm install
npm run seed            # seeds ~25 real courses
npm run seed:demo       # creates the demo login account
npm run dev              # http://localhost:5000

# Client (separate terminal)
cd client
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```

Visit `http://localhost:3000`. Demo Login on `/login` works immediately after `npm run seed:demo`; other features depend on which optional env vars you've filled in (see below — most gracefully degrade rather than crash when unset).

## Environment variables

### `server/.env`

| Variable | Required? | Notes |
|---|---|---|
| `PORT` | no | defaults to `5000` |
| `MONGODB_URI` | **yes** | local `mongod` or an Atlas connection string |
| `CLIENT_ORIGIN` | **yes** | the Next.js app's origin — also Better Auth's cookie/OAuth-callback origin. Must be `https://` and the real deployed frontend URL in production (enforced by a schema check) |
| `BETTER_AUTH_SECRET` | **yes** | generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | required feature | Google OAuth 2.0 credentials; server still starts and email/password auth still works without them, but Google sign-in is required for this project and shouldn't be left unset in a real deployment |
| `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` | yes | seeded via `npm run seed:demo`; powers the Demo Login button |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | required for paid checkout | free enrollment works without them; paid checkout/webhook are disabled until both are set |
| `OPENAI_API_KEY` | required for real AI mode | leave unset (with `AI_DEMO_MODE=true`) to run the AI features in demo mode instead |
| `OPENAI_MODEL` | no | defaults to `gpt-4o-mini` |
| `AI_DEMO_MODE` | no | **defaults to `false`** — see [AI modes](#ai-study-planner--chat-assistant-modes) |

### `client/.env.local`

| Variable | Required? | Notes |
|---|---|---|
| `API_URL` | **yes** (production) | the Express backend's base URL, used server-side by the `/api/*` rewrite proxy. Defaults to `http://localhost:5000` for local dev — must be set to the real deployed backend URL in production |
| `NEXT_PUBLIC_DEMO_EMAIL` / `NEXT_PUBLIC_DEMO_PASSWORD` | no | must match the server's `DEMO_USER_EMAIL`/`DEMO_USER_PASSWORD`; only used to visibly pre-fill the Demo Login button. Not secret — these are meant to be public demo credentials |

No `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `MONGODB_URI`, or `BETTER_AUTH_SECRET` are ever read on the client, referenced with a `NEXT_PUBLIC_` prefix, or returned in any API response — the two AI config endpoints (`GET /api/study-plan/config`, `GET /api/chat/config`) return only a derived `{ demoMode: boolean }`, never the underlying env values.

## Demo credentials

```
demo@skillpathai.com
DemoPass123!
```

Click **Demo Login** on `/login` — it visibly fills these into the form before signing in, it never signs in silently.

## Authentication

Email/password and Google OAuth, both via [Better Auth](https://www.better-auth.com/), mounted directly in Express. Sessions are cookie-based; because the Next.js app proxies `/api/*` to Express under one browser-visible origin, the session cookie works without any cross-site cookie configuration. Every protected page does a fast optimistic redirect client-side, and every protected API route independently re-verifies the session server-side — the client-side check is a UX nicety, never the actual security boundary.

## Stripe (test mode)

Checkout uses a dynamically-built Stripe Checkout Session (`price_data` built from the course's real MongoDB price/currency at request time, not a pre-created Stripe Product). The `checkout.session.completed` webhook is signature-verified (`stripe.webhooks.constructEvent`) and applies an idempotent, atomic `findOneAndUpdate` that only flips an enrollment from `pending` to `active` once — redelivering the same event is a safe no-op, and a cancelled/incomplete checkout never activates an enrollment (there is no code path that sets `status: "active"` anywhere except inside the verified webhook handler). Use Stripe's [test card numbers](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`) against test-mode keys.

## AI Study Planner & Chat Assistant modes

Both AI features run in one of two mutually-exclusive modes, decided once per request by the `AI_DEMO_MODE` env var — there is no fallback between them, so a failed real OpenAI call never silently degrades into a demo response.

- **Real OpenAI mode** (`AI_DEMO_MODE=false`, the default, with `OPENAI_API_KEY` set) — uses the official OpenAI Node SDK. The Study Planner uses structured outputs (`zodResponseFormat`) against real course data given as context. The Chat Assistant runs an actual OpenAI tool-calling loop against one `searchCourses` tool, then a final structured turn — genuine model-generated responses.
- **Demo AI Mode** (`AI_DEMO_MODE=true`) — a **deterministic, cost-free** stand-in that never contacts OpenAI. It runs the exact same `searchCourses` MongoDB query and the exact same course-ID sanitization/validation the real mode uses — every course it can ever reference is real and published, nothing is invented — but the "reasoning" (which courses to recommend, how to phrase a reply, how to answer a follow-up like "course fee" or "how long is it") is produced by explicit, rule-based logic in `server/src/lib/studyPlanDemo.ts` / `server/src/lib/chatDemo.ts`, not by a language model. The UI shows a visible "Demo AI Mode" badge whenever it's active, and demo responses are never presented as live OpenAI output.

`AI_DEMO_MODE` defaults to `false` in committed code and in `.env.example` — a deployment only runs in demo mode if that variable is explicitly set to `true` for that specific deployment's environment. For the **deployed presentation environment**, the backend's Vercel project should have `AI_DEMO_MODE=true` set so both AI features work without an OpenAI API key or any usage cost.

## Scripts

### Client (`client/`)
```bash
npm run dev      # start the Next.js dev server
npm run build    # production build
npm start        # run the production build
npm run lint     # ESLint
npx tsc --noEmit # typecheck (no dedicated script; run directly)
```

### Server (`server/`)
```bash
npm run dev        # tsx watch — dev server with auto-restart
npm run build       # tsc -p tsconfig.json — compiles to dist/
npm start           # run the compiled build
npm run typecheck   # tsc --noEmit
npm run seed         # seed ~25 real courses
npm run seed:demo    # create the seeded demo login account
```
The server has no ESLint configuration.

## Deployment

- **Frontend** → Vercel, root directory `client/`. Set `API_URL` to the deployed backend's URL and both `NEXT_PUBLIC_DEMO_*` vars in the Vercel project's environment variables.
- **Backend** → Vercel, root directory `server/`. Set every variable listed in [server/.env](#serverenv) above. For the presentation/demo deployment specifically, also set `AI_DEMO_MODE=true` so the AI features work without OpenAI billing.
- **Database** → MongoDB Atlas (free tier is sufficient).
- **Stripe webhook** → in the Stripe Dashboard, add an endpoint pointing at `https://<your-backend>.vercel.app/api/webhooks/stripe` listening for the `checkout.session.completed` event, then set the endpoint's signing secret as `STRIPE_WEBHOOK_SECRET` on the backend deployment.

## Known limitations

- **The deployed backend is currently behind the deployed frontend.** The frontend at the live URL above serves the `/dashboard/study-plan` and `/dashboard/chat` pages, but the live backend has not yet been redeployed to include their API routes (`/api/study-plan/*`, `/api/chat/*` currently return 404). The frontend and backend Vercel projects need to be redeployed from the current `main` branch, and the backend deployment needs `AI_DEMO_MODE=true` set, before those two features work end-to-end on the live site.
- **The production Stripe webhook is not yet configured** — the deployed backend currently returns `503 Stripe webhook is not configured: set STRIPE_WEBHOOK_SECRET` for webhook deliveries. Paid checkout sessions can still be created, but a completed payment will not activate the enrollment in production until the webhook endpoint above is registered in the Stripe Dashboard and `STRIPE_WEBHOOK_SECRET` is set on the backend deployment.
- No automated test suite — verification throughout development has been manual/curl-based smoke testing rather than a formal test suite (a deliberate scope decision for this project's timeline).
- No admin role or moderation queue for user-submitted courses — course management is intentionally owner-based only.
- The Chat Assistant's Demo AI Mode uses rule-based intent detection (topic search, comparisons, follow-ups, a small fixed glossary of common terms) rather than open-ended natural-language understanding — it will not answer arbitrary general-knowledge questions outside that glossary as accurately as real OpenAI mode does.
- Explore page's price filtering UI only exposes a "Free only" checkbox; the underlying API supports a min/max price range but there's no range-slider control for it yet.

## Screenshots

_Screenshots have not been added yet — this section is a placeholder for whoever finalizes the submission._

- `docs/screenshots/landing.png` — Landing page
- `docs/screenshots/explore.png` — Explore page with filters applied
- `docs/screenshots/course-detail.png` — Course detail page
- `docs/screenshots/dashboard.png` — Dashboard with Recharts visualization
- `docs/screenshots/study-planner.png` — AI Study Planner with a generated plan
- `docs/screenshots/chat.png` — AI Chat Assistant with a referenced-course card
- `docs/screenshots/mobile.png` — Mobile responsive view

`
## Author:
- Abdullah Al Masum
- Full Stack Developer
- masum@masumdev.com
- masumdev.com
`
