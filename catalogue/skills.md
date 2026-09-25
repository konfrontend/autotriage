# Skill ledger

The Profile's Skills live in `data/profile/skills.md`, one row per Skill in the frontmatter (schema `scripts/schemas/skills.schema.json`, ADR 0003). `setup` writes it, `triage` records into it when the human confirms the changes, `/autotriage:skills` prints it. This file is the single place the row contract, the Level tests, the Target rule, and the matching rules live; the skills only sequence them.

Portable across Profiles. The rows are the freelancer's; the rules are not.

## File

```yaml
target_after: 3                   # Seen count at which a Gap becomes a Target
skills:
  - { name: React, category: frontend, level: shipped, evidence: [acme-dashboard], keywords: [react.js], seen: [2026-01-15-marketplace-mvp] }
  - { name: Stripe Connect, category: backend, level: gap, evidence: [], keywords: [stripe], seen: [2026-01-15-marketplace-mvp] }
```

## Row

- `name`: the Skill as the Letter would name it. Unique, case-insensitive.
- `category`: `frontend`, `backend`, `database`, `cloud-infra`, `testing`, `graphics-3d`, `ai-agents`, `mobile`, `other`.
- `level`: `gap`, `learning`, `used`, `shipped`. Tests below.
- `evidence`: Past Job slugs (`data/profile/jobs/<slug>.md`) that show the Skill. Required and non-empty at `used` and `shipped`; empty at `learning` and `gap`.
- `keywords`: lowercase strings a Job may use for the Skill instead of its name (`sql`, `db`, `postgresql`). Free; added by hand when a match was missed.
- `seen`: Candidate folder names whose Job required the Skill, unique. Appended by `triage` only after the human confirms the changes, never edited by hand except to correct a wrong match.

At least one row is `shipped`, or the Profile has nothing a Letter can cite.

## Level tests

- `shipped`: a Past Job in `evidence` shows the Skill in production, in the Past Job's own bullets.
- `used`: used in a Past Job in `evidence`, not shipped there (a prototype, a tool of the work, a side path).
- `learning`: studied, no Past Job uses it.
- `gap`: a Job required it and the freelancer has not used it. A Gap exists only because a Job required it; nobody adds one by hand.

Bumping a Level is a Profile edit: change `level` and add the Past Job slug to `evidence` in the same edit.

## Target

A Target is a Gap whose `seen` count is at or above `target_after`. Targets print first. They are a signal only: what the freelancer does about a Gap is outside the plugin.

## Matching rules

`triage` lists the Job's required items against the ledger:

- Only required items count: a must, a required skill, the existing codebase. A preferred, nice-to-have, or `a plus` item is never listed, so it never appends to `seen` and never spawns a row.
- Only technologies and domain practices are items (Stripe Connect, RBAC, escrow, Supabase). Years of experience, spoken languages, seniority words, and working arrangements are not Skills.
- One Job item may match several rows: `React/Next.js` appends to both React and Next.js.
- A row matches by `name` or by any `keyword`, whole words, case-insensitive: `SQL database` matches a row with keyword `sql`. `node scripts/skills.mjs match <item>` applies this rule; the model confirms the list and adds a row the rule missed or drops one it caught by accident.
- An item with no matching row spawns a new row at `gap` with the Candidate as its first `seen`, `category` chosen by the model, `evidence` and `keywords` empty.
- Recording is idempotent: a Candidate already in `seen` is not appended twice, and a row that already exists is not spawned again.

## Print

`/autotriage:skills print` renders three groups, Targets, then Gaps, then the rest, each sorted by `seen` count descending; columns `name`, `level`, `category`, `seen` (count). `print gaps` shows the first two groups only.
