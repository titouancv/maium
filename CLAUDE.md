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

### Form System

All forms go through `<Form />` (`src/components/form/Form.tsx`). It dispatches to the right sub-form based on `type` and wraps everything in `FormLayout` (header with title + step counter, scrollable content area, action buttons fixed above the keyboard on mobile).

#### Available form types

| `type`            | What it collects                 | Submit pattern |
| ----------------- | -------------------------------- | -------------- |
| `"text"`          | Single text input                | `formId`       |
| `"longText"`      | Multi-line textarea              | `formId`       |
| `"fullName"`      | First name + last name           | `formId`       |
| `"pseudo"`        | Username with availability check | `formId`       |
| `"date"`          | Date of birth                    | `formId`       |
| `"dateRange"`     | Start / end dates                | `formId`       |
| `"phoneNumber"`   | Phone number                     | `formId`       |
| `"location"`      | City/country picker              | `formId`       |
| `"experiences"`   | Experience list editor           | `onPrimary`    |
| `"hobbies"`       | Hobby picker                     | `onPrimary`    |
| `"keys"`          | Free-form tag list               | `onPrimary`    |
| `"urls"`          | URL list                         | `onPrimary`    |
| `"socialNetwork"` | Social network links             | `onPrimary`    |

#### Two submit patterns

**`formId` pattern** — the sub-form renders a `<form id={formId}>`. The primary button is `type="submit"`, so validation runs on click. `onChange` fires on each change; the submit triggers whatever action is wired to `onChange`.

```tsx
import { SIGNUP_FORM_ID } from "@/constants";

<Form
  type="text"
  formId={SIGNUP_FORM_ID}
  placeholder={t("myPlaceholder")}
  step={1}
  totalSteps={3}
  primaryLabel={t("next")}
  onChange={(value) => handleNext(value)}
/>;
```

**`onPrimary` pattern** — the sub-form has no `<form>`. `onChange` fires on each change (update local state); `onPrimary` fires when the primary button is clicked (use the local state to save).

```tsx
const [items, setItems] = useState<string[]>([]);

<Form
  type="keys"
  placeholder={t("myPlaceholder")}
  step={2}
  totalSteps={3}
  primaryLabel={t("save")}
  onChange={setItems}
  onPrimary={() => save({ skills: items })}
/>;
```

#### Layout props reference

| Prop                                        | Purpose                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `title`                                     | Overrides the default per-type title             |
| `step` / `totalSteps`                       | Drives the step counter in the header            |
| `primaryLabel`                              | Label for the primary button                     |
| `primaryLoading`                            | Shows spinner and disables primary button        |
| `isCancelable` + `onCancel` + `cancelLabel` | Replaces step counter with a cancel button       |
| `secondaryLabel` + `onSecondary`            | Adds a second outline button left of the primary |

#### Adding a new form type

1. Create `src/components/form/MyTypeForm.tsx` — a `"use client"` component. For the `formId` pattern, wrap inputs in `<form id={formId} onSubmit={...}>` and call `onChange` on submit. For the `onPrimary` pattern, call `onChange` on every change.
2. Register the type in the three maps in `Form.tsx`:
   - `FormValueMap` — shape that `onChange` emits
   - `FormDefaultValueMap` — shape of `defaultValue`
   - `FormConfigMap` — extra required props (use `never` if none)
3. Add a `case "myType":` in `renderContent` and `getDefaultTitle`.
4. Export from `src/components/form/index.ts`.

### API Routes

| Method   | Path                | Purpose                                          |
| -------- | ------------------- | ------------------------------------------------ |
| `POST`   | `/api/users`        | Create user (email/password signup)              |
| `PATCH`  | `/api/users/me`     | Update profile fields / mark onboarding complete |
| `DELETE` | `/api/users/me`     | Delete account (uses admin client)               |
| `GET`    | `/api/users/pseudo` | Check pseudo availability                        |
| `POST`   | `/api/auth/logout`  | Sign out                                         |
| `GET`    | `/api/health`       | Health check                                     |

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
│   ├── [locale]/(routes)/         # Locale-aware pages
│   │   ├── page.tsx               # Home
│   │   ├── signup/page.tsx        # Signup wizard
│   │   └── settings/              # Settings (page, account, personal-data)
│   ├── [locale]/layout.tsx        # Root locale layout
│   ├── auth/callback/             # OAuth callback (non-locale)
│   └── api/                       # API route handlers
│       ├── users/                 # POST /api/users, PATCH|DELETE /api/users/me, GET /api/users/pseudo
│       ├── auth/logout/           # POST /api/auth/logout
│       ├── url-title/             # GET /api/url-title
│       └── health/                # GET /api/health
├── components/
│   ├── ui/                        # Atomic components (Button, Input, Select…)
│   ├── layout/                    # Layout wrappers (FormLayout, PageLayout)
│   ├── form/                      # Form dispatcher + all sub-forms (see Form System section)
│   │   └── sub-form/              # Complex sub-forms (ExperienceSubForm, HobbySubForm)
│   ├── content/                   # Page-level content components
│   │   ├── HomeContent.tsx
│   │   ├── SignupContent.tsx       # SignupWizard
│   │   ├── SettingsContent.tsx
│   │   ├── SettingsAccountContent.tsx
│   │   └── SettingsPersonalDataContent.tsx
│   ├── custom/
│   │   ├── signup/                # Signup-specific custom components
│   │   ├── experience/            # Experience list/form components
│   │   └── settings/              # Settings-specific custom components
│   └── overlay/                   # Overlays (EditInfoOverlay, LoadingOverlay…)
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
├── types/                         # Shared TypeScript types (user.ts, experience.ts)
├── proxy.ts                       # Middleware (i18n + session refresh)
└── actions/ hooks/ services/ utils/   # Reserved for future use
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
