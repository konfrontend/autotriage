---
scale: 1-5
flags:
  # kind: risk (default), green, or stop. green = level 0, lowers the Alert Level. stop = Profile-fit failure: no level, no Alert Level effect, forces the hard stop of the same id.
  # slot: where the mitigation is stated in the Letter: hook | plan | billing | answers | none. `plan` is the Family's plan Slot (see the Slot catalogue).
  - id: budget-scope-mismatch
    level: 1
    cues: ["enterprise-size feature list with a small fixed price", "$5-$100 placeholder budget", "ambitious scope, tiny budget"]
    mitigation: "propose own milestones and price; client takes it or leaves it. On a client-priced test: own milestone plan only, no prices"
    slot: plan
    value: "fewer competing bids from those who filter by posted budget"
  - id: vague-posting
    level: 1
    cues: ["one-paragraph brief", "enhance our web application using React and Node", "no scope, no deliverables"]
    mitigation: "first exchange defines scope"
    slot: plan
    value: "depends on what surfaces"
  - id: non-technical-founder
    level: 1
    cues: ["non-technical founder", "I am not a developer", "need someone to own the tech"]
    mitigation: "bill for the architect role you will fill"
    slot: billing
    value: "normal for the segment"
  - id: decorative-formatting
    level: 1
    cues: ["all-caps headers", "emoji section headers"]
    mitigation: "none; style only"
    slot: none
    value: "counts only combined with hostile-tone"

  - id: partnership-anchor
    level: 2
    cues: ["partner, not freelancer", "more paid work after MVP", "founding engineer", "long-term partnership"]
    mitigation: "price the current scope on its own; future work is worth zero"
    slot: billing
    value: "fine when current scope is priced alone"
  - id: client-code-self-assessment
    level: 2
    cues: ["architecture is sound", "hard thinking is done", "codebase is clean", "built in Replit/Lovable/Cursor, just needs finishing"]
    mitigation: "paid assessment as milestone one"
    slot: plan
    value: "rescue work is abundant and prices well when audit-first"
  - id: external-deadline
    level: 2
    cues: ["pilot launches in <month>", "launch in the coming months", "must be live by <date>"]
    mitigation: "scope freeze plus milestone plan"
    slot: plan
    value: "deadline pressure speeds hiring decisions"
  - id: regulated-domain
    level: 2
    cues: ["FERPA", "HIPAA", "PHI", "student data", "health data", "legal content", "GDPR sensitive data"]
    mitigation: "name compliance overhead in the Letter; price it"
    slot: plan
    value: "compliance rarely priced by competitors"
  - id: moderate-gauntlet
    level: 2
    cues: ["3-5 targeted technical questions in the application"]
    mitigation: "answer well; this filters competition"
    slot: answers
    value: "high conversion when answered well"

  - id: mandatory-keyword
    level: 3
    cues: ["begin your proposal with <WORD>", "start with the word", "include <CODE> so I know you read this"]
    mitigation: "none; never comply: the Letter leaves the keyword out"
    slot: none
    value: "co-occurs with low baseline trust"
  - id: burned-before
    level: 3
    cues: ["previous developer went unresponsive", "previous developer failed", "estimates grew tenfold", "we were let down"]
    mitigation: "paid bounded audit first, written scope, no fixed price before seeing code"
    slot: plan
    value: "client knows they need competence; can pay for it"
  - id: free-discovery
    level: 3
    cues: ["include an architecture proposal", "propose the DB design in your application", "itemized estimate required in the proposal", "describe your pipeline design"]
    mitigation: "teaser only; sell the full answer as paid phase one"
    slot: plan
    value: "inverted to green when the client pays for the discovery (see paid-first-milestone)"
  - id: subjective-acceptance
    level: 3
    cues: ["needs to look great", "pixel-perfect", "your creative call", "until we are happy"]
    mitigation: "paid first milestone (one screen, one theme) before committing to the rest"
    slot: plan
    value: "3D/WebGL and creative work carry a scarcity premium"
  - id: control-heavy-environment
    level: 3
    cues: ["mandatory sandboxed workstation", "remote-desktop only", "monitored access", "time tracker with screenshots required"]
    mitigation: "price the friction"
    slot: billing
    value: "legitimate for client-data compliance"
  - id: heavy-vetting
    level: 3
    cues: ["references will be called", "CV + LinkedIn + GitHub + portfolio mandatory", "we will independently verify"]
    mitigation: "judge vetting weight against contract size"
    slot: none
    value: "acceptable for large engagements only"

  - id: fixed-price-unbounded
    level: 4
    cues: ["production-ready as the only acceptance criterion", "scalable, high-quality", "feature list over 8 modules with a fixed budget"]
    mitigation: "convert to hourly or to own milestone structure, accepted in writing"
    slot: billing
    value: "loss-maker unless repriced"
  - id: urgency-48h
    level: 4
    cues: ["URGENT", "24H", "event tomorrow", "need it today"]
    mitigation: "premium rate, only for trivial self-contained work"
    slot: billing
    value: "no discovery, public failure mode"
  - id: excessive-gauntlet
    level: 4
    cues: ["10+ application questions", "video recording required", "take-home task for a small job"]
    mitigation: "engage only if take-home is time-capped and the job is large"
    slot: none
    value: "application cost exceeds expected value"
  - id: hostile-tone
    level: 4
    cues: ["ALL-CAPS plus complaints", "DO NOT APPLY IF", "prohibition lists", "threats of rejection", "no time-wasters"]
    mitigation: "none; client manages through distrust"
    slot: none
    value: "escalation on every invoice"
  - id: unrealistic-mechanics
    level: 4
    cues: ["build it in 1 hour on Zoom while I watch", "should take you 20 minutes"]
    mitigation: "none; the client's model of software is wrong"
    slot: none
    value: "whatever ships disappoints"

  - id: compound-distrust
    level: 5
    cues: ["mandatory keyword + reference verification + independent reviewer + prohibition list + burned-before in one posting"]
    mitigation: "none"
    slot: none
    value: "none"
  - id: fixed-urgent-vague
    level: 5
    cues: ["urgent, fixed budget, just make it work"]
    mitigation: "none"
    slot: none
    value: "none"
  - id: off-platform
    level: 5
    cues: ["contact me outside Upwork", "Telegram/WhatsApp me", "requirements unrelated to skill (gender, nationality, religion)"]
    mitigation: "none; platform-policy and payment-protection risk"
    slot: none
    value: "none"

  - id: paid-first-milestone
    kind: green
    level: 0
    cues: ["paid scoping phase", "paid audit first", "paid architecture assignment", "shortlist then paid assessment"]
  - id: assets-provided
    kind: green
    level: 0
    cues: ["PRD attached", "designs in Figma", "wireframes ready", "spec document provided"]
  - id: team-in-place
    kind: green
    level: 0
    cues: ["our CTO", "existing dev team", "you will work with our backend developer"]

  - id: refused-stack
    kind: stop
    cues: ["a stack item the Job requires (not merely lists as nice-to-have) is in Profile refused_stacks"]
  - id: unmet-constraint
    kind: stop
    cues: ["US-only", "must be based in <country>", "citizens only", "on-site", "hybrid", "relocate", "must be available <hours> in <timezone> with no overlap possible", "any location, identity, or working-arrangement requirement Profile identity.constraints cannot meet"]

alert_level_steps:
  - "start = max level among triggered risk Flags (1 if none); stop Flags carry no level and are ignored here"
  - "+1 if three or more distinct Flags of level 2 or 3 triggered"
  - "+1 if hostile-tone or burned-before triggered together with any other Flag of level >= 2"
  - "-1 if at least one green Flag triggered (once, not per green Flag)"
  - "clamp to 1..5"

hard_stops:
  - id: alert-level-5
    rule: "Alert Level is 5"
  - id: level-5-flag
    rule: "any level 5 risk Flag triggered"
  - id: rate-below-floor
    rule: "Job states an hourly range whose ceiling is below Profile rate_floor"
  - id: refused-stack
    rule: "stop Flag refused-stack triggered (a required stack item is in Profile refused_stacks)"
  - id: unmet-constraint
    rule: "stop Flag unmet-constraint triggered (Job requires a location, identity, or working arrangement that Profile identity.constraints cannot meet)"

scores:
  scale: 1-5
  skill_fit:
    "1": "core stack or domain absent from Profile"
    "2": "half or less of required items covered"
    "3": "most items covered at shipped or used level, one gap in a secondary item"
    "4": "all items covered at shipped level"
    "5": "all items covered, plus Profile niche or past job matches the Job's domain"
  interest_fit:
    "1": "Job matches a Profile avoid list entry"
    "2": "no overlap with Profile interests"
    "3": "neutral"
    "4": "matches one Profile interest"
    "5": "matches a Profile niche"
  value:
    "1": "Family is last in precedence AND contract size under 10 hours at Profile rate"
    "2": "Family late in precedence OR contract size small"
    "3": "mid precedence, moderate size"
    "4": "Family early in precedence OR size large with green Flags"
    "5": "Family first in precedence AND size large AND paid-first-milestone triggered"

verdict_mapping:
  - "any hard stop -> no-go"
  - "skill_fit 1 -> no-go"
  - "skill_fit 2 -> ask"
  - "no Family -> ask"
  - "Alert Level 1-2 -> go"
  - "Alert Level 3 -> go; mitigations must be non-empty"
  - "Alert Level 4 -> ask; go only when skill_fit is 5, mitigations non-empty"
  - "Alert Level 5 -> no-go"

verdict_fields:
  # the `verdict` block of job.md; see catalogue/candidate-artifacts.md
  family: one of the Family ids
  family_runner_up: Family id or null
  flags: list of triggered Flag ids, green and stop Flags included
  skill_fit: 1-5
  interest_fit: 1-5
  value: 1-5
  alert_level: 1-5, computed by script
  hard_stops: list of hard stop ids triggered, may be empty
  verdict: go | no-go | ask, computed by script
  decision: null | go | no-go, human-set at the checkpoint
---

# Flag catalogue

A Flag is one named risk signal in a Job. Green Flags are signals the client understands how engagements work. Stop Flags are Profile-fit failures (`refused-stack`, `unmet-constraint`): the client may be fine, the freelancer cannot take the Job. Portable across Profiles: nothing here is a personal preference. Floors, refused stacks, constraints, and interests live in the Profile; a stop Flag names the rule, the Profile supplies the list it is checked against.

## How `triage` uses this file

1. Read the Job. For every Flag whose cues match, record its id and show the human a verbatim quote from the Job as evidence. Model judgment, guided by cues; postings are unstructured, so no keyword matching. Green and stop Flags detected in the same pass: a stop Flag's evidence is the Job quote plus the Profile entry it collides with (`refused_stacks: php` against `WordPress site`). Only ids are stored; evidence stays in the session.
2. Judge the three soft scores against the rubric in `scores`, one line of reason each in the session. Only the numbers are stored.
3. Detect the Family (see the Family catalogue). Verdict `ask` when no Family fits.
4. A script, not the model, computes `alert_level` (steps in `alert_level_steps`), `hard_stops` (rules in `hard_stops`, floors from Profile), and `verdict` (order in `verdict_mapping`). The `proposal` guard recomputes both and rejects `job.md` when stored values disagree.
5. The human sets `decision` (`go` or `no-go`) at the checkpoint. `verdict` is the script's recommendation and is never hand-edited; `proposal` runs only on `decision: go`.

`interest_fit` never enters the verdict arithmetic. It is a tiebreaker for the human at the checkpoint.

## Levels

Risk Flags carry a Level; green Flags are Level 0; stop Flags carry none. The Alert Level measures the client's posting, so stop Flags stay out of its arithmetic: a Job on a refused stack from a good client reads as `no-go, Alert Level 1`, which is the true picture.

- Level 1: note only, engage freely.
- Level 2: caution, verify in the first exchange.
- Level 3: elevated, engage only with the mitigation stated in the Letter.
- Level 4: high, engage only with exceptional skill fit and non-negotiable mitigations.
- Level 5: do not engage.

## Budget is a routing signal, not a risk

Ambitious scope on a small budget means the client does not know what software costs. `budget-scope-mismatch` is level 1 and never escalates on its own: it is excluded from the "three or more level 2/3 Flags" step. It routes the `build` Family into pricing its own milestones. A low fixed budget is never a hard stop on its own; the human sees the budget at the checkpoint.

Client-priced test: a paid work trial whose price the client sets and pays (`$800 for completing the test`), usually with `paid-first-milestone`. The price is the client's hiring instrument, not a bid, so the Letter does not reprice it: milestones carry no prices, `billing` states no budget gap and does not accept the figure, and `fact/arithmetic` has nothing to check. The rest of `budget-scope-mismatch` holds: the plan is ours, scoped to what the test period can carry.

## Mitigations become Letter content

`proposal` reads the `mitigation` string of every triggered risk Flag from this catalogue and states it in the Slot named by `slot` (see the Slot catalogue, `catalogue/templates/letter-slots.md`). At Alert Level 3 and 4 the Letter must state them. Flags whose mitigation is `none` contribute nothing. Mitigations are not stored on the Candidate; `verify` recomputes them from `verdict.flags` and this catalogue and checks that the target Slot states each one (`flag/mitigation-missing`, fail at Alert Level 3–4, warn at 1–2; see the Verify catalogue, `catalogue/verify.md`). The human also sees them at the Letter review.

## What the human sees first

`triage` prints this in the session, in this order, so the go/no-go call takes under a minute. None of it is stored; the Candidate keeps only the `verdict` block.

1. One line: verdict, Alert Level, Family, three scores.
2. Hard stops, if any.
3. Triggered Flags, one line each: id, level, verbatim evidence.
4. Green Flags.
5. Mitigations to state.
6. Why `ask`, or one line on why not the other verdict.
