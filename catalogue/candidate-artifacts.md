# Candidate artifacts

A Candidate is one folder under `data/candidates/`, gitignored. Two files: `job.md` is the input, `letter.md` is the output. Together they form the record that later work on Letter generation learns from. Nothing else is stored in the folder; everything a session prints (evidence, reasons, checklists) is thrown away. One write lands outside the folder: `triage` also records the Candidate in the Skill ledger `data/profile/skills.md` (the `seen` list of each Skill the Job required, plus a Gap row per unknown required item; catalogue `skills.md`).

## Folder

`data/candidates/YYYY-MM-DD-<slug>/`. Date is the day `intake` ran. Slug is two to four words from the posting title, chosen by `intake`. The full title stays in `title`.

## `job.md`

Written by `intake`; `triage` adds the `verdict` block and, after the checkpoint, records the Candidate in the Skill ledger; the human sets `decision`. Body is the posting verbatim, nothing parsed out, nothing dropped.

```yaml
slug: clinic-booking-mvp
title: "Full-Stack Developer - Clinic Booking MVP"
date: 2026-09-19                  # intake date
timezone: America/New_York        # client, IANA; required
budget: { type: hourly, min: 25, max: 100 }   # type hourly | fixed | none; fixed uses max only; none has no min or max
extras:                           # optional, free-form; anything else the posting or the freelancer states
  country: US
  hours_per_week: "<30"
  duration: "1-3 months"
verdict:                          # absent until triage runs
  family: audit                   # Family id; human may edit before proposal
  family_runner_up: build         # Family id or null
  flags: [non-technical-founder, regulated-domain, moderate-gauntlet, free-discovery, paid-first-milestone]
  skill_fit: 3
  interest_fit: 3
  value: 5
  alert_level: 3                  # script
  hard_stops: []                  # script; hard stop ids
  verdict: go                     # script; go | no-go | ask
  decision: null                  # human; go | no-go
```

Rules:

- `slug`, `title`, `date`, `timezone`, `budget` identify the record and feed the hard stops. Everything else optional goes under `extras`; no new top-level field without a consumer.
- `verdict` holds ids and numbers only. How they combine is in the Flag catalogue (`alert_level_steps`, `hard_stops`, `scores`, `verdict_mapping`). Evidence quotes, score reasons, matched cues, mitigations are session output.
- `alert_level`, `hard_stops`, `verdict` are computed by a script from `flags`, the scores, and the Profile floors. The `proposal` guard recomputes them and rejects the file on mismatch.
- `verdict` is the script's recommendation; `decision` is the human's call. `proposal` runs only on `decision: go`. `no-go` ends the Route. `ask` is a verdict, not a decision: the human still writes `go` or `no-go`.

## `letter.md`

Written by `proposal`, checked by `verify`. Body is the Letter as pasted into Upwork: plain text, no Markdown.

```yaml
slug: clinic-booking-mvp
family: audit                     # template used
date: 2026-09-19
outcome: null                     # ignored | rejected | interviewed | hired; set by hand when known
```

`verify` result is not stored: a Letter is final only after `verify` passes, so a stored pass carries no information.
