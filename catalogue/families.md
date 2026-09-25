---
families: [audit, fix, build, maintenance]
default_precedence: [audit, build, maintenance, fix]
templates:
  audit: letter-audit
  fix: letter-fix
  build: letter-build
  maintenance: letter-maintenance
verdict_fields:
  family: one of `families`
  family_runner_up: one of `families` or null
---

# Family catalogue

A Family is the engagement shape the Letter proposes for a Job. `triage` detects it; `proposal` reads it. Portable across Profiles: nothing here is a personal preference. Preferences (precedence, rate, floors) live in the Profile.

## How `triage` detects the Family

1. Detect Flags first (see the Flag catalogue, `catalogue/flags.md`). Triggered Flags are detection cues here.
2. Read the cues below and pick one Family. Model judgment, guided by cues; no keyword rules. Postings are usually unstructured.
3. Write `family` and `family_runner_up` into the `verdict` block of `job.md`. Cues matched and confidence are shown in the session, not stored.
4. Tie between two Families with balanced cues: pick the earlier one in the Profile's Family precedence list. Missing in Profile: use `default_precedence` above. Record the other as `family_runner_up`.
5. Low confidence: still pick. The human checkpoint after `triage` sees the runner-up and may edit `family` in `job.md` before `proposal` runs. `proposal` accepts any value in `families`.
6. No Family fits: Verdict is `ask`. No Letter without a Family. Human sets `family` by hand, then the Route continues.

The client's project type (greenfield, inherited code, live product) is a cue, not the Family. Same Route sequence for every Family; Family changes only the Letter template, active slots, and default topics.

## Families

### audit

Assessment is the deliverable. Client offers or expects a paid review, scoping phase, second opinion, architecture proposal, before any build.

Cues: `paid scoping`, `paid architecture phase`, `review`, `assessment`, `second opinion`, `do not submit a fixed-price bid`, `shortlist then paid assignment`. Green Flag `paid-first-milestone` is a strong cue; `free-discovery` inverts when the client pays for the discovery.

Letter: deliverables list of the assessment, capped hours, what happens after (follow-on build in one sentence, never a second Family).

Default topics: deliverables. Milestones, stack rationale only when the Job asks.

### fix

Existing code, client wants changes. Audit is always milestone 1 inside `fix`; it is not a separate Family.

Cues: inherited or generated codebase (Replit, Lovable, previous developer), bounded change list, bug list, security concerns, deadline, one-off. Flags `client-code-self-assessment`, `burned-before`, `subjective-acceptance` point here.

Letter: audit milestone first, then fix milestones ordered by risk, hours as caps, re-quote after audit.

Default topics: milestones (audit first). Stack rationale only when the Job asks.

Boundary with `maintenance`: bounded change list or one-off means `fix`. Flag `partnership-anchor` never promotes to `maintenance`; the future is priced at zero.

### build

Greenfield, or a rewrite where the existing code is not the starting point. Client wants a product built.

Cues: `MVP`, `from scratch`, `build`, feature list, no codebase mentioned, designs or PRD provided, fixed budget. Flags `fixed-price-unbounded` and `budget-scope-mismatch` point here.

Letter: always includes our own milestone plan. Each milestone carries a price derived from the Profile rate; weights are uneven, not equal splits.

Budget fit rule (not applied to a client-priced test, Flag catalogue): if the posted budget covers the minimum viable scope at the Profile floor, trim scope into deferred milestones until the total fits the posted budget. Otherwise (`budget-scope-mismatch`) price the milestones ourselves and say so in the billing sentence, posted figure against plan figure; the client takes it or leaves it.

Default topics: milestones and stack rationale.

### maintenance

Live product, open-ended engagement, no bounded change list.

Cues: `ongoing`, `retainer`, `hours per week`, `support`, `long-term maintenance`, existing team in place, product already in production.

Letter: rate, weekly hours, communication windows, how work is queued and accepted. No milestones.

Default topics: none.

## Cross-Family rules

- Legal and copyright topics fold into any Family only when the Job asks.
- Flags carry all risk. Family does not change the Alert Level.
- The Profile's Family precedence list is also the `value` hint for the soft scores (ticket 04): earlier in the list, higher value.
- Deferred: `fractional` (leadership, assess as employment). No past Letter, different Letter shape. Out of v1 catalogue; see map fog.
