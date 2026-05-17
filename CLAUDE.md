# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repository Structure

This is a monorepo with two main parts:

- `frontend/` — Next.js 16 app (App Router, TypeScript strict)
- `supabase/migrations/` — SQL migration files for the Supabase database

All development commands below must be run from the `frontend/` directory.

---

## Commands

```bash
# Development
cd frontend && npm run dev

# Build
cd frontend && npm run build

# Lint
cd frontend && npm run lint

# Run all tests
cd frontend && npx vitest run

# Run a single test file
cd frontend && npx vitest run src/app/api/users/route.test.ts

# Run tests in watch mode
cd frontend && npx vitest
```

---

## Architecture

### Next.js 16 — Breaking Changes

This project uses Next.js 16, which has breaking changes vs earlier versions. **Read `node_modules/next/dist/docs/` before writing code that touches routing, middleware, or server APIs.**

Key difference: the middleware file is **`src/proxy.ts`**, not `src/middleware.ts`. It handles two concerns in sequence: i18n locale detection (next-intl) and Supabase session refresh.

> **Never create `src/middleware.ts`** — Next.js 16 picks up `proxy.ts` as the middleware entry point. All middleware logic goes in `src/proxy.ts`.

### Auth (Supabase)

Three Supabase client factories — always pick the right one:

- `@/lib/supabase` → `createBrowserClient()` — Client Components, event handlers
- `@/lib/supabase` → `createClient()` (server) — Server Components, API routes, middleware
- `@/lib/supabase/admin` → `createAdminClient()` — service-role operations only (e.g. deleting a user from `auth.users`); requires `SUPABASE_SERVICE_ROLE_KEY`

**Always use `supabase.auth.getUser()`**, never `getSession()`. `getSession()` reads from the cookie without re-validating with the server; `getUser()` does a round-trip and is the only safe option for authorization checks.

### Signup Flows

There are two signup paths that share the same wizard UI (`src/components/content/SignupContent.tsx`, exported as `SignupWizard`):

**Email/password signup** (no existing Supabase user):
- Step 0: OAuth entry point (Google) — email/password is handled via `POST /api/users`
- Steps 1–5: Name → Pseudo → DoB → Professional experiences → Educational experiences
- On finish: `POST /api/users` creates the auth user and inserts into `public.users` in one request

**OAuth signup** (Google/Apple → Supabase triggers `handle_new_oauth_user()`):
- A DB trigger auto-creates a partial `public.users` row (id, email, first_name, last_name) on OAuth signup
- The signup page detects an existing Supabase user, resumes the wizard from the right step (computed from what's already filled in `public.users`), and sets `initialUser.supabaseId`
- Each wizard step calls `PATCH /api/users/me` instead of buffering locally
- On finish: `PATCH /api/users/me` updates the profile and marks `onboarding_completed = true`

OAuth flow: Google/Apple → Supabase → `/auth/callback` → `exchangeCodeForSession` → `ROUTES.SIGNUP` (to complete the wizard).

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/users` | Create user (email/password signup) |
| `PATCH` | `/api/users/me` | Update profile fields / mark onboarding complete |
| `DELETE` | `/api/users/me` | Delete account (uses admin client) |
| `GET` | `/api/users/pseudo` | Check pseudo availability |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/health` | Health check |

### Database Schema (`public.users`)

```sql
id                       uuid     (= Supabase auth.users.id)
email                    text     unique
first_name               text
last_name                text
pseudo                   text     unique
dob                      date
onboarding_completed     boolean  not null default false
professional_experiences jsonb    default '[]'
educational_experiences  jsonb    default '[]'
created_at               timestamptz
```

RLS is enabled. Policies allow users to read/insert/update only their own row (`auth.uid() = id`).

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript strict
- **Styles**: Tailwind CSS v4
- **i18n**: next-intl (locales: `en`, `fr`; prefix: `as-needed` — English URLs have no `/en/` prefix)
- **State**: Zustand
- **Fetching**: TanStack Query or native Server Components
- **Forms**: React Hook Form + Zod
- **Tests**: Vitest + Testing Library (jsdom)

---

## Folder Structure

```
frontend/src/
├── app/
│   ├── [locale]/(routes)/         # All locale-aware pages (home, signup, update-experience/[type])
│   ├── [locale]/auth/callback/    # OAuth callback handler (locale-aware)
│   ├── app/auth/callback/         # OAuth callback (non-locale fallback)
│   └── api/                       # API route handlers
├── components/
│   ├── ui/                        # Atomic components (Button, Input, Select…)
│   ├── layout/                    # Layout wrappers (StepLayout)
│   ├── content/                   # Page-level content components (HomeContent, SignupContent, ExperienceContent)
│   ├── custom/signup/             # Signup wizard steps (StepName, StepPseudo, StepDob, StepExperience…)
│   ├── custom/experience/         # Experience list/form components
│   └── overlay/                   # Overlays (WelcomeOverlay, LoadingOverlay)
├── constants/                     # ALL constants, paths, config — never inline
│   └── index.ts                   # Re-exports ROUTES, API, EXTERNAL_API, UI constants
├── i18n/
│   ├── routing.ts                 # next-intl routing config
│   ├── navigation.ts              # Locale-aware Link/useRouter wrappers
│   └── request.ts                 # Server-side locale config
├── lib/
│   ├── supabase/                  # client.ts, server.ts, admin.ts, index.ts
│   └── validators/user.ts         # Zod schemas (CreateUserSchema, UpdateUserSchema)
├── messages/
│   ├── en.json                    # English translations
│   └── fr.json                    # French translations (must stay in sync)
├── stores/
│   ├── useUserStore.ts            # Signup wizard state (UserState, Experience)
│   └── useLoadingStore.ts         # Loading overlay suppression flag
├── proxy.ts                       # Middleware (i18n + session refresh)
└── actions/ hooks/ services/ types/ utils/   # Empty — reserved for future use
```

---

## Constants & Paths

Every route path, API endpoint, and config value lives in `src/constants/`. Import from `@/constants` everywhere.

```ts
export const ROUTES = {
  HOME: "/",
  SIGNUP: "/signup",
  UPDATE_EXPERIENCE_PRO: "/update-experience/professional",
  UPDATE_EXPERIENCE_EDU: "/update-experience/educational",
  AUTH_CALLBACK: "/auth/callback",
} as const;

export const API = {
  HEALTH: "/api/health",
  USERS: "/api/users",
  USERS_ME: "/api/users/me",
  USERS_PSEUDO_CHECK: "/api/users/pseudo",
  AUTH_LOGOUT: "/api/auth/logout",
} as const;
```

Never hardcode paths or URLs inline.

---

## Internationalization (next-intl)

Every visible string uses `t()`. Both `en.json` and `fr.json` must be updated in the same commit.

**Server Components** — `getTranslations("namespace")` from `next-intl/server`  
**Client Components** — `useTranslations("namespace")` from `next-intl`  
**Navigation** — always import `Link`, `useRouter`, `redirect` from `@/i18n/navigation`, not from `next/navigation`.

---

## Pages & Components

Page files are layout templates only — they fetch data and compose components. No raw `<p>`, `<button>`, etc. directly in pages; those live in `src/components/`.

---

## TypeScript

- `strict: true` — no `any`, use `unknown` and narrow it.
- `interface` for component props, `type` for unions/intersections.
- `const` objects over enums.

---

## Styles (Tailwind CSS)

- Mobile-first: base classes for mobile, breakpoints (`sm:`, `md:`, `lg:`) for larger screens.
- Use semantic color tokens (`bg-surface-50`, `text-txt`, `text-txt-muted`, `border-brd-200`) — never default Tailwind colors like `bg-white`.
- Conditional classes: `cn()` from `@/lib/utils` (clsx + tailwind-merge).
- Complex variants: `cva()` (class-variance-authority).

---

## Commits

Format: `type(scope): short description`

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `i18n`

---

## General Rules

1. All constants/paths in `src/constants/`, imported via `@/constants`.
2. All visible strings via `t()` — both `en.json` and `fr.json` updated together.
3. Pages delegate UI to `src/components/`.
4. `"use client"` only when hooks, events, or browser APIs are needed.
5. Absolute imports via `@/` alias.
6. No `console.log` in committed code.
7. Every folder has an `index.ts` for centralized exports.
