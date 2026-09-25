---
name: intake
description: Record a pasted Job as a Candidate folder under data/candidates/ (job.md). First State of the Route.
argument-hint: "<posting body, client timezone, budget, extras>"
---
!`node ${CLAUDE_PLUGIN_ROOT}/scripts/guard.mjs intake`

A Candidate is `data/candidates/YYYY-MM-DD-<slug>/` with `job.md` as the input record; contract in `${CLAUDE_PLUGIN_ROOT}/catalogue/candidate-artifacts.md`, schema in `${CLAUDE_PLUGIN_ROOT}/scripts/schemas/job.schema.json`. The frontmatter holds the machine fields; the body is the paste verbatim, every line kept: the parameter line, the screening questions, the blank lines. Nothing is parsed out of it and nothing is dropped, so a later State reads the same Job the human read.

## Reading the paste

The paste often opens with a **parameter line**: the freelancer's own comma list of country, budget, and optionally hours and duration, ahead of the posting (`UK, $600`, `USA, $25-100, <30h/week, 1-3 months`). It is the freelancer's input, not the client's text: read the fields from it and keep it in the body.

- **Budget** (required). A single figure is `fixed` with `max`; a range is `hourly` with `min` and `max`, with or without `/h`; a posting that labels itself hourly or fixed-price wins over the shape of the number. Numbers are USD as Upwork shows them. A posting that names no money and no parameter line gives one is `none` only when the human says so.
- **Timezone** (required, IANA). A stated city or state names it. A country with one zone names it (`UK` is `Europe/London`, `Spain` is `Europe/Madrid`). A country with several zones takes its business hub (`USA` `America/New_York`, `Canada` `America/Toronto`, `Australia` `Australia/Sydney`, `Brazil` `America/Sao_Paulo`, `Mexico` `America/Mexico_City`) and the report marks it as inferred. Nothing to infer from: ask.
- **Title** (required). The posting's own title line when the paste has one. Otherwise a title of at most ten words from the summary. A title never carries country or budget.
- **Extras** (optional, free-form). Whatever else the parameter line or the human states: `country`, `hours_per_week`, `duration`, and any further fact given explicitly. Keys lowercase with underscores, values as given. Nothing inferred from the posting body lands here; `triage` reads the body itself.

## Steps

1. **Fields.** Read the argument (and the next message when the argument is empty) into the fields above. A required field with no value in the paste and no rule to infer it: ask for it, all missing fields in one message, and wait. Done when title, timezone, and budget each have a value.
2. **Slug and folder.** Slug is two to four words of the title, lowercase, hyphenated, matching `^[a-z0-9]+(-[a-z0-9]+)*$`; folder is `<Today>-<slug>` with the date the guard printed. A folder already in the guard's Known Candidates takes one more distinguishing word in the slug; an existing Candidate is never overwritten. Done when the folder name is new.
3. **Write `job.md`** with the Write tool at `data/candidates/<folder>/job.md`: frontmatter `slug`, `title` (quoted), `date`, `timezone`, `budget`, and `extras` only when non-empty; no `verdict` block; then a blank line and the paste verbatim. The write hook validates the frontmatter against the schema and blocks with the error list on mismatch: fix the frontmatter and write again. Done when the write went through.
4. **Report.** One line naming the file written and the next command, `/autotriage:triage <folder>`; an inferred timezone is named on it (`timezone America/New_York, inferred`), so the human can correct it in `job.md`. The last line of the answer is the folder name alone, so `route` can forward it.

Argument received: $ARGUMENTS
