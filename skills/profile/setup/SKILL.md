---
name: setup
description: Build or refresh the freelancer Profile under data/profile/ from pasted sources (Upwork profile, CV, past Letters).
disable-model-invocation: true
argument-hint: "[paste sources here or in the next message]"
---
!`node ${CLAUDE_PLUGIN_ROOT}/scripts/profile.mjs status`

The Profile is the freelancer's data and the only thing the other States know about them. It is four kinds of file under `data/profile/`, all Markdown with YAML frontmatter, all hand-editable and the source of truth after this wizard writes them:

- `profile.md`: facts only, empty body. Identity, refused stacks, niche, interests, avoid list, Family precedence, word cap, terms.
- `skills.md`: the Skill ledger (catalogue `${CLAUDE_PLUGIN_ROOT}/catalogue/skills.md`, ADR 0003), `target_after` and one row per Skill: `name`, `category`, `level`, `evidence`, `keywords`, `seen`. `triage` appends to `seen` and adds Gap rows on every run; this wizard writes the rows the sources prove.
- `jobs/<slug>.md`: one per Past Job. Frontmatter for machine fields, body a list of fact bullets the Letter may cite. Every claim in a Letter must trace to one of these bullets, so a bullet is a concrete fact (feature shipped, role, period, product URL), never prose.
- `voice.md`: every Letter-facing personal string: `language`, `greeting`, `sign_off`, `banned_extra`, `allowed_extra`, `cite_role_period`. Body empty until the first approved Letter is copied in as calibration.

Schemas with inline defaults: `${CLAUDE_PLUGIN_ROOT}/scripts/schemas/profile.schema.json`, `skills.schema.json`, `past-job.schema.json`, `voice.schema.json`. `node ${CLAUDE_PLUGIN_ROOT}/scripts/profile.mjs skeleton <profile|skills|voice|past-job>` prints a YAML skeleton with the defaults filled and every required field and enum marked; draft from it, never from memory. Every write under `data/` is validated by a hook against its schema; on mismatch the hook returns the error list: fix the frontmatter and write again.

Pasted sources are input only. Extract, then drop them; nothing under `data/` keeps a CV or an Upwork profile text. The skills work from the Profile alone.

## Steps

1. **Permissions.** The plugin cannot ship permission rules, so the project's `.claude/settings.json` holds them. Read that file (missing counts as empty) and list which of these `permissions.allow` rules it lacks:
   ```
   Bash(node */scripts/guard.mjs *)
   Bash(node */scripts/verdict.mjs *)
   Bash(node */scripts/profile.mjs *)
   Bash(node */scripts/verify.mjs *)
   Bash(node */scripts/skills.mjs *)
   Edit(data/**)
   ```
   None missing: say so in one line. Otherwise show the missing ones and ask once whether to add them; on yes, merge them into `permissions.allow`, keeping every other key and rule. On no, go on: the Route still works, with a permission prompt on each script call and write. Done when the human has answered or nothing is missing.
2. **Sources.** The argument or the next message carries pasted text or file paths: Upwork profile, CV, past Letters, anything with facts about the freelancer. Read every file path given. Done when at least one source is in hand.
3. **Draft.** Print the four skeletons and fill them from the sources:
   - `profile.md`: `identity.constraints` holds facts a Job can fail on (location, nationality, work permit, working arrangement). `terms` numbers come from the sources or stay at the placeholder until step 4.
   - `skills.md`: one row per technology or domain practice the sources name (never years of experience or a spoken language). `level` by the ledger catalogue's tests: `shipped` when a Past Job's bullets show it in production, `used` when a Past Job used it without shipping it, `learning` when studied with no Past Job; never `gap`, which only `triage` creates. `evidence` lists the Past Job slugs that show it, required at `used` and `shipped`. `keywords` and `seen` start empty; `target_after` stays at the default 3 unless the human names another.
   - one `jobs/<slug>.md` per Past Job found, slug from the product name, two to three words, lowercase, hyphenated. `naming` is `public` when the product is named and linkable, `first-name-only` or `nda` otherwise. Body bullets: product URL, role, period, and every concrete thing done there. Numbers only when the source states them.
   - `voice.md`: `sign_off` is the first name, `greeting` and `language` from the defaults unless a past Letter shows otherwise.
   Done when every field the sources answer is filled and every required field they leave empty is listed.
4. **Gaps.** Ask the human for the required fields still empty, in one message, grouped per file, with the choices for enum fields and the catalogue default named where one exists (`family_precedence`, `word_cap`, `billing`). Ask nothing the sources already answered and nothing optional. Done when every required field has a value.
5. **Summary and write.** Show one block per file: the frontmatter as it will be written and, for a Past Job, its bullets. Then write each file with the Write tool, `profile.md`, `skills.md`, and `voice.md` first, then `jobs/<slug>.md` one by one. Create the folders when missing. A rejected write names the errors: fix them and write again. Done when `node ${CLAUDE_PLUGIN_ROOT}/scripts/profile.mjs status` reports both gates as `pass`.
6. **Report.** Print the status output and the next command: `/autotriage:route` with a Job pasted.

## Re-run

The guard line above prints which files exist and validate. When any file exists, this is a refresh, per file:

- An invalid file: show its errors, propose the corrected frontmatter, write on confirmation.
- A valid file with new sources: draft the changed fields only, show old and new values side by side, write on confirmation. A field the human edited by hand is never overwritten without that confirmation.
- A Past Job in the sources with no `jobs/<slug>.md` yet: draft it as in step 2.
- A file the sources say nothing about: leave it. `skills.md` rows with a non-empty `seen` are never dropped: they are the ledger's history.

Argument received: $ARGUMENTS
