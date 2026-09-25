---
fix_kinds: [patch, regenerate, remove, ask, stop, none]
cycle_cap: 3
regenerations_per_slot: 2
char_ceiling: 4500
checks:
  # by: script | model. severity: fail | warn. fix: see fix_kinds.
  - { id: voice/banned-phrase,        by: script, severity: fail, fix: patch }
  - { id: voice/soft-banned,          by: script, severity: warn, fix: patch }
  - { id: voice/exclamation,          by: script, severity: fail, fix: patch }
  - { id: voice/first-person-plural,  by: script, severity: fail, fix: patch }
  - { id: voice/self-descriptive,     by: script, severity: fail, fix: patch }
  - { id: voice/rhetorical-question,  by: model,  severity: fail, fix: patch }
  - { id: voice/apology,              by: model,  severity: fail, fix: patch }
  - { id: voice/semicolon-chain,      by: script, severity: warn, fix: patch }
  - { id: voice/contrast-negation,    by: model,  severity: warn, fix: patch }
  - { id: format/markdown,            by: script, severity: fail, fix: patch }
  - { id: format/emoji,               by: script, severity: fail, fix: patch }
  - { id: format/all-caps,            by: script, severity: fail, fix: patch }
  - { id: format/indentation,         by: script, severity: fail, fix: patch }
  - { id: format/contact,             by: script, severity: fail, fix: patch }
  - { id: format/url-count,           by: script, severity: fail, fix: regenerate }
  - { id: format/url-list,            by: script, severity: warn, fix: none }
  - { id: format/char-ceiling,        by: script, severity: fail, fix: regenerate }
  - { id: slot/parse,                 by: script, severity: fail, fix: stop }
  - { id: slot/missing,               by: script, severity: fail, fix: regenerate }
  - { id: slot/extra,                 by: script, severity: fail, fix: remove }
  - { id: slot/header-missing,        by: script, severity: fail, fix: patch }
  - { id: slot/header-second-person,  by: script, severity: fail, fix: patch }
  - { id: slot/family-mismatch,       by: script, severity: fail, fix: stop }
  - { id: slot/job-asks-unjustified,  by: model,  severity: warn, fix: none }
  - { id: length/hook,                by: script, severity: fail, fix: regenerate }
  - { id: length/prose-cap,           by: script, severity: fail, fix: regenerate }
  - { id: length/total-ceiling,       by: script, severity: fail, fix: regenerate }
  - { id: length/list-lines,          by: script, severity: fail, fix: regenerate }
  - { id: length/relevant-work-count, by: script, severity: fail, fix: regenerate }
  - { id: length/sentence-cap,        by: model,  severity: warn, fix: patch }
  - { id: terms/hour-range,           by: script, severity: fail, fix: patch }
  - { id: terms/bounded-window,       by: script, severity: fail, fix: patch }
  - { id: fact/untraceable,           by: model,  severity: fail, fix: ask }
  - { id: fact/arithmetic,            by: model,  severity: warn, fix: none }
  - { id: terms/forbidden-promise,    by: model,  severity: fail, fix: regenerate }
  - { id: closing/call,               by: script, severity: fail, fix: patch }
  - { id: job/demand-unanswered,      by: model,  severity: fail, fix: regenerate }
  - { id: job/mandatory-keyword,      by: model,  severity: fail, fix: patch }
  - { id: job/gaps-required,          by: model,  severity: fail, fix: regenerate }
  - { id: flag/mitigation-missing,    by: model,  severity: fail, fix: regenerate }
---

# Verify catalogue

`verify` is the last State. It reviews the Letter in `letter.md` the way a code review reviews a diff, then applies the Fixes itself: `letter.md` after `verify` is the corrected Letter, never a report. A Check is one named rule. A Finding is one violation of a Check in one Slot, `fail` or `warn`. A Fix is the change `verify` applies for a Finding.

Portable across Profiles. Personal inputs (banned extras, allowed extras, word cap, terms) come from the Profile at run time.

## Inputs

- `letter.md` of the current Candidate: body is the Letter, frontmatter `slug`, `family`, `date`.
- `job.md`: posting body (client facts, Job demands), `verdict.flags`, `verdict.alert_level`, `verdict.family`.
- Profile: `profile.md` (`terms`, `word_cap`), `skills.md` (Skill rows: names for the acronym list, `shipped` rows for `gaps-required`), `jobs/<slug>.md` bodies (traceability source), `voice.md` (`banned_extra`, `allowed_extra`).
- Catalogues: voice rules, Slot catalogue, the Family template named by `family`, Flag catalogue.

Nothing is stored. The report is session output; a Letter is final only after `verify` passes, so a stored pass carries no information.

## Finding Slots in plain text

The Letter carries no markers. `verify` segments it deterministically from the fixed Slot order and the mandatory headers:

1. Line 1 is the greeting. Not a Slot, not checked beyond presence.
2. Block 2 is `hook`.
3. Every following block whose first line ends with `:` is a headered Slot. Header text from the Slot catalogue maps to its id; any other colon-terminated single line maps to `answers`, one `answers` paragraph per header. A block without a header continues the Slot before it (`relevant_work` holds one paragraph per Past Job); prose after the plan block, with or without a blank line before it, is `follow_on`. A list block without a header is the plan Slot with its header missing.
4. The last three blocks are `terms`, `closing`, `sign_off`. `terms` may open with a header that is not a catalogue header: the availability question of a question-structured Letter (Slot catalogue, `Ask headers`). A header is a single line ending with a colon (at most twelve words) or a line ending with `?` (the client's question verbatim, any length). Other question headers segment as `answers` paragraphs, so a question-structured Letter leans on `total_word_ceiling` more than on the prose cap.

Blocks are separated by one blank line. A Letter this procedure cannot segment (too few blocks, a header where none is allowed, a block without a header straight after the hook, the same header twice) raises `slot/parse` and stops for the human. Hand-edited Letters go through the same procedure.

`scripts/verify.mjs <candidate>` runs the segmentation and every script Check, and prints the Findings, the Slot map with file line numbers, the counts, and the brief for the model pass (Mitigations to look for with their target Slot, `when: job asks` Slots present, Profile terms). Exit 1 while any script Check fails. Its fixtures in `scripts/verify.test.mjs` seed one Finding per Check group.

## Checks

Script Checks read text and counts; model Checks read meaning. The script runs first; the model pass runs only when the script reports no `fail`, so cheap Findings never reach the model.

### voice

- `banned-phrase`: any phrase from the shared `banned` list plus Profile `banned_extra`, minus Profile `allowed_extra`. Case-insensitive.
- `soft-banned`: any word from `soft_banned`. Warn; the sentence is rewritten anyway.
- `exclamation`: any `!`.
- `first-person-plural`: `we`, `our`, `us` as a whole word outside a quoted client phrase.
- `self-descriptive`: `senior`, `lead`, `expert`, `experienced`, `seasoned`, `veteran` applied to the writer.
- `rhetorical-question`: a question the Letter answers itself or leaves for effect. A client's question used verbatim as a header is not one. Model.
- `apology`: `sorry`, `unfortunately`, `I must admit`, and any sentence that apologises for a gap. Model.
- `semicolon-chain`: a line with two or more semicolons. Warn; the sentence is split.
- `contrast-negation`: a sentence that defines the work by what it is not (`X, not Y`, `never Y`, `rather than Y`, `nothing changes`). Warn; the sentence is rewritten to state what is done. Model.

### format

- `markdown`: `**`, `*`, `_` used as emphasis, `#` at line start, `[text](url)`, `>` at line start, backticks.
- `emoji`: any emoji or pictographic character.
- `all-caps`: a word of three or more capitals that is not a known acronym: one the Skill ledger names, the Past Job bodies, or the Job body use, or a common web and business abbreviation (URL, API, MVP, HIPAA).
- `indentation`: a line starting with a space or tab.
- `contact`: email, phone number, `@handle`, messenger or social handle, booking-page domain, any URL to a page the Profile marks as carrying a contact form.
- `url-count`: any URL that is not `https://`. The number of links is not capped.
- `url-list`: the Letter carries at least one URL. Warn, lists them, reported only.
- `char-ceiling`: more than 4,500 characters including the greeting. Upwork's cover letter limit is about 5,000 and unconfirmed.

### slot

- `parse`: segmentation failed. Stop.
- `missing`: a Slot the Family template always renders (`hook`, `terms`, `closing`, `sign_off`, the plan Slot) is absent, or `gaps` is absent while `job/gaps-required` holds.
- `extra`: a block maps to a Slot the Family template does not list, or to a `when: job asks` Slot with no ask. Fix: remove the block.
- `header-missing`: a Slot the catalogue lists under `headers` opens without its header line. The script sees this for the plan Slot (a list without a header); a prose Slot without its header reads as a continuation of the Slot before it, so the model reports it when a paragraph's content belongs to another Slot.
- `header-second-person`: a colon-terminated header with `you`, `your`, `you've`, `you're` as a whole word. Only a real client question ending in `?` keeps the client's pronouns; a request fragment is reworded in first person (`Products I've built:`). Fix: patch the header.
- `family-mismatch`: `letter.md` `family` differs from `job.md` `verdict.family`, or `slug` and `date` do not match the Candidate folder. Stop.
- `job-asks-unjustified`: a `when: job asks` Slot is present and the model cannot point at the ask in the Job. Warn.

### length

- `hook`: `hook` block over its Slot `cap.chars`.
- `prose-cap`: prose words over Profile `word_cap` (voice catalogue `prose_word_cap_default` when unset). Prose excludes header lines, list lines, and the `answers` Slot.
- `total-ceiling`: all words over the voice catalogue `total_word_ceiling`.
- `list-lines`: `deliverables` or `milestones` over its Slot `cap.lines`, or a second list anywhere.
- `relevant-work-count`: more paragraphs in `relevant_work` than its Slot `cap.paragraphs`.
- `sentence-cap`: a prose Slot over its Slot `cap.sentences`, or a paragraph over `cap.each.sentences`. Warn; model counts.

### fact

- `untraceable`: a fact with no source. The model lists every fact in the Letter (product name, URL, role, period, stack item, number, client quote) with its Slot and source: a `jobs/<slug>.md` line, a `profile.md` field, the `job.md` body for client facts, or `derived` for hours and prices computed from the Profile rate. Fix: ask the human once whether the fact is true. True: append it as a confirmed bullet to the matching `jobs/<slug>.md`, then regenerate the Slot. False or unknown: regenerate the Slot without it.
- `arithmetic`: a milestone price that is not hours times the Profile rate, or a total that does not sum. Warn.

### terms

- `hour-range`: a clock time or an am/pm range in `terms`. Overlap is the client's part of the day, never hours they must convert.
- `bounded-window`: `through the next`, `for the next`, `until` in `terms`. Availability is `available now` or `from <date>`.
- `forbidden-promise`: a promise the Profile `terms` forbid: a fixed price when `billing: hourly-caps`; hourly caps when `billing: milestones`; subcontracting mentioned when `subcontracting: none`; weekly hours outside `weekly_hours`; a start date before `availability_from`, or a bounded availability window; a rate below `rate_floor`; IP wording against `ip_stance`; a delivery date the plan does not derive. Generic promise words (`guarantee`, `unlimited revisions`, `24/7`) live in the shared `banned` list so the script catches them.

### closing

- `call`: `closing` offers a call, a walkthrough, a screen share, or a demo. Questions are answered in writing; Past Job codebases are never shown.

### job

- `demand-unanswered`: an explicit request in the Job (examples, stack, approach, availability, subcontracting, a specific question) that no Slot answers. Fix: regenerate `answers`, or the Slot the demand maps to. A demand that needs a fact the Profile lacks goes to the human as in `fact/untraceable`.
- `mandatory-keyword`: Flag `mandatory-keyword` is triggered and the keyword appears anywhere in the Letter. Fix: patch the sentence to drop it. The Letter never complies with a keyword demand.
- `gaps-required`: a required item of the Job (a must, a required skill, the codebase; never a preferred or nice-to-have item) is outside the ledger's `shipped` Skills and `gaps` is absent or does not name it; or `gaps` names an item that is not required. Fix: regenerate `gaps` (which renders nothing when no required gap remains).

### flag

- `mitigation-missing`: a triggered risk Flag in `verdict.flags` with `slot` other than `none` whose Mitigation the target Slot does not state. `fail` at Alert Level 3 or 4, `warn` at 1 or 2. `plan` resolves to the Family's plan Slot.

## Fixes

- `patch`: rewrite the offending sentence or line; the rest of the Slot stays byte-identical. Used for word-level Findings. Unbounded, re-checked every cycle.
- `regenerate`: refill the whole Slot from the template and the Profile; every other block stays byte-identical. Used when the Slot's content is wrong, not its words. Two regenerations per Slot per run; the third Finding on the same Slot stops.
- `remove`: delete the block and its blank line.
- `ask`: one question to the human, then one regeneration.
- `stop`: no Fix; the run ends with the report and the question.
- `none`: reported only.

Length Fixes shrink in this order: the prose Slot most over its own catalogue cap first, then `relevant_work` by its weakest Past Job, never below the Family default count and never below the number the Job asks for, then `answers` paragraphs merged. `hook`, `terms`, `closing`, `sign_off` are never shrunk.

## Cycles

One cycle: script Checks, apply their Fixes, model pass, apply its Fixes, script again. Regenerated text can introduce new Findings, so cycles repeat until one script-and-model pass reports zero `fail`. Cap three cycles; then the run stops with the open Findings listed.

## Report

Printed once, at the end, in this order:

1. Verdict line: `pass` or `stopped`, and the cycle count.
2. Fixes applied, one line each: Check id, Slot, before and after in one clause each.
3. Warnings left open.
4. Fact table: fact, Slot, source.
5. The Letter verbatim in a code block, ready to paste.

On `stopped`: the same, plus the one question for the human. The human edits `letter.md` or answers, then reruns `verify`.

## End of the Route

`pass` plus the human pasting the Letter into Upwork ends the Route. No further State. While the Profile `voice.md` body is empty, `verify` asks once after a `pass` whether this Letter is approved as calibration; on yes it copies the Letter text into that body.
