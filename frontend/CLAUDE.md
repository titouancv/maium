# CLAUDE.md

Guidance for working in the `frontend/` Next.js app.

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
npm run dev

# Build
npm run build

# Lint
npm run lint

# Run all tests
npx vitest run

# Run a single test file
npx vitest run src/app/api/users/route.test.ts

# Run tests in watch mode
npx vitest
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

There are two signup paths that share the same wizard UI:

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
| `GET` | `/api/users/search` | Search users by pseudo/name |
| `GET` | `/api/users/followers` | List a user's followers |
| `GET` | `/api/users/following` | List who a user follows |
| `POST/DELETE` | `/api/users/follow` | Follow / unfollow a user |
| `GET/POST` | `/api/messages/conversations` | List / create conversations |
| `GET/POST` | `/api/messages/conversations/:id/messages` | Get / send messages in a conversation |
| `GET` | `/api/url-title` | Fetch the title of an external URL |
| `POST` | `/api/jobs/parse` | Parse a job posting |
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

## Components Architecture (`src/components`)

Components are organized **by page** (feature folder) for page-specific UI, and in
shared folders (`ui/`, `form/`, `layout/`) for everything reused across pages.

### Per-page folders

Each route/page owns a folder named after the page. Inside it:

```
<page>/
├── <Page>Content.tsx       # entry component rendered by the route
├── index.ts                # barrel: re-exports the Content (and siblings)
├── collections/            # page-specific list/composite components (Lists, overlays)
│   └── <X>List.tsx
└── items/                  # page-specific atomic row/item components
    └── <X>Item.tsx
```

Current page folders: `home/`, `messaging/` (regroups the messages list **and**
the conversation view), `profile/`, `user-list/`, `settings/`, `signup/`,
`privacy-policy/`.

Rules:
- A `XxxContent.tsx` is imported by its route via the folder barrel:
  `import { ProfileContent } from "@/components/profile";`
- A `List` used by only one page lives in that page's `collections/`.
- An `Item` used by only one page lives in that page's `items/`.
- Overlays specific to one page go in that page's `collections/`
  (e.g. `home/collections/WelcomeOverlay`, `settings/collections/EditInfoOverlay`).
- A page-specific component that is neither a list nor an item (e.g. a button)
  sits at the page folder root (e.g. `messaging/NewConversationButton.tsx`).

### Shared folders

- **`ui/`** — reusable presentational components. Shared `List`/`Item` components
  used by more than one page (or by forms) live in `ui/collections/` and
  `ui/items/` respectively. Shared overlays consumed by infra/ui
  (`LoadingOverlay`, `SearchOverlay`) live at `ui/` root. Import via `@/components/ui`.
- **`form/`** — form components and `form/sub-form/` building blocks.
- **`layout/`** — layout wrappers (`PageLayout`, `FormLayout`, `SearchLayout`).
- Root-level infra (`Providers.tsx`, `ThemeApplier.tsx`, `UserHydration.tsx`)
  stays at `src/components/` root.

### Deciding where a component goes

1. Used by a single page → that page's folder (`collections/` for lists/overlays,
   `items/` for items, root otherwise).
2. Reused across pages or by forms → `ui/` (`ui/collections/`, `ui/items/`, or root).
3. Form-related → `form/`. Layout wrapper → `layout/`.

### Imports

- Prefer barrels: `@/components/ui`, `@/components/<page>`.
- Types like `HobbyData` come from `@/types/user`, not from component barrels.

---

## Folder Structure

```
frontend/src/
├── app/
│   ├── [locale]/(routes)/         # All locale-aware pages
│   ├── [locale]/auth/callback/    # OAuth callback handler (locale-aware)
│   ├── app/auth/callback/         # OAuth callback (non-locale fallback)
│   └── api/                       # API route handlers
├── components/
│   ├── <page>/                    # Per-page folders (see Components Architecture above)
│   ├── ui/                        # Shared presentational components
│   ├── form/                      # Form components and sub-form building blocks
│   ├── layout/                    # Layout wrappers (PageLayout, FormLayout, SearchLayout)
│   └── Providers.tsx / ThemeApplier.tsx / UserHydration.tsx
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
│   ├── useLoadingStore.ts         # Loading overlay suppression flag
│   ├── useCurrentUserStore.ts     # Authenticated user profile (populated after login)
│   └── useThemeStore.ts           # Theme preference (light/dark)
├── proxy.ts                       # Middleware (i18n + session refresh)
├── hooks/                         # Custom React hooks
└── types/                         # Shared TypeScript types (user.ts, messaging.ts, experience.ts)
```

---

## Constants & Paths

Every route path, API endpoint, and config value lives in `src/constants/`. Import from `@/constants` everywhere.

```ts
export const ROUTES = {
  HOME: "/",
  SIGNUP: "/signup",
  SETTINGS: "/settings",
  SETTINGS_ACCOUNT: "/settings/account",
  SETTINGS_PERSONAL_DATA: "/settings/personal-data",
  SETTINGS_PERSONALIZATION: "/settings/personalization",
  AUTH_CALLBACK: "/auth/callback",
  PROFILE: (pseudo: string) => `/profile/${pseudo}`,
  PROFILE_FOLLOWERS: (pseudo: string) => `/profile/${pseudo}/followers`,
  PROFILE_FOLLOWING: (pseudo: string) => `/profile/${pseudo}/following`,
  PRIVACY_POLICY: "/privacy-policy",
  MESSAGES: "/messages",
  CONVERSATION: (id: string) => `/messages/${id}`,
} as const;

export const API = {
  HEALTH: "/api/health",
  USERS: "/api/users",
  USERS_ME: "/api/users/me",
  USERS_PSEUDO_CHECK: "/api/users/pseudo",
  USERS_SEARCH: "/api/users/search",
  USERS_FOLLOWERS: "/api/users/followers",
  USERS_FOLLOWING: "/api/users/following",
  AUTH_LOGOUT: "/api/auth/logout",
  URL_TITLE: "/api/url-title",
  MESSAGES_CONVERSATIONS: "/api/messages/conversations",
  MESSAGES_CONVERSATION_MESSAGES: (id: string) =>
    `/api/messages/conversations/${id}/messages`,
} as const;

export const EXTERNAL_API = {
  PHOTON_GEOCODE: "https://photon.komoot.io/api/",
  FAVICON: "https://www.google.com/s2/favicons",
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
