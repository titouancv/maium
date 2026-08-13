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

### Anonymous analyses

`/analyze` lets a signed-out visitor run the pipeline **once**, so the product's
best feature isn't hidden behind signup. The seams:

- `analysis_jobs` / `analyses` / `optimized_resumes` have a nullable `user_id`
  paired with an `anon_id`; a CHECK enforces exactly one owner. The visitor's
  parsed CV rides on `analysis_jobs.cv_extraction`, standing in for the `users`
  row the pipeline would otherwise read.
- **Anonymous rows are invisible to RLS** (no policy matches a NULL `user_id`).
  They are read with the service-role client behind an explicit ownership check
  — [ownsRow](src/lib/jobs/access.ts) — against the httpOnly `maium_anon`
  cookie. Holding that cookie *is* the authorization; never add an `anon` role
  policy to these tables.
- Realtime can't reach those rows either, so the progress UI polls when
  `anonymous` is set ([AnalysisProgress](src/components/pages/jobs/collections/AnalysisProgress.tsx)).
- Quota lives in [lib/auth/anonSession.ts](src/lib/auth/anonSession.ts) (a
  `maium_anon_used` cookie) with a per-IP backstop in
  [lib/jobs/usage.ts](src/lib/jobs/usage.ts). Refusals are **402**, distinct
  from the signed-in **429**, so the UI says "create an account" rather than
  "try again later".
- On sign-in, [claimAnonSession](src/lib/auth/claimAnonSession.ts) reassigns the
  visitor's rows to the account and copies their CV into the profile's **gaps**.
  The same OAuth callback serves a returning user, so the import is skipped
  entirely once `onboarding_completed` is true and otherwise only fills empty
  fields — `writeProfile` replaces collections wholesale, so an unguarded claim
  would wipe an existing profile. Best-effort — it must never cost the user
  their sign-in.

### The analysis page

`/jobs/<analysisId>` is the product's destination page: the analysis is no longer
an overlay over the history. Four seams are worth knowing.

- **Prep points replaced the diagnosis.** The matching call no longer returns
  `strengths` / `weaknesses` / `missing_skills` / `recommendations`; those
  columns are gone. It returns `prep_points` (an action, its rationale, a `kind`
  and a search query) plus `recruiter_questions`. A list of gaps told the user
  nothing to *do* — every item on the page is now something they can act on.
- **The model never emits a URL.** It returns a `resource_query` +
  `resource_kind`, and [prepResourceUrl](src/lib/jobs/resources.ts) turns that
  into a YouTube or Google search link. An LLM asked for a real URL invents dead
  ones; a search query cannot be wrong in that way. Never let the schema carry a
  `url` field.
- **Contacts come from the profile graph, not a contacts table.** `jobs.company`
  is matched against `user_experiences.organization` through the
  `normalize_company()` SQL function (case, punctuation and legal suffixes
  stripped). `user_experiences` is RLS own-row-only, so the read goes through the
  `SECURITY DEFINER` RPC `get_company_contacts`, which returns only fields
  already public on a profile and excludes the caller.
- **Tracking is signed-in only.** `analyses.status` / `applied_at` /
  `interview_at` / `notes` are written with the RLS-scoped user client, never the
  admin client — an anonymous run has no account to track against and its rows
  expire. `analysis_status_events` is append-only, written by an `AFTER UPDATE OF
  status` trigger (same shape as `follower_events`), so the timeline survives
  edits. The anonymous `/analyze` result therefore renders
  [AnalysisView](src/components/pages/jobs/collections/AnalysisView.tsx) inline
  with no `tracking` / `contacts` slot — `/jobs` is a protected prefix, so a
  signed-out visitor can never reach the real page.

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
  in a single local state and PATCHes `/api/users/me` after **each** step (via
  [updateProfile](src/lib/users/updateProfile.ts)), so a refresh never loses progress.
- Steps: `cv` → `fullName` → `pseudo` → `date` → `gender` → `photo`. The CV import
  leads because it pre-fills the full name **and** the deep profile (experiences,
  education, skills) the wizard would otherwise never collect.
- `cv` and `photo` are marked `optional` in `SIGNUP_STEPS`. Optional steps are
  skipped by `getResumeStep` and ignored by `hasCompletedOnboarding` — they can't
  be "filled", so counting them would trap a user who skips one in the wizard
  forever (the home page bounces incomplete users back).
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
| `GET` | `/api/url-title` | Fetch the title of an external URL |
| `POST` | `/api/cv/parse` | OCR an uploaded CV into a profile draft (auth optional) |
| `POST` | `/api/analyze-job` | Run the job analysis pipeline (auth optional) |
| `GET` | `/api/analysis/:id` | Analysis job status (owner-scoped) |
| `PATCH` | `/api/analysis/:id` | Update application tracking (status, dates, notes) |
| `GET` | `/api/analysis/:id/result` | Get a finished analysis (owner-scoped) |
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

- **`ui/`** — reusable presentational components (catalogued under **UI
  Components** below). Shared `List`/`Item` components used by more than one page
  (or by forms) live in `ui/collections/` and `ui/items/` respectively; icons in
  `ui/icons/`. Shared overlays consumed by infra/ui (`LoadingOverlay`,
  `SearchOverlay`) live at `ui/` root. Import via `@/components/ui`.
- **`form/`** — form components and `form/sub-form/` building blocks.
- **`layout/`** — layout wrappers (`PageLayout`, `FormLayout`, `SearchLayout`).
- Root-level infra (`Providers.tsx`, `ThemeApplier.tsx`, `UserHydration.tsx`,
  `PresenceTracker.tsx`) stays at `src/components/` root.

### Cross-cutting feature folders

A self-contained **feature** that spans its own reader/editor/overlays and is
designed to be embedded into more than one page lives in its own top-level
folder `src/components/<feature>/` (same `collections/` + `items/` layout as a
page folder, with a barrel). It is **not** under `pages/` because it is not owned
by a single route. There is currently no such folder.

Prefer a per-page folder by default — only promote to a feature folder when a
block is genuinely reused across pages (or clearly will be).

### Deciding where a component goes

1. Used by a single page → that page's folder (`collections/` for lists/overlays,
   `items/` for items, root otherwise).
2. A self-contained feature embedded across pages → `components/<feature>/`.
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
│   ├── auth/callback/             # OAuth callback handler
│   └── api/                       # API route handlers
├── components/
│   ├── pages/<page>/              # Per-page folders (see Components Architecture above)
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
│   ├── cv/                        # CV import: Mistral OCR + LLM parse into a profile draft
│   ├── jobs/                      # Job analysis pipeline (extract, matching, resume)
│   ├── resume/                    # Resume data + PDF templates/services
│   ├── mistral/                   # Mistral AI client
│   ├── mappers/                   # DB row → domain type mappers
│   ├── home/                      # Home dashboard stats + profile completion
│   ├── users/ · messaging/        # Server-side data access per domain
│   └── validators/                # Zod schemas (user.ts, job.ts, cv.ts)
├── messages/
│   ├── en.json                    # English translations
│   └── fr.json                    # French translations (must stay in sync)
├── stores/
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

## Comments

**Never write a comment.** The codebase contains none, and none may be
reintroduced — not when adding code, not when editing it. Code documents itself
through names; a comment is a name that wasn't found.

- ❌ `//` and `/* */` in TS/TSX, JSDoc `/** */`, `{/* */}` in JSX, `/* */` in
  CSS, `--` banners in new SQL, section separators, `TODO` / `FIXME` markers,
  and commented-out code (delete it — git remembers).
- ✅ The **only** comments allowed are machine-read directives, because the
  tooling needs them: `eslint-disable*`, `@ts-expect-error`, `prettier-ignore`,
  `/// <reference>`. Nothing else.

When the urge to explain arises, do one of these instead:

1. **Rename.** `prependPrevHeightRef` beats `prevHeight` + a comment.
2. **Extract.** Pull the block into a named function or a named `const` — the
   name carries what the comment would have said.
3. **Document it here.** Cross-cutting *why* (an invariant, a security seam, a
   browser quirk) belongs in this file, where it is read once and stays true —
   not scattered next to the code, where it silently rots.

Existing SQL migrations in `supabase/migrations/` keep their comments: they are
applied, immutable history. New migrations follow the rule above.

---

## Styles (Tailwind CSS)

- Mobile-first: base classes for mobile, breakpoints (`sm:`, `md:`, `lg:`) for larger screens.
- Use semantic color tokens (`bg-surface-50`, `text-txt`, `text-txt-muted`, `border-brd-200`) — never default Tailwind colors like `bg-white`.
- Conditional classes: `cn()` from `@/lib/utils` (clsx + tailwind-merge).
- Variant styles: keyed `Record` maps of class strings (see `UI_VARIANTS` in [constants/ui.ts](src/constants/ui.ts)).

### Everything sits at the same level

**No component draws a border or a background of its own.** There are no cards,
no panels, no boxes, no tinted callouts, no dividers. Every block of the page
sits on `bg-surface-50` at the same depth, and separation comes from **spacing,
type, and the [Rail](src/components/ui/Rail.tsx) / [AccentBar](src/components/ui/AccentBar.tsx)
bars** — never from a container.

Concretely, when building or editing a component:

- ❌ `border`, `border-t/b/l/r`, `<hr>`, `divide-*` — use a gap instead.
- ❌ `bg-surface-100/200`, `bg-error/10`, `bg-secondary-600`, `shadow` on a
  container — a block never gets its own ground.
- ❌ a "card" wrapper around a summary, a warning or a stat.
- ✅ state and emphasis are carried by **text colour**: `text-error`,
  `text-primary`, `text-txt-muted` (via [InfoMessage](src/components/ui/InfoMessage.tsx)
  and [Text](src/components/ui/Text.tsx)).
- ✅ a row is marked by a `Rail`, a heading by an `AccentBar`.

The few backgrounds that remain are **functional, not decorative**, and are the
complete list — do not add to it: input fields (`TextInput`, `TextArea`, and the
hover/focus tint on `DateInput` / `PhoneInput`), the [Skeleton](src/components/ui/Skeleton.tsx)
placeholder, the pill behind `Tabs` and `Selector`, `Button`'s own variants, the photo frame in
`ProfilePhotoPicker`, the white QR card (scannability), and `Overlay`'s
`bg-surface-50` (it must hide the page underneath).

### Loading states: a word, never a spinner

**Never build a spinner** — no `animate-spin`, no rotating ring, no dots, no
shimmer invented on the spot. Say it in words instead:

- A button that is working: `<Button isLoading>` (it swaps itself for text).
- A step with real progress: [ProgressBar](src/components/ui/ProgressBar.tsx).
- A list or region that is fetching: the translated word — `t("loading")` from
  the `common` namespace — inside a `<Text tone="muted" size="sm">`.
- A shell that will be replaced by content: [Skeleton](src/components/ui/Skeleton.tsx).

### No tooltips

**Never build a tooltip** — no hover card, no `title=` attribute used as one, no
popover explaining a control. If something needs explaining, the explanation is
visible on the page: a `<Text tone="muted" size="sm">` under the control, or a
clearer label. Icon-only controls carry an `aria-label` for assistive tech, not
a visual tooltip.

---

## UI Components (`src/components/ui`)

Check this list before writing any markup — these exist so the same thing is
never invented twice. Import from `@/components/ui`.

| Component | Use it for |
|---|---|
| `Overlay` | **Every** full-screen overlay. Portals to `body`, fades in, closes on Escape (topmost only, so nested sub-forms work), paints `bg-surface-50`. Put a `PageLayout` / `FormLayout` / `SearchLayout` inside; wrap in `AnimatePresence` for the exit fade. Never hand-roll `fixed inset-0 z-50`. |
| `Text` | Body copy. `tone` = default \| muted \| primary, `size` = xs \| sm \| base \| lg, `as` = p \| span \| div \| li, plus `truncate`. Replaces every `text-txt-muted text-sm` pair. |
| `InfoMessage` | Any error, confirmation or hint. Renders nothing when `message` is empty, so pass a possibly-undefined error straight through — no `&&` guard. |
| `EmptyState` | What a list renders instead of its rows. `align="center"` when it owns the region. |
| `Icon` | Every icon, from a fixed set (`arrowRight`, `bell`, `check`, `chevronLeft`, `chevronRight`, `close`, `externalLink`, `search`). **Add a path to `ui/icons/Icon.tsx` rather than inlining an `<svg>`.** `GoogleMark` is the one brand-coloured exception. |
| `AccentBar` | The short bar under a heading. |
| `Rail` | The vertical bar that marks a row (experience, hobby, message, quote). Pass `bg-primary` to mark it as the user's own. |
| `ScrollRow` | A row that scrolls sideways with the scrollbar hidden. |
| `FilePicker` | The hidden `<input type="file">` behind a `Button`. Hold a ref, call `open()`. |
| `ExpandableText` | Long copy clamped to N lines with a see more / see less toggle. |
| `Title` · `Section` · `Markdown` | Headings and long-form content. |
| `Button` · `Chip` · `ChipList` · `Tabs` · `TabsVertical` · `MenuList` · `SlideToEnter` | Actions and choices. |
| `Selector` | One value at a time out of an **ordered** list: chevrons step through it, the neighbours peek in at the edges under a fade. Each value carries its own colour along the secondary → primary scale (`scaleColor` in [constants/ui.ts](src/constants/ui.ts)); pass an explicit `color` per value to reuse a canonical scale such as `APPLICATION_STATUS_COLORS`. Use `Tabs` instead when every option must be visible at once. |
| `TextInput` · `TextArea` · `DateInput` · `PhoneInput` · `SearchInput` · `LocationInput` | Fields (see `form/` for whole steps). |
| `Skeleton` · `ProgressBar` · `NumberRoller` | Loading and numbers. |
| `UserCard` · `ProfilePhoto` · `ProfilePhotoPicker` | People. |

**Not in this project, and not to be created:** tooltip, spinner, card, panel,
divider, badge, accordion, modal-with-a-backdrop-card. For a transient message
use `useNotificationStore` + `NotificationBanner`, which already exist.

If a genuinely new primitive is needed, add it to `ui/`, export it from the
barrel, and add a row here — don't inline it at the call site.

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
7. **No comments** — only machine-read directives (see **Comments**).
8. Every folder has an `index.ts` for centralized exports.
9. Reach for an existing `ui/` component before writing markup — and never build
   a tooltip or a spinner (see **Styles**).
10. No component gets its own border or background; everything sits at the same
    level (see **Styles**).
