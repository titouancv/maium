# CLAUDE.md — Project Conventions (Next.js / TypeScript)

This file is automatically read by AI coding tools (Claude Code, Cursor, Copilot…).
**Always** follow these conventions without exception, even if not explicitly requested.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript strict
- **UI**: React
- **Styles**: Tailwind CSS
- **i18n**: next-intl
- **State management**: Zustand (if needed)
- **Fetching**: TanStack Query or native Server Components
- **Forms**: React Hook Form + Zod
- **Tests**: Vitest + Testing Library

---

## Folder Structure

```
src/
├── app/
│   ├── [locale]/               # next-intl locale wrapper
│   │   ├── layout.tsx
│   │   └── (routes)/
│   │       └── page.tsx
├── components/
│   ├── ui/                     # Atomic components (Button, Input, Modal…)
│   └── [feature]/              # Feature-scoped components
├── constants/                  # ⚠️ ALL constants, paths, config values go here
│   ├── routes.ts               # App route paths
│   ├── api.ts                  # API endpoint paths
│   ├── config.ts               # App-wide config (pagination size, timeouts…)
│   └── index.ts                # Re-exports everything
├── hooks/                      # Custom hooks (use*.ts)
├── i18n/
│   ├── routing.ts              # next-intl routing config
│   └── request.ts              # next-intl server config
├── lib/                        # Utilities, configs, helpers
├── messages/
│   ├── en.json                 # English translations
│   └── fr.json                 # French translations
├── services/                   # API calls / business logic
├── stores/                     # Zustand stores
├── types/                      # Global types and interfaces
└── utils/                      # Pure utility functions
```

---

## Constants & Paths

> **Rule: zero magic strings or hardcoded values outside of `src/constants/`.**

Every constant, route path, API endpoint, config value, or repeated literal **must** live in `src/constants/`.
Import from `@/constants` everywhere else.

```ts
// src/constants/routes.ts
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  USER_PROFILE: (id: string) => `/users/${id}`,
} as const;

// src/constants/api.ts
export const API = {
  USERS: "/api/users",
  USER_BY_ID: (id: string) => `/api/users/${id}`,
  AUTH_LOGIN: "/api/auth/login",
} as const;

// src/constants/config.ts
export const CONFIG = {
  PAGINATION_SIZE: 10,
  MAX_FILE_SIZE_MB: 5,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,
} as const;

// src/constants/index.ts
export * from "./routes";
export * from "./api";
export * from "./config";
```

```ts
// ✅ Correct — import from constants
import { ROUTES, API, CONFIG } from "@/constants";

// ❌ Never — hardcoded values inline
fetch("/api/users");
router.push("/dashboard");
const size = 10;
```

---

## Internationalization (next-intl)

> **Rule: every visible word on screen must use a translation key. No hardcoded strings in JSX.**

### Setup

```ts
// src/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
});
```

```ts
// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### Translation files

Both `en.json` and `fr.json` **must always be kept in sync**. When adding a new key, add it to **both files** in the same PR/commit.

```json
// messages/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading…",
    "error": "Something went wrong."
  },
  "auth": {
    "login": {
      "title": "Sign in to your account",
      "emailLabel": "Email address",
      "passwordLabel": "Password",
      "submitButton": "Sign in",
      "noAccount": "Don't have an account?",
      "signUpLink": "Sign up"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {name}!"
  }
}
```

```json
// messages/fr.json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "loading": "Chargement…",
    "error": "Une erreur est survenue."
  },
  "auth": {
    "login": {
      "title": "Connectez-vous à votre compte",
      "emailLabel": "Adresse e-mail",
      "passwordLabel": "Mot de passe",
      "submitButton": "Se connecter",
      "noAccount": "Pas encore de compte ?",
      "signUpLink": "S'inscrire"
    }
  },
  "dashboard": {
    "title": "Tableau de bord",
    "welcome": "Bon retour, {name} !"
  }
}
```

### Usage in components

**Server Components** — use `getTranslations`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  return <h1>{t("title")}</h1>;
}
```

**Client Components** — use `useTranslations`:

```tsx
"use client";
import { useTranslations } from "next-intl";

export const LoginForm = () => {
  const t = useTranslations("auth.login");
  return <button>{t("submitButton")}</button>;
};
```

**Never do this:**

```tsx
// ❌ Hardcoded visible text
<h1>Dashboard</h1>
<button>Save</button>
<p>Something went wrong.</p>
```

---

## Pages & Components

### Rule: pages are templates, components do the work

Page files (`app/[locale]/.../page.tsx`) are **layout templates only**. They:

- Fetch data (if Server Component)
- Pass props to components
- Compose components from `src/components/`

They do **not** contain raw JSX like `<div>`, `<p>`, `<button>`, etc. directly — those live in components.

```tsx
// ✅ Correct — page is a template
// app/[locale]/dashboard/page.tsx
import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { fetchDashboardStats } from "@/services/dashboardService";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const stats = await fetchDashboardStats();

  return (
    <>
      <DashboardHeader title={t("title")} />
      <StatsGrid stats={stats} />
      <RecentActivity />
    </>
  );
}
```

```tsx
// ❌ Wrong — page doing too much
export default function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">{/* ... raw JSX blocks */}</div>
    </div>
  );
}
```

### Creating components

When a page needs a UI element that doesn't exist yet, **create the component** rather than inlining the markup.

- Generic / reusable → `src/components/ui/`
- Feature-specific → `src/components/[feature]/`
- Always export a named `index.ts` from each folder

```tsx
// src/components/ui/PageTitle.tsx
interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export const PageTitle = ({ title, subtitle }: PageTitleProps) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);
```

---

## TypeScript Conventions

- Always explicitly type props, function return values, and ambiguous variables.
- Prefer `interface` for component props, `type` for unions/intersections.
- Never use `any`. Use `unknown` and narrow it.
- `strict: true` must be enabled in `tsconfig.json`.

```ts
// ✅ Correct
interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

// ❌ Forbidden
const handler = (data: any) => { ... }
```

Prefer `const` objects over TypeScript `enum`:

```ts
// ✅ Correct
export const Role = {
  ADMIN: "admin",
  USER: "user",
} as const;
export type Role = (typeof Role)[keyof typeof Role];
```

---

## React & Component Conventions

- One component = one file.
- Always use arrow functions, never `React.FC`.
- Destructure props in the signature.
- Default to **Server Components**. Add `"use client"` only when using hooks, events, or browser APIs.
- Never fetch data in a Client Component if a Server Component can do it.

```tsx
// ✅ Correct
export const Button = ({ label, onClick, disabled = false }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled}>
    {label}
  </button>
);
```

---

## Naming Conventions

| Element                | Convention                 | Example                |
| ---------------------- | -------------------------- | ---------------------- |
| Components             | PascalCase                 | `UserCard.tsx`         |
| Custom hooks           | camelCase prefixed `use`   | `useAuth.ts`           |
| Utilities / helpers    | camelCase                  | `formatDate.ts`        |
| Zustand stores         | camelCase suffixed `Store` | `useUserStore.ts`      |
| Types / Interfaces     | PascalCase                 | `UserProfile`          |
| Global constants       | SCREAMING_SNAKE_CASE       | `MAX_RETRY_COUNT`      |
| Folders                | kebab-case                 | `user-profile/`        |
| Variables / functions  | camelCase                  | `getUserById`          |
| Translation namespaces | camelCase                  | `auth.login`, `common` |

---

## Validation with Zod

Always validate external data (forms, API responses, params) with Zod.

```ts
import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

---

## Error Handling

- Always handle errors in Server Actions and API routes.
- Never leave an empty `catch` block.

```ts
// ✅ Correct
try {
  const data = await fetchUser(id);
  return { success: true, data };
} catch (error) {
  console.error("[fetchUser]", error);
  return { success: false, error: "Unable to retrieve user." };
}
```

---

## Styles (Tailwind CSS)

- No inline CSS except as a justified exception.
- Use `cn()` (clsx + tailwind-merge) for conditional classes.
- Extract complex variants with `cva()` (class-variance-authority).

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />;
```

---

## Commits (Conventional Commits)

Format: `type(scope): short description`

| Type       | When to use                      |
| ---------- | -------------------------------- |
| `feat`     | New feature                      |
| `fix`      | Bug fix                          |
| `refactor` | Refactor without behavior change |
| `chore`    | Maintenance, deps, config        |
| `docs`     | Documentation                    |
| `test`     | Adding or updating tests         |
| `i18n`     | Translation updates              |

```
feat(auth): add Google OAuth login
fix(user-card): correct avatar overflow on mobile
i18n(dashboard): add missing French translations
```

---

## General Rules (always apply)

1. **Never** commit leftover `console.log` statements.
2. **Always** create an `index.ts` in folders to centralize exports.
3. **Always** prefer immutability (`const`, spread, `.map()` over `push()`).
4. **Never** mutate state directly in Zustand or React.
5. **Always** use a stable, unique `key` in lists (never the array index if the list can change).
6. **Always** use absolute imports with the `@/` alias.
7. **Always** add new translation keys to **both** `en.json` and `fr.json`.
8. **Never** hardcode a visible string in JSX — every user-facing text goes through `t()`.
9. **Never** hardcode a path, URL, or config value outside of `src/constants/`.
10. **Always** create or reuse a component from `src/components/` in page templates.

```ts
// ✅ Correct
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

// ❌ Forbidden
import { Button } from "../../../components/ui/Button";
router.push("/dashboard"); // hardcoded path
```

---

## Checklist before generating any code

Before writing a page or component, verify:

- [ ] All visible text uses `t()` from next-intl
- [ ] New translation keys added to both `en.json` and `fr.json`
- [ ] Page delegates UI to components in `src/components/`
- [ ] New components created if they don't exist yet
- [ ] All constants / paths declared in `src/constants/`
- [ ] No `any`, no empty `catch`, no hardcoded strings
- [ ] Absolute imports via `@/`
