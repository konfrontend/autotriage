---
status: accepted
---

# Skills live in their own ledger; Targets are derived, never stored

Skills move out of `profile.md` into `data/profile/skills.md`, a YAML list in frontmatter, one row per Skill. Every `triage` run appends the Candidate to the `seen` list of each Skill the Job requires, and adds a row at Level `gap` for a required item the Profile has no row for, only after the human confirms those changes explicitly, as a question separate from go or no-go. A Gap becomes a Target when it has been Seen at least `target_after` times; this is derived when printed, and Targets sort first in the print.

We chose a Markdown file with frontmatter over SQLite because every other artifact in the repo is frontmatter validated by a schema on write, the table holds tens of rows, and a print is a script rendering one list. We chose derived Targets over a stored `status` field because a stored status drifts from `level` and `seen`, and the closing action is already a Profile edit (bump the Level, add evidence). The Level ladder is renamed from `production`, `working`, `learning` to `shipped`, `used`, `learning`, `gap`: the old names did not say what test separates them, and `gap` had no place on the ladder.

## Considered options

- Keep skills in `profile.md`, add a separate gaps table: two lists of the same kind of thing, a Gap that gets learned has to move between them; rejected.
- SQLite or IndexedDB: binary file, a driver, and no query the print cannot do over a list; rejected.
- Stored `status` column: one more field the human maintains by hand, disagrees with `level` and `seen` over time; rejected.

## Amended 2026-09-25 (public release)

The ledger no longer tracks what the freelancer does about a Gap. The `issue` field, the in-development status, and the `pull` and `set-issue` commands that filed a Gap into an issue tracker are gone: they tied the plugin to one tracker and one workspace. The ledger is a signal; acting on it is the freelancer's business, outside the plugin.
