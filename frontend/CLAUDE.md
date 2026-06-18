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

In **route handlers** that require an authenticated user, don't re-implement the
`createClient()` + `getUser()` + `401` dance — call
[requireApiUser()](src/lib/auth/requireApiUser.ts) (`@/lib/auth`). It returns
either `{ user, supabase }` or a ready-to-return `401` `NextResponse`; narrow
with `instanceof NextResponse`:

```ts
const auth = await requireApiUser();
if (auth instanceof NextResponse) return auth;
const { user, supabase } = auth;
```

(Routes with **optional** auth — e.g. `/api/users/search`, `/api/users/view`,
which don't 401 — still call `getUser()` directly.)

### Signup Flows

There is a single signup path: **Google OAuth**. (Email/password was removed —
do not reintroduce a `POST /api/users` create endpoint.)

**OAuth signup** (Google → Supabase triggers `handle_new_oauth_user()`):
- A DB trigger auto-creates a partial `public.users` row (id, email, first_name, last_name) on OAuth signup
- The signup page ([signup/page.tsx](src/app/[locale]/(routes)/signup/page.tsx)) loads the
  current profile via `getCurrentUserProfile()` and resumes the wizard from the first
  unfilled step (`getResumeStep` in [signup/steps.ts](src/components/pages/signup/steps.ts),
  the single source of truth for step order). No authenticated user → step 0 (OAuth button).
- The wizard ([SignupContent](src/components/pages/signup/SignupContent.tsx)) holds the draft
  in a single local state and PATCHes `/api/users/me` after **each** step, so a refresh
  never loses progress.
- On finish: `PATCH /api/users/me` saves the last slice **and** sets
  `onboarding_completed = true`, then navigates to `/?welcome=1`.
  [HomeContent](src/components/pages/home/HomeContent.tsx) shows the welcome
  celebration when that param is present (it no longer writes the flag itself).

OAuth flow: Google → Supabase → `/auth/callback` → `exchangeCodeForSession` → `ROUTES.SIGNUP` (to complete the wizard).

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` | `/api/users/me` | Update profile fields / mark onboarding complete |
| `DELETE` | `/api/users/me` | Delete account (uses admin client) |
| `GET` | `/api/users/pseudo` | Check pseudo availability |
| `GET` | `/api/users/search` | Search users by pseudo/name |
| `GET` | `/api/users/followers` | List a user's followers |
| `GET` | `/api/users/following` | List who a user follows |
| `POST/DELETE` | `/api/users/follow` | Follow / unfollow a user |
| `POST` | `/api/users/view` | Record a (deduped) profile view |
| `GET/POST` | `/api/messages/conversations` | List / create conversations |
| `GET/POST` | `/api/messages/conversations/:id/messages` | Get / send messages in a conversation |
| `PATCH` | `/api/messages/conversations/:id/read` | Mark a conversation as read |
| `GET` | `/api/home/stats` | Home dashboard stats (followers trend, profile views) |
| `GET` | `/api/home/notifications` | List the user's home notifications |
| `POST` | `/api/home/notifications/read` | Mark home notifications as read |
| `POST` | `/api/stories` | Publish a story |
| `DELETE` | `/api/stories/:id` | Delete a story (cascades reposts) |
| `POST` | `/api/stories/:id/view` | Mark a story as viewed |
| `POST/DELETE` | `/api/stories/:id/like` | Like / unlike a story |
| `POST/DELETE` | `/api/stories/:id/repost` | Repost / un-repost a story |
| `GET` | `/api/url-title` | Fetch the title of an external URL |
| `POST` | `/api/analyze-job` | Run the job analysis pipeline |
| `GET` | `/api/analysis/:id` | Get a single job analysis |
| `GET` | `/api/history` | List the user's past job analyses |
| `GET/DELETE` | `/api/resume/:id` | Get / delete an optimized resume |
| `GET/POST` | `/api/resume/:id/pdf` | Render / generate the resume PDF |
| `GET/POST` | `/api/resume/profile/pdf` | Render the CV PDF from the user's profile |
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
phone · nationality · location · bio   text  (nullable profile fields)
created_at               timestamptz
```

Experiences and the other repeatable profile data are **normalized into child
tables** (not jsonb columns on `users`): `user_experiences`
(`type` = professional | educational | personal), `user_skills`,
`user_projects`, `user_social_networks`, `user_hobbies` — each with a `position`
column for ordering. Read them through [getCurrentUserProfile](src/lib/auth/getCurrentUser.ts)
/ [mapUserFromDb](src/lib/mappers/user.ts) (which embed the child tables via
`USER_PROFILE_SELECT`), never by selecting columns off `users` directly.

RLS is enabled. Policies allow users to read/insert/update only their own row (`auth.uid() = id`).

#### Follows & follower trends

Follow relationships live in `user_follows` (`follower_id`, `followed_id`,
`created_at`; publicly readable). Because an unfollow **deletes** the row, that
table can only ever tell you about gains — never losses.

To compute a real **net** follower trend (gains minus losses) over a time
window, every follow/unfollow is mirrored into an append-only log,
`follower_events` (`user_id`, `actor_id`, `delta` = +1 | −1, `created_at`), by
`AFTER INSERT/DELETE` triggers on `user_follows`. The table has RLS enabled
with **no policies** (deny-all): it is written only by the `SECURITY DEFINER`
trigger and read only via the service-role client / the
`get_follower_net_change(p_user_id, p_since)` RPC. Read trends through
[getHomeStats](src/lib/users/stats.ts) (`HomeStats.followersTrend`), which sums
the window's deltas via that RPC — never query `user_follows.created_at` for a
trend, as it misses unfollows.

---

## Performance & Instant Navigation

The goal is that navigating between pages feels **instantaneous**. Four patterns
enforce this — apply them to every new page.

### 1. Never block the page render on data or auth

A page must return its JSX (layout + skeletons) **without awaiting data**. Only
`await params` / `await searchParams` is allowed before `return`.

- **Stream data, don't await it.** Start the fetch (no `await`), pass the
  `Promise` down, and unwrap it with `use()` inside a `<Suspense>` boundary that
  shows a skeleton. See [getConversations](src/lib/messaging/server.ts) →
  [MessagingContent](src/components/messaging/MessagingContent.tsx).

  ```tsx
  // ✅ page renders immediately, data streams in
  const dataPromise = getData();          // not awaited
  return <Content dataPromise={dataPromise} />;
  ```

- **Gate auth in the middleware, not the page.** Protected routes are guarded in
  [proxy.ts](src/proxy.ts) (it reuses the session-refresh `getUser()` call, so no
  extra round-trip). Pages under a protected prefix can assume an authenticated
  user and must **not** `await getAuthUser()` just to redirect. Add new protected
  prefixes to `PROTECTED_PREFIXES` in `proxy.ts`.

- **Read `currentUserId` from the store, not from a server await.** The current
  user is hydrated into `useCurrentUserStore` at the layout
  ([UserHydration](src/components/UserHydration.tsx)), so client components read
  `useCurrentUserStore((s) => s.user?.id)` instead of receiving it as a prop
  fetched on the server. `UserData.id` is populated for this purpose.

### 2. Carry already-fetched data across pages (preview stores)

When a list already holds the data the destination page needs, seed a lightweight
Zustand "preview" store so the destination paints instantly while the
authoritative server data streams in behind it.

- [useMessagingStore](src/stores/useMessagingStore.ts) — the single client
  source of truth for the messaging area. Seeded (hydrated) by
  [ConversationList](src/components/pages/messaging/collections/ConversationList.tsx)
  from the streamed server data and kept live by a single Realtime subscription
  in the messaging layout ([MessagingRealtime](src/components/pages/messaging/MessagingRealtime.tsx));
  consumed by [ConversationContent](src/components/pages/messaging/ConversationContent.tsx)
  to paint the header before the conversation round-trip resolves, and by
  [ConversationItem](src/components/pages/messaging/items/ConversationItem.tsx)
  for live preview/order/unread state. It folds together what used to be three
  separate stores (preview, last-message and read mirrors).
- [useProfilePreviewStore](src/stores/useProfilePreviewStore.ts) — seeded on
  [UserCard](src/components/ui/UserCard.tsx) click; consumed by
  [ProfileTitle](src/components/profile/ProfileTitle.tsx).

Rules for preview stores:
- They are an **in-memory, render-fast cache only** — never a source of truth.
  The streamed server data still runs and owns correctness, security
  (membership / `notFound()`), and any field the seed lacks.
- Store only the few fields needed to paint instantly (e.g. name, title).
- Always render a streamed fallback for the no-seed case (hard load / deep link).

### 3. Keep visited pages warm (Router Cache)

`experimental.staleTimes` in [next.config.ts](next.config.ts) keeps dynamic pages
in the client Router Cache (`dynamic: 30s`) so back/forward and re-navigations are
served from cache instead of refetching. Don't lower these without reason.

### 4. Prefetch + skeletons

- Always link with `Link` from `@/i18n/navigation` (prefetch is on by default).
- Every async boundary needs a matching skeleton (`*Skeleton.tsx`) so the shell
  appears immediately. For dynamic routes, a route-level `loading.tsx` (reusing
  those skeletons) lets the prefetch paint an instant shell on click.

> When in doubt: **render the shell now, stream the data, seed from what you
> already have, and let the server reconcile.**

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript strict
- **Styles**: Tailwind CSS v4
- **i18n**: next-intl (locales: `en`, `fr`; prefix: `as-needed` — English URLs have no `/en/` prefix)
- **State**: Zustand
- **Fetching**: native Server Components (stream promises, unwrap with `use()`)
- **Forms**: React Hook Form + Zod
- **Tests**: Vitest + jsdom (with `@testing-library/jest-dom` matchers)

---

## Components Architecture (`src/components`)

Components are organized **by page** (feature folder) for page-specific UI, and in
shared folders (`ui/`, `form/`, `layout/`) for everything reused across pages.

### Per-page folders

Each route/page owns a folder named after the page, grouped under
`src/components/pages/`. Inside it:

```
pages/<page>/
├── <Page>Content.tsx       # entry component rendered by the route
├── index.ts                # barrel: re-exports the Content (and siblings)
├── collections/            # page-specific list/composite components (Lists, overlays)
│   └── <X>List.tsx
└── items/                  # page-specific atomic row/item components
    └── <X>Item.tsx
```

Current page folders (under `pages/`): `home/`, `jobs/` (job analysis, history
and resume editing), `messaging/` (regroups the messages list **and** the
conversation view), `profile/`, `user-list/`, `settings/`, `signup/`,
`privacy-policy/`.

Rules:
- A `XxxContent.tsx` is imported by its route via the folder barrel:
  `import { ProfileContent } from "@/components/pages/profile";`
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
- Root-level infra (`Providers.tsx`, `ThemeApplier.tsx`, `UserHydration.tsx`,
  `PresenceTracker.tsx`) stays at `src/components/` root.

### Cross-cutting feature folders

A self-contained **feature** that spans its own reader/editor/overlays and is
designed to be embedded into more than one page lives in its own top-level
folder `src/components/<feature>/` (same `collections/` + `items/` layout as a
page folder, with a barrel). It is **not** under `pages/` because it is not owned
by a single route.

- **`stories/`** — the Stories feature (reader overlay, create overlay, block
  editor, bubbles row, viewers sheet). Currently embedded by
  [HomeContent](src/components/pages/home/HomeContent.tsx) and intended for reuse
  (e.g. profiles). Server access lives in [lib/stories](src/lib/stories/); its
  endpoints are under `/api/stories/*`. Import via `@/components/stories`.

Prefer a per-page folder by default — only promote to a feature folder when a
block is genuinely reused across pages (or clearly will be).

### Deciding where a component goes

1. Used by a single page → that page's folder (`collections/` for lists/overlays,
   `items/` for items, root otherwise).
2. A self-contained feature embedded across pages → `components/<feature>/`
   (e.g. `stories/`).
3. Reused across pages or by forms → `ui/` (`ui/collections/`, `ui/items/`, or root).
4. Form-related → `form/`. Layout wrapper → `layout/`.

### Imports

- Prefer barrels: `@/components/ui`, `@/components/pages/<page>`.
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
│   ├── pages/<page>/              # Per-page folders (see Components Architecture above)
│   ├── stories/                   # Cross-cutting Stories feature (reader/editor/overlays)
│   ├── ui/                        # Shared presentational components
│   ├── form/                      # Form components and sub-form building blocks
│   ├── layout/                    # Layout wrappers (PageLayout, FormLayout, SearchLayout)
│   └── Providers.tsx / ThemeApplier.tsx / UserHydration.tsx / PresenceTracker.tsx
├── constants/                     # ALL constants, paths, config — never inline
│   └── index.ts                   # Re-exports ROUTES, API, EXTERNAL_API, UI constants
├── i18n/
│   ├── routing.ts                 # next-intl routing config
│   ├── navigation.ts              # Locale-aware Link/useRouter wrappers
│   └── request.ts                 # Server-side locale config
├── lib/
│   ├── supabase/                  # client.ts, server.ts, admin.ts, index.ts
│   ├── auth/                      # getCurrentUser + requireApiUser (route-handler auth gate)
│   ├── date.ts                    # Shared date/time + experience-period helpers
│   ├── jobs/                      # Job analysis pipeline (extract, matching, resume)
│   ├── resume/                    # Resume data + PDF templates/services
│   ├── mistral/                   # Mistral AI client
│   ├── mappers/                   # DB row → domain type mappers
│   ├── home/                      # Home dashboard stats + profile completion
│   ├── stories/                   # Stories server access (feed, viewers)
│   ├── users/ · messaging/        # Server-side data access per domain
│   └── validators/                # Zod schemas (user.ts, job.ts)
├── messages/
│   ├── en.json                    # English translations
│   └── fr.json                    # French translations (must stay in sync)
├── stores/
│   ├── useUserStore.ts            # Signup wizard state (UserState, Experience)
│   ├── useLoadingStore.ts         # Loading overlay suppression flag
│   ├── useCurrentUserStore.ts     # Authenticated user profile (populated after login)
│   ├── usePresenceStore.ts        # Online-presence tracking
│   ├── useMessagingStore.ts       # Messaging client source of truth (conversations + read state)
│   ├── useProfilePreviewStore.ts  # Profile preview cache
│   ├── useNotificationStore.ts    # Transient in-app notification banner
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
  SETTINGS_MY_INFORMATION: "/settings/my-information",
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
- Variant styles: keyed `Record` maps of class strings (see `UI_VARIANTS` in [constants/ui.ts](src/constants/ui.ts)).

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
