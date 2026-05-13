---
name: transcript-to-tickets
description: >
  Analyzes a written transcript (meeting, call, brainstorming session) to extract tasks
  and automatically create the corresponding tickets in the Notion "🎫 Ticket Management"
  database (data source ID: b538e8cb-0089-458c-adbb-d6906283ca23). For each ticket identified
  as technical (bug, feature, improvement), also creates an associated Pull Request on GitHub
  on the repo https://github.com/titouancv/maium. Trigger this skill whenever the user
  mentions a transcript, meeting notes, a call summary, or asks to extract/create tickets
  or tasks from any text — even if they just say "here's the transcript" or "create tickets
  from this".
---

# Skill: Transcript → Notion Tickets + GitHub PRs

## Overview

This skill reads a written text (meeting transcript, notes, summary) and:

1. **Extracts** all tasks, actions, bugs, and improvements identified
2. **Creates tickets** in the Notion `🎫 Ticket Management` database
3. **Creates Pull Requests** on GitHub for technical tickets on `titouancv/maium`

---

## Step 1 — Analyze the transcript

Read the provided text carefully and identify every task, action, bug, and improvement mentioned. For each task, determine:

| Field             | How to infer                                    | Available options                                                                  |
| ----------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Title**         | Short, clear task title                         | —                                                                                  |
| **Type**          | Nature of the task                              | `🐛 Bug`, `✨ Fonctionnalité`, `❓ Support`, `📝 Documentation`, `🔧 Amélioration` |
| **Priority**      | Perceived urgency                               | `P1` (critical) → `P5` (low)                                                       |
| **Difficulty**    | Estimated complexity                            | `D1` (very hard) → `D5` (very easy)                                                |
| **Time**          | Estimated effort                                | `T1` (long) → `T5` (quick)                                                         |
| **Tags**          | Technical domain                                | `frontend`, `backend`, `design`, `infra`, `urgent` (multi)                         |
| **Status**        | Always `🆕 Nouveau` for new tickets             | —                                                                                  |
| **Is technical?** | Bug, Feature or Improvement = YES → create a PR | —                                                                                  |

**"Technical ticket" rule**: If Type is `🐛 Bug`, `✨ Fonctionnalité` or `🔧 Amélioration`, the ticket is technical and requires a GitHub PR.

Before creating anything, **show the user a summary** and ask for confirmation:

```
I identified N tasks:
1. [Title] — Type: X, Priority: Y, Technical: Yes/No
2. ...
Shall I proceed with creation?
```

---

## Step 2 — Build descriptions (Notion page content + PR body)

Every ticket and PR must follow this structured format. Generate it from the transcript context.

### Description format

```markdown
## 📌 What

[Explain the context of the task: what is the situation, what is currently happening or missing,
what feature or area is involved. Be specific and factual.]

## 🎯 Why

[Explain the reason behind the task: what problem does it solve, what value does it bring,
why it matters now. Link to user impact or business value when possible.]

## ✅ To-do list

- [ ] First concrete action to take
- [ ] Second step (implementation, testing, etc.)
- [ ] Write or update tests if applicable
- [ ] Update documentation if needed
- [ ] Code review ready
```

### Inference rules for the description

> **Language rule**: ALL description content (What, Why, To-do list) MUST be written in English, regardless of the language of the transcript.

- **What**: extract the subject/feature/bug described in the transcript. Quote relevant context.
- **Why**: infer from the discussion — pain points, goals, user complaints, deadlines mentioned.
- **To-do list**: break the work down into actionable, specific steps. Minimum 3 items. For bugs, include "Reproduce the bug", "Identify root cause", "Implement fix". For features, include design, implementation, and testing steps.
  - **For technical tickets** (Bug, Feature, Improvement): before writing the to-do list, **read the relevant source files in the codebase** to understand the current implementation. Use `find`, `grep`, or `Read` to locate the affected code. The to-do list must reference actual file paths, function names, or component names found in the code — not generic placeholders.

---

## Step 3 — Create Notion tickets

**Database**: `🎫 Ticket Management`
**Data source ID**: `b538e8cb-0089-458c-adbb-d6906283ca23`

Use the `Notion:notion-create-pages` tool. Pass the structured description (Step 2) as the `content` field and fill all properties:

```json
{
  "parent": { "data_source_id": "b538e8cb-0089-458c-adbb-d6906283ca23" },
  "pages": [
    {
      "properties": {
        "Title": "Short task title",
        "Type": "✨ Fonctionnalité",
        "Priority": "P2",
        "Difficulty": "D3",
        "Time": "T3",
        "Status": "🆕 Nouveau",
        "Tags": "[\"backend\"]",
        "date:Date de création:start": "2026-05-13",
        "date:Date de création:is_datetime": 0
      },
      "content": "## 📌 What\n...\n\n## 🎯 Why\n...\n\n## ✅ To-do list\n- [ ] ...\n- [ ] ..."
    }
  ]
}
```

> **Note**: `Tags` is a `multi_select` — pass as a stringified JSON array.
> The `🔗 GitHub Link` property will be filled after PR creation (Step 4).
> Do NOT use the `Description` property for the structured content — use `content` (page body) instead.

---

## Step 4 — Create GitHub Pull Requests (technical tickets only)

For each technical ticket, create a PR on `titouancv/maium` using the **GitHub CLI (`gh`)**.

### Pre-requisite: create and push the branch

```bash
# 1. Create the branch from main
git checkout main && git pull
git checkout -b <branch-name>

# 2. Push the branch to remote
git push -u origin <branch-name>
```

### Branch naming convention

- Bug: `fix/short-title-in-kebab-case`
- Feature: `feature/short-title-in-kebab-case`
- Improvement: `improve/short-title-in-kebab-case`

### Create the PR with `gh`

```bash
gh pr create \
  --title "<prefix>: <title>" \
  --body "$(cat <<'EOF'
## 📌 What
{context from transcript}

## 🎯 Why
{reason/motivation from transcript}

## ✅ To-do list
- [ ] Step 1
- [ ] Step 2
- [ ] ...

---
🔗 Notion Ticket: {notionUrl}
EOF
)" \
  --base main \
  --head <branch-name>
```

PR title prefix convention:
| Type | Prefix |
|------|--------|
| `🐛 Bug` | `fix:` |
| `✨ Fonctionnalité` | `feat:` |
| `🔧 Amélioration` | `improve:` |

> **Note**: `gh` must be authenticated (`gh auth status`). If not, run `gh auth login` before creating PRs. No token needs to be asked from the user.

---

## Step 5 — Update Notion tickets with the GitHub link

After each PR is created, update the corresponding Notion ticket with the PR URL:

```json
{
  "page_id": "NOTION_PAGE_ID",
  "command": "update_properties",
  "properties": {
    "🔗 GitHub Link": "https://github.com/titouancv/maium/pull/123"
  }
}
```

---

## Step 6 — Final report

Show the user a clear summary:

```
✅ Done!

📋 Notion tickets created: N
  • [Title 1] → https://notion.so/...
  • [Title 2] → https://notion.so/...

🔀 GitHub Pull Requests created: M
  • feat: [Title 1] → https://github.com/titouancv/maium/pull/X
  • fix: [Title 2] → https://github.com/titouancv/maium/pull/Y
```

---

## Error handling

| Situation                     | Behavior                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| GitHub token missing          | Ask before any PR creation                                  |
| `main` branch not found       | Try `master`, otherwise ask the user                        |
| PR already exists (409/422)   | Report and continue with remaining tickets                  |
| Invalid Notion property value | Log the error, create the ticket with valid properties only |
| Ambiguous transcript          | Ask clarifying questions before creating tickets            |
| Branch creation fails         | Report the error, skip PR for that ticket, continue         |

---

## References

- Full Notion schema: see `references/notion-schema.md`
- GitHub target repo: `https://github.com/titouancv/maium`
- Notion data source ID: `b538e8cb-0089-458c-adbb-d6906283ca23`
