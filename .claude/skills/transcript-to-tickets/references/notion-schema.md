# Notion Schema — 🎫 Ticket Management

## Identifiers

- **Database URL**: `https://www.notion.so/c08407dc0e85451899ee3275df17342c`
- **Data Source ID**: `b538e8cb-0089-458c-adbb-d6906283ca23`
- **Data Source URL**: `collection://b538e8cb-0089-458c-adbb-d6906283ca23`
- **Default template**: `35fce618-b7a4-80c7-90ff-ed515a10065f` (New task)

## Properties

### Title (title)

Main ticket title. Always required.

### Type (select)

| Value               | Color  | Technical → PR? |
| ------------------- | ------ | --------------- |
| `🐛 Bug`            | Red    | ✅ Yes          |
| `✨ Fonctionnalité` | Purple | ✅ Yes          |
| `❓ Support`        | Blue   | ❌ No           |
| `📝 Documentation`  | Gray   | ❌ No           |
| `🔧 Amélioration`   | Orange | ✅ Yes          |

### Status (select)

| Value           | Meaning                    |
| --------------- | -------------------------- |
| `🆕 Nouveau`    | Newly created, not started |
| `🔄 En cours`   | In development             |
| `✅ Résolu`     | Done                       |
| `❌ Fermé`      | Abandoned                  |
| `⏸️ En attente` | Blocked                    |

Always use `🆕 Nouveau` for tickets created from a transcript.

### Priority (select)

| Value | Level           |
| ----- | --------------- |
| `P1`  | Critical (red)  |
| `P2`  | High (orange)   |
| `P3`  | Medium (yellow) |
| `P4`  | Low (green)     |
| `P5`  | Very low (blue) |

Inference hints from transcript:

- "urgent", "critical", "blocking", "ASAP" → P1 or P2
- "important", "priority" → P2 or P3
- Neutral mention → P3
- "when we have time", "nice to have" → P4 or P5

### Difficulty (select)

| Value | Level            |
| ----- | ---------------- |
| `D1`  | Very hard (red)  |
| `D2`  | Hard (orange)    |
| `D3`  | Medium (yellow)  |
| `D4`  | Easy (green)     |
| `D5`  | Very easy (blue) |

### Time (select)

| Value | Estimated duration  |
| ----- | ------------------- |
| `T1`  | Very long (>1 week) |
| `T2`  | Long (several days) |
| `T3`  | Medium (1–2 days)   |
| `T4`  | Short (a few hours) |
| `T5`  | Very short (<1h)    |

### Tags (multi_select)

Available values: `frontend`, `backend`, `design`, `infra`, `urgent`

Pass as a stringified JSON array, e.g. `"[\"backend\", \"urgent\"]"`

### Date de création (date)

Use today's date. Format:

```json
{
  "date:Date de création:start": "2026-05-13",
  "date:Date de création:is_datetime": 0
}
```

### 🔗 GitHub Link (url)

URL of the associated GitHub Pull Request. Filled after PR creation.

### Assigned To (person)

JSON array of Notion user IDs. Leave empty if not mentioned in the transcript.

### ROI (formula)

Auto-calculated by Notion. Do not set.

### ID Ticket (auto_increment_id)

Auto-managed. Do not set.

## Full creation example

```json
{
  "parent": { "data_source_id": "b538e8cb-0089-458c-adbb-d6906283ca23" },
  "pages": [
    {
      "properties": {
        "Title": "Fix dashboard display bug on mobile",
        "Type": "🐛 Bug",
        "Priority": "P2",
        "Difficulty": "D3",
        "Time": "T3",
        "Status": "🆕 Nouveau",
        "Tags": "[\"frontend\", \"urgent\"]",
        "date:Date de création:start": "2026-05-13",
        "date:Date de création:is_datetime": 0
      },
      "content": "## 📌 What\nThe dashboard does not render correctly on mobile screens. Charts overflow and the navigation bar overlaps with the content area.\n\n## 🎯 Why\nSeveral users reported this issue during the last sprint review. It degrades the mobile experience significantly, which accounts for 40% of our traffic.\n\n## ✅ To-do list\n- [ ] Reproduce the bug on a mobile viewport (375px)\n- [ ] Identify the CSS root cause\n- [ ] Implement responsive fix\n- [ ] Test on iOS Safari and Android Chrome\n- [ ] Update snapshot tests\n- [ ] Submit for code review"
    }
  ]
}
```
