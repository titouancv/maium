---
name: review-frontend
description: Perform a comprehensive codebase audit targeting dead code removal, full i18n coverage, logic deduplication, and type/interface centralization. Use this skill whenever the user mentions "code review", "codebase audit", "clean up the codebase", "dead code", "unused imports", "hardcoded strings", "i18n coverage", "internationalization", "duplicated logic", "reusable types", "centralize types", or asks to "review the project structure". Also trigger when the user says things like "check my code quality", "refactor the codebase", "find issues in the project", or "improve code architecture". This skill should be used proactively any time the user wants a structured, multi-goal review of their codebase — even if they only mention one of the goals (e.g. just "remove dead code"), run the full review.
---

# Codebase Review Skill

A structured skill for performing deep, multi-goal codebase audits. Covers dead code removal, i18n completeness, logic deduplication, type centralization, constants/paths hygiene, Tailwind semantic tokens, and project architecture rules.

---

## Project Context

This is a Next.js 16 monorepo (`frontend/src/`). All checks below are calibrated to its conventions:

- **i18n**: `next-intl` with locales `en` and `fr`; both message files must stay in sync
- **State**: Zustand
- **Auth**: Supabase — always `getUser()`, never `getSession()`
- **Styles**: Tailwind CSS v4 with semantic color tokens
- **Forms**: React Hook Form + Zod
- **Constants**: every path, route, and config value lives in `src/constants/`, imported via `@/constants`
- **Navigation**: always from `@/i18n/navigation`, never from `next/navigation`
- **TypeScript**: strict — `interface` for props, `type` for unions/intersections, `const` objects over enums, no `any`

---

## Review Goals

Run all seven checks below, even if the user only mentions one. Present results as a unified report.

---

## 1. Dead Code Removal

**What to look for:**

- Unused files (no imports pointing to them anywhere in the project)
- Unused i18n translation keys (defined in `en.json`/`fr.json` but never called via `t()`)
- Unused functions and variables (declared but never called/referenced)
- Unused imports (`import X from Y` where `X` is never used)
- Commented-out code blocks left in production files
- Exported symbols that are never imported anywhere

**How to detect:**

- Search for each export and check if it's imported elsewhere
- Use file search to trace import chains
- Look for `// TODO: remove`, `// DEPRECATED`, or large commented blocks
- Check `package.json` dependencies that aren't imported anywhere

**Output format:**

```
### Dead Code Found
- `src/utils/oldHelper.ts` — never imported, safe to delete
- `components/Button.tsx` — `handleLegacyClick` defined but never called
- `lib/api.ts` — `import { deprecated } from './old'` — unused import
```

**Suggested fix pattern:**

```ts
// BEFORE
import { usedFn, unusedFn } from "./utils";

// AFTER
import { usedFn } from "./utils";
```

---

## 2. Internationalization (i18n) Coverage

**Stack**: `next-intl`. Server Components use `getTranslations("namespace")` from `next-intl/server`; Client Components use `useTranslations("namespace")` from `next-intl`. Both `en.json` and `fr.json` must be updated together.

**What to look for:**

- Hardcoded user-facing strings (labels, buttons, error messages, placeholders, tooltips, headings)
- Keys present in `en.json` but missing in `fr.json` (or vice versa)
- Zod schema error messages that are raw strings instead of translation keys
- Toast/notification messages hardcoded in English
- Strings in `aria-label`, `title`, `alt` attributes
- Server Components using `useTranslations()` (must use `getTranslations()` instead)
- Client Components using `getTranslations()` (must use `useTranslations()` instead)

**How to detect:**

- Search for JSX text content: `>Some text<`
- Search for string props: `label="..."`, `placeholder="..."`, `title="..."`
- Search for Zod schemas: `.min(1, "...")`, `.required("...")`, `.invalid_type_error("...")`
- Search for toast calls: `toast.error("...")`, `toast.success("...")`
- Diff keys between `en.json` and `fr.json`

**Output format:**

```
### i18n Issues Found
- `components/LoginForm.tsx:34` — hardcoded label: "Email address"
- `lib/validations.ts:12` — Zod error not translated: `.min(1, "Field is required")`
- `components/Toast.tsx:8` — hardcoded: toast.error("Something went wrong")
- `fr.json` — missing key: "auth.login.title" (present in en.json)
- `components/Header.tsx` — Server Component using useTranslations() instead of getTranslations()
```

**Suggested fix pattern:**

```ts
// BEFORE (Zod)
const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

// AFTER
const schema = z.object({
  email: z
    .string()
    .min(1, t("validation.email.required"))
    .email(t("validation.email.invalid")),
});
```

```tsx
// BEFORE (JSX)
<Button>Submit</Button>

// AFTER
<Button>{t("common.submit")}</Button>
```

---

## 3. Duplicated Logic

**What to look for:**

- The same data transformation written in multiple files
- Multiple fetch/API call wrappers doing the same thing
- Copy-pasted validation logic across components or routes
- Identical or near-identical utility functions in different files
- Repeated error handling patterns that aren't centralized
- Multiple components implementing the same UI pattern from scratch

**How to detect:**

- Look for functions with similar names across multiple files
- Search for repeated code blocks (sort, filter, map patterns)
- Check for similar `try/catch` blocks in service files
- Look for repeated date formatting, number formatting, string truncation

**Output format:**

```
### Duplicated Logic Found
- `formatDate()` defined in `utils/date.ts`, `helpers/format.ts`, and `components/Card.tsx`
- API error handling repeated in `services/user.ts`, `services/product.ts`
- `truncateText()` duplicated across 4 components
```

**Suggested fix pattern:**

```ts
// BEFORE — repeated in multiple files
const formatted = new Date(date).toLocaleDateString('en-US', { ... });

// AFTER — centralized in src/utils/date.ts
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { ... });
}
```

---

## 4. Type & Interface Centralization

**Project conventions:**
- `interface` for component props
- `type` for unions and intersections
- `const` objects over enums
- No `any` — use `unknown` and narrow it

**What to look for:**

- Types/interfaces defined locally inside component files that are used in more than one place
- Duplicate type definitions with different names for the same shape
- Enums that should be `const` objects: `enum Role { Admin, User }` → `const ROLE = { ADMIN: "admin", USER: "user" } as const`
- `any` usage that should be `unknown` with narrowing
- `interface` used for a union/intersection (should be `type`)
- `type` used for component props (should be `interface`)
- Types exported from non-obvious places (buried inside service files)
- Missing shared types for API responses, form values, or domain entities

**How to detect:**

- Search for `interface ` and `type ` declarations across all `.ts`/`.tsx` files
- Search for `enum ` to flag them
- Search for `: any` and `as any`
- Check if types in component files are used more than once

**Output format:**

```
### Type Centralization Issues
- `User` interface defined in both `services/auth.ts` and `components/Profile.tsx` — conflicting shapes
- `ApiResponse<T>` defined 3 times inline — should live in `types/api.ts`
- `enum Status` in `services/order.ts` — should be a `const` object
- `components/Form.tsx:12` — `: any` on form submit handler
```

**Suggested fix pattern:**

```ts
// BEFORE — enum
enum Role { Admin, User }

// AFTER — const object
const ROLE = { ADMIN: "admin", USER: "user" } as const;
type Role = typeof ROLE[keyof typeof ROLE];
```

```ts
// BEFORE — any
function handleSubmit(data: any) { ... }

// AFTER — unknown with narrowing
function handleSubmit(data: unknown) {
  if (!isFormData(data)) return;
  ...
}
```

---

## 5. Constants & Path Hardcoding

**Rule**: every route path, API endpoint, and config value must live in `src/constants/` and be imported via `@/constants`. Never inline them.

**What to look for:**

- Hardcoded route strings: `href="/signup"`, `router.push("/home")`, `redirect("/login")`
- Hardcoded API paths: `fetch("/api/users")`, `axios.get("/api/products")`
- Repeated string literals that match known constants (routes, endpoints, config keys)
- Values that should be in `src/constants/` but are defined inline or in component files

**How to detect:**

- Search for `href="/"`, `push("/"`, `redirect("/"` — any string starting with `/`
- Search for `fetch("`, `axios.get("`, `axios.post("` with literal strings
- Cross-reference against `src/constants/routes.ts` and `src/constants/api.ts`

**Output format:**

```
### Constants/Path Issues Found
- `components/Navbar.tsx:18` — hardcoded href="/signup", should use ROUTES.SIGNUP
- `services/auth.ts:34` — fetch("/api/users") should use API.USERS
- `app/[locale]/page.tsx:9` — redirect("/login") should use ROUTES.LOGIN
```

**Suggested fix pattern:**

```ts
// BEFORE
router.push("/signup");
fetch("/api/users");

// AFTER
import { ROUTES, API } from "@/constants";
router.push(ROUTES.SIGNUP);
fetch(API.USERS);
```

---

## 6. Tailwind Semantic Tokens

**Rule**: use project semantic color tokens (`bg-surface-50`, `text-txt`, `text-txt-muted`, `border-brd-200`, etc.) — never raw Tailwind colors like `bg-white`, `text-black`, `border-gray-200`. Use `cn()` from `@/lib/utils` for conditional classes; `cva()` for complex variants.

**What to look for:**

- Raw Tailwind color classes: `bg-white`, `bg-black`, `text-gray-*`, `border-gray-*`, `text-zinc-*`, etc.
- Conditional class strings built with string concatenation or ternaries instead of `cn()`
- Complex variant logic that should use `cva()` but is handled with multiple `cn()` calls

**How to detect:**

- Search for `bg-white`, `bg-black`, `text-black`, `text-white`, `text-gray-`, `border-gray-`, `bg-gray-`, `text-zinc-`, `bg-zinc-`
- Search for className with ternaries: `` className={`${condition ? 'x' : 'y'}`} ``
- Look for `className={condition ? "a b c" : "d e f"}` without `cn()`

**Output format:**

```
### Tailwind Semantic Token Issues
- `components/Card.tsx:12` — bg-white should use semantic token (e.g. bg-surface-50)
- `components/Input.tsx:8` — text-gray-400 should use text-txt-muted
- `components/Button.tsx:22` — conditional classes built with string concat, use cn()
```

**Suggested fix pattern:**

```tsx
// BEFORE
<div className={`bg-white ${isActive ? "text-black" : "text-gray-400"}`}>

// AFTER
<div className={cn("bg-surface-50", isActive ? "text-txt" : "text-txt-muted")}>
```

---

## 7. Architecture Rules

**What to look for:**

### Pages as layout templates
Page files (`app/[locale]/(routes)/*/page.tsx`) must only fetch data and compose components. Flag any raw `<p>`, `<button>`, `<input>`, `<h1>`–`<h6>`, etc. directly in a page file.

### Barrel files (`index.ts`)
Every folder should have an `index.ts` that re-exports its contents. Flag folders missing an `index.ts`.

### `"use client"` discipline
`"use client"` is only valid when the component uses hooks, browser events, or browser APIs. Flag Server Components that have `"use client"` for no reason, and Client Components doing server-only things (direct DB calls, using `cookies()`, etc.).

### Navigation imports
`Link`, `useRouter`, and `redirect` must be imported from `@/i18n/navigation`, not from `next/navigation`. Flag any import from `next/navigation` for these three.

### Supabase auth safety
`supabase.auth.getSession()` must never be used for authorization checks — it reads from the cookie without server validation. Only `supabase.auth.getUser()` is safe. Flag all `getSession()` calls.

### `console.log` in committed code
Flag any `console.log(` in non-test files.

**Output format:**

```
### Architecture Rule Violations
- `app/[locale]/(routes)/home/page.tsx:14` — raw <button> in page, move to components/
- `components/features/` — missing index.ts barrel file
- `components/StaticCard.tsx` — "use client" with no hooks or browser APIs
- `components/Breadcrumb.tsx:3` — imports useRouter from next/navigation, use @/i18n/navigation
- `lib/auth.ts:22` — getSession() used for auth check, replace with getUser()
- `components/Form.tsx:45` — console.log left in committed code
```

---

## Report Structure

Always present findings in this order:

```
## Codebase Review Report

### 1. Dead Code
[list of issues + fixes]

### 2. i18n Coverage
[list of issues + fixes]

### 3. Duplicated Logic
[list of issues + fixes]

### 4. Type Centralization
[list of issues + fixes]

### 5. Constants & Paths
[list of issues + fixes]

### 6. Tailwind Semantic Tokens
[list of issues + fixes]

### 7. Architecture Rules
[list of issues + fixes]

### 8. Structural Recommendations
[architectural suggestions, tooling suggestions]
```

For section 8, consider:

- Suggesting ESLint rules (`no-unused-vars`, `@typescript-eslint/no-unused-imports`, `no-console`)
- Recommending `i18n-ally` VS Code extension for catching missing keys
- Suggesting `knip` or `ts-prune` for automated dead code detection
- Proposing barrel files (`index.ts`) for cleaner imports

---

## Workflow

1. **Read the current structure** — scan `frontend/src/` to understand what exists before reviewing.
2. **Run all seven checks** in parallel, noting every file and line with issues.
3. **Generate the report** using the structure above — be specific (file names, line numbers when known).
4. **Offer to fix** — for each section with issues, offer to generate the corrected code.
