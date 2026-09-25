# Autotriage

Agentic skill set that takes a freelance job posting and produces a triage verdict and a pasteable proposal, following fixed routes and templates.

## Language

### Inputs

**Job**:
One job posting: the client's free-form text plus explicit parameters (client timezone, budget, anything the body omits).
_Avoid_: posting, listing, gig, opportunity

**Candidate**:
A Job saved under `data/` and moving through the Route. Term reserved for the artifact; the posting itself is the Job.
_Avoid_: application, lead

**Family**:
The engagement shape the Letter proposes for a Job: `audit`, `fix`, `build`, `maintenance`. Detected by `triage` from the Job and its Flags; selects the Letter template, its active slots, and default topics (milestones, deliverables, stack rationale). The Route sequence is the same for every Family. The client's project type (greenfield, inherited code, ...) is a detection signal, not the Family.
_Avoid_: type, category, kind, project type, engagement model

### Workflow

**Route**:
The fixed sequence of States a Candidate passes through. Agents follow it; they do not invent steps.
_Avoid_: pipeline, flow, workflow

**State**:
One step of the Route (`setup`, `intake`, `triage`, `proposal`, `verify`). Each State has one skill and one output artifact.
_Avoid_: stage, phase, step

**Verdict**:
Triage output: `go`, `no-go`, or `ask`, with scores and triggered Flags.
_Avoid_: decision, result, assessment

**Flag**:
One named risk signal in a Job, with a Level 1–5 from the Flag catalogue. A Green Flag is a Flag of Level 0 that lowers the Alert Level. A Stop Flag is a Profile-fit failure (refused stack, unmet constraint) with no Level that forces a Hard Stop.
_Avoid_: red flag, warning, concern

**Alert Level**:
The Candidate's overall risk, 1–5: highest triggered Flag adjusted by combination rules.
_Avoid_: risk score, severity

**Hard Stop**:
A condition that forces Verdict `no-go` regardless of scores: Alert Level 5, a Level 5 Flag, a Stop Flag, or a Job term below a Profile floor.
_Avoid_: dealbreaker, blocker

**Safeguard**:
The term a triggered Flag makes the Letter state, in a fixed Slot, to protect the freelancer from the risk the Flag names. Example: `burned-before` puts a paid audit first in the plan. Names only what the Job or the human states.
_Avoid_: mitigation, condition, caveat

**Guard**:
The deterministic check a State runs before it loads: the previous State's artifact exists and validates, and the Route's preconditions hold. A failing Guard refuses the State with the reason and the next command to run.
_Avoid_: gate, precondition check, validation step

### Outputs

**Letter**:
The final pasteable proposal text produced by `proposal`. The Route ends when the Letter is sent.
_Avoid_: bid, cover letter, application, pitch

**Hook**:
The first paragraph of a Letter after the greeting: the client's goal and its main constraint restated as understood, sized to the preview the client sees before opening. Never an introduction, never a pitch.
_Avoid_: opener, intro, first sentence

**Slot**:
One named part of a Letter template (Hook, relevant work, gaps, milestones, terms, closing). A Family's template orders and activates Slots; `verify` checks Slots, not paragraphs.
_Avoid_: section, block, fragment

**Profile**:
The freelancer's data: Skills, Past Jobs, terms, voice. Built by `setup`, lives in `data/` of the project the session runs in, never part of the plugin.
_Avoid_: user profile, resume, CV, persona

**Past Job**:
One engagement the freelancer has already done, recorded in the Profile as facts the Letter may cite. Not a Candidate: a Candidate is a Job being pursued now.
_Avoid_: experience, portfolio item, reference, case study

**Skill**:
One technology or domain practice the Profile tracks, with a Level (`gap`, `learning`, `used`, `shipped`) and the Past Jobs that prove it. Years of experience and spoken languages are not Skills.
_Avoid_: technology, stack item, competency, capability

**Level**:
How far a Skill is proven: `shipped` (a Past Job shows it in production), `used` (used, not shipped in a Past Job), `learning` (studied, no use), `gap` (Jobs require it, the freelancer has not used it).
_Avoid_: proficiency, seniority, rating, production, working

**Gap**:
A Skill at Level `gap`. Exists only because a Job required it.
_Avoid_: missing skill, weakness, hole

**Seen**:
The Candidates whose Job required a Skill. Their count is the Skill's demand.
_Avoid_: mentions, occurrences, hits, count

**Target**:
A Gap Seen at least the Profile's threshold of times. A grouping in the printed Skill table, a signal only: what the freelancer does about it is outside the plugin.
_Avoid_: hot, priority, candidate skill

### Verification

**Check**:
One named rule `verify` applies to a Letter, by script or by model judgment.
_Avoid_: rule, lint, test

**Finding**:
One violation of a Check in one Slot, graded `fail` or `warn`.
_Avoid_: error, issue, violation, warning

**Fix**:
The change `verify` applies to the Letter for a Finding: a patched sentence or a regenerated Slot.
_Avoid_: correction, repair, remediation
