---
name: execute-pr-task
description: >
  Takes a GitHub Pull Request URL, reads the task description, checks out the PR branch,
  implements the task, commits the changes, and sets the associated Notion ticket status
  to "Work in progress". Always reads CLAUDE.md before implementing.
  For frontend tasks, automatically applies vercel-react-best-practices guidelines.
  Trigger this skill whenever the user provides a PR URL and asks to implement, execute,
  or work on it — even if they just paste the URL or say "do this PR".
---

# Skill: Execute PR Task

## Overview

This skill takes a GitHub Pull Request URL and:

1. **Fetches** the PR details (title, description, branch, to-do list)
2. **Updates** the associated Notion ticket status to `Work in progress`
3. **Checks out** the PR branch locally
4. **Reads** `CLAUDE.md` for project-specific guidelines
5. **Identifies** if the task is frontend → applies `vercel-react-best-practices`
6. **Implements** the task following the PR's to-do list
7. **Commits & pushes** the changes to the PR branch

---

## Step 1 — Parse the PR URL and fetch details

Extract the PR number from the URL and fetch full details:

```bash
# Extract PR number from URL (e.g. https://github.com/titouancv/maium/pull/42 → 42)
gh pr view <PR_NUMBER> --repo titouancv/maium \
  --json title,body,headRefName,url,baseRefName
```

From the output, extract:

- `title` → task title
- `body` → full description (contains What, Why, To-do list, and Notion link)
- `headRefName` → branch name to checkout
- `url` → PR URL (for reference)

Parse the **Notion ticket URL** from the PR body — look for the line:

```
🔗 Notion Ticket: https://notion.so/...
```

Extract the Notion page ID from the URL (the last segment, stripping the title prefix).
Example: `https://notion.so/Fix-dashboard-bug-c08407dc0e85...` → page ID is the UUID at the end.

---

## Step 2 — Update Notion ticket to "🔄 En cours"

Use `notion-update-page` to set the ticket status to Work in Progress:

```json
{
  "page_id": "<NOTION_PAGE_ID>",
  "command": "update_properties",
  "properties": {
    "Status": "🔄 En cours"
  }
}
```

> If no Notion URL is found in the PR body, skip this step and note it in the final report.

---

## Step 3 — Checkout the PR branch and sync with main

```bash
# Checkout the PR branch (fetches from remote automatically)
gh pr checkout <PR_NUMBER> --repo titouancv/maium
```

Verify you are on the correct branch:

```bash
git branch --show-current
```

Then pull and merge `main` into the PR branch to stay up to date before starting any work:

```bash
git fetch origin main
git merge origin/main
```

If merge conflicts arise, resolve them before proceeding. If the conflicts are unexpected or complex, report them to the user and ask how to proceed.

---

## Step 4 — Read CLAUDE.md

Always read `CLAUDE.md` before implementing anything:

```bash
# Read CLAUDE.md at project root if it exists
cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"
```

Apply any project-specific conventions, constraints, or guidelines found there.

---

## Step 5 — Determine task domain and apply relevant guidelines

Analyze the PR title, body, and tags to determine the domain:

**Frontend indicators** (any of these → apply vercel-react-best-practices):

- Tags contain `frontend`
- PR title or body mentions: React, Next.js, component, page, UI, CSS, Tailwind, layout, rendering, hydration, bundle, SSR, client, server component
- Branch name starts with `feature/`, `fix/`, or `improve/` and references UI/frontend concepts

**If frontend**: invoke the `vercel-react-best-practices` skill before writing any code to load the relevant optimization guidelines into context.

**If backend**: proceed without extra guidelines (respect CLAUDE.md conventions).

---

## Step 6 — Implement the task

Read the **to-do list** from the PR body (the `## ✅ To-do list` section) and implement each unchecked item.

### Implementation rules

1. **Read before writing**: Before editing any file, read the current implementation using the Read tool. Locate relevant files with `find` and `grep`.
2. **Follow CLAUDE.md**: Apply all conventions from Step 4.
3. **Follow vercel-react-best-practices**: If frontend (Step 5), apply the loaded guidelines.
4. **Minimal scope**: Implement exactly what the to-do list specifies. No extra features, no speculative refactoring, no unnecessary abstractions.
5. **No unnecessary comments**: Only add comments when the WHAT is non-obvious.
6. **Security**: Never introduce command injection, XSS, SQL injection, or other OWASP vulnerabilities.

### For bugs (`fix/` branch)

1. Reproduce / understand the bug from the description
2. Locate the root cause in the code
3. Implement the minimal fix
4. Verify fix doesn't break adjacent behavior

### For features (`feature/` branch)

1. Identify the files to create or modify
2. Implement the feature following the to-do list steps
3. Ensure integration with existing code

### For improvements (`improve/` branch)

1. Understand the current implementation
2. Apply the improvement as described
3. Preserve existing behavior unless explicitly changing it

---

## Step 7 — Commit and push

After implementing all to-do list items, commit the work:

```bash
# Stage changed files (be specific, avoid git add -A)
git add <files>

# Commit with a descriptive message
git commit -m "$(cat <<'EOF'
<type>: <short description matching PR title>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

# Push to the PR branch
git push origin <headRefName>
```

Commit message type prefix:
| Branch prefix | Commit prefix |
|---------------|---------------|
| `fix/` | `fix:` |
| `feature/` | `feat:` |
| `improve/` | `improve:` |

> If pre-commit hooks fail: fix the underlying issue, re-stage, and create a **new** commit. Never use `--no-verify`.

---

## Step 8 — Final report

Show a concise summary:

```
✅ Done!

🔀 PR: <PR title> → <PR URL>
🌿 Branch: <branch name>
📋 Notion ticket: updated to 🔄 En cours → <notion URL>
📝 Commits pushed: N file(s) changed

What was implemented:
- [✓] Step 1 from to-do list
- [✓] Step 2 from to-do list
- ...
```

---

## Error handling

| Situation                                           | Behavior                                                |
| --------------------------------------------------- | ------------------------------------------------------- |
| PR not found                                        | Report error, stop                                      |
| Branch already checked out with uncommitted changes | Warn user, ask before proceeding                        |
| CLAUDE.md not found                                 | Note it, continue without it                            |
| Notion URL missing from PR body                     | Skip Notion update, note in report                      |
| Notion update fails                                 | Log error, continue with implementation                 |
| Commit hook fails                                   | Fix the issue, re-stage, new commit                     |
| Push rejected (non-fast-forward)                    | Run `git pull --rebase`, then push again                |
| Frontend/backend ambiguous                          | Err on the side of applying vercel-react-best-practices |

---

## References

- GitHub repo: `https://github.com/titouancv/maium`
- Notion data source ID: `b538e8cb-0089-458c-adbb-d6906283ca23`
- Notion ticket statuses: see `transcript-to-tickets/references/notion-schema.md`
- Frontend guidelines: invoke `vercel-react-best-practices` skill
