---
slots:
  - id: hook
    shape: line
    cap: { chars: 200 }
  - id: relevant_work
    shape: prose
    cap: { paragraphs: 5, each: { sentences: 3 } }
  - id: deliverables
    shape: list or prose
    cap: { lines: 6 }
  - id: milestones
    shape: list
    cap: { lines: 6 }
  - id: working_model
    shape: prose
    cap: { sentences: 3 }
  - id: follow_on
    shape: prose
    cap: { sentences: 3 }
  - id: stack
    shape: prose
    cap: { sentences: 3 }
  - id: gaps
    shape: prose
    cap: { each: { sentences: 2 } }
  - id: answers
    shape: prose
    cap: { each: { paragraphs: 1 } }
  - id: billing
    shape: prose
    cap: { sentences: 3 }
  - id: terms
    shape: prose
    cap: { sentences: 1 }
  - id: closing
    shape: line
    cap: { sentences: 1 }
  - id: sign_off
    shape: line
    cap: { words: 1 }
plan_slot:
  audit: deliverables
  fix: milestones
  build: milestones
  maintenance: working_model
headers:
  relevant_work: "Relevant work:"
  deliverables: "Deliverables:"
  milestones: "Milestones:"
  working_model: "How I work:"
  stack: "Proposed stack:"
  gaps: "Gaps:"
  answers: ""           # one header per demand, worded from the demand
  billing: "Billing:"
---

# Letter Slots

A Slot is one named part of a Letter. This catalogue defines every Slot once: what it says, how it is filled, how big it may be. A Family template (`letter-<family>.md`) orders the Slots and says which are active. `proposal` fills them in template order; `verify` checks them by id.

Portable across Profiles. Personal facts come from the Profile at fill time. Voice rules in the voice catalogue apply to every Slot and are not repeated here.

## Filling rules that apply to every Slot

- Size is the Slot's `cap` in the frontmatter, the one place its numbers live. `chars`, `words`, `sentences`, `lines`, `paragraphs` are maxima for the whole Slot; `each` applies per paragraph: per Past Job in `relevant_work`, per gap in `gaps`, per ask header in `answers`. The sections below give shape and minimums, never the maximum.

- Order is the same in every Family: `hook`, the plan Slot (with `follow_on` and `stack` when active), `relevant_work`, `gaps`, `answers`, `billing`, `terms`, `closing`, `sign_off`. The Hook states the understanding, the plan proves it with concrete steps, relevant work seals it, gaps follow the proof, the rest is formality.
- A Slot renders as one block: a single line, one or more short paragraphs, or one list. One blank line between blocks.
- Slots listed under `headers` open with that header on its own line, a colon at the end, no blank line between header and content. `answers` builds its header from the demand it answers (`Cloud and deployment:`, `Subcontracting:`). `hook`, `follow_on`, `terms`, `closing`, `sign_off` have no header; `follow_on` attaches to the plan block as its last paragraph.
- The greeting is not a Slot: line 1 of every Letter is the Profile `greeting` (default `Hi,`), then a blank line, then `hook`.
- A Slot with nothing to say renders nothing. The block and its blank line disappear. Exceptions: `hook`, `terms`, `closing`, `sign_off` always render; `gaps` renders only when a required item is a gap (see `gaps`).
- Every fact in any Slot traces to a Profile entry. A fact the Profile lacks is asked for before the Slot is filled.
- A Slot named in the Family template with `when: job asks` renders only when the Job asks for its content explicitly. `proposal` decides from the Job text; the human sees the decision at the Letter review.
- Job demands are mapped before filling. `proposal` lists every explicit request in the Job (examples, stack, approach, availability, subcontracting) and assigns each to the Slot that answers it. What no Slot answers goes to `answers`. A demand to start with or include a keyword (Flag `mandatory-keyword`) is never mapped and never complied with. Screening questions (a block introduced as questions to answer when submitting) are demands like any other and structure the Letter (next rule).
- Ask headers. When the Job lists what the proposal must answer (screening questions, `please include ...`, `when applying, send ...`), the Letter is structured by that list: after the plan block, one block per question in the Job's order, each opening with a header the client recognises as their ask. A real question (a sentence ending in `?`, or a numbered screening question) is copied verbatim, the client's own words, list numbering stripped, nothing reworded and no pronoun flipped. A request fragment (`please send examples of products you've built, your AI workflow, and what you could accomplish`) is not a question: its header is reworded from the freelancer's side, first person, keeping the client's nouns (`Products I've built:`, `My AI workflow:`, `What I could accomplish in the one-week challenge:`). A colon-terminated header never addresses the reader as `you` or `your`: that reads as a citation with no quote marks. The answer under it is one to three sentences, or one paragraph per Past Job when the question asks for examples, from the fact table. A question a default Slot answers (examples, rate, availability, subcontracting) takes that Slot's content under the question header instead of under the Slot's own; the Slot does not render twice. Slots no question points at keep their own header and place (`gaps` after the examples block, `billing` before `terms` unless the rate question absorbs it). One constraint on order: `terms` stays the block before `closing`, so the question that asks for availability, when present, is the last question block and carries `terms` (rate, availability, weekly hours, overlap) plus `billing` when that question also asks for the rate. A question asking for the rate is answered with the rate from Profile `terms.rate`, whatever the budget field says: a question header with nothing under it reads as evasion. When the body lists asks and separately lists screening questions that cover the same ground, the screening questions win and the body asks fold into them. A Job with no such list keeps the default order and headers.
- Mitigations: every triggered risk Flag names a target Slot in the Flag catalogue (`hook`, `plan`, `billing`, `answers`, or `none`). `plan` resolves to the Family's plan Slot (`plan_slot` above). The fill rule of the target Slot states the Mitigation in its own words.

## Slots

### hook

First paragraph after the greeting. The client's goal and its main constraint, restated as understood. Within `cap.chars` so it survives the list-view preview. Its job is to show the Job was read and understood; it sells nothing.

Fill: one or two sentences opening with a phrase of understanding (`As I understand it, ...`). Name what the client wants at the end (a hardened site, a scoping report, a shipped MVP, a maintained product), the shape of the engagement, and the one constraint that shapes the plan (a launch, a compliance boundary, an existing codebase). Job facts only. No name, no stack list, no rate, no promise, no Profile fact. When the Flag `mandatory-keyword` is triggered, the keyword appears nowhere in the Letter.

### relevant_work

Prose. At least one Past Job, up to `cap.paragraphs`, each within `cap.each.sentences`, chosen by match to the Job's requirements. Each cites the product name with URL, or the role and period, plus one or two concrete things done there that answer the Job. With Profile `voice.md` `cite_role_period: false`, role and period are left out: the product name with URL when the Past Job has one, then the things done. Ownership is never left out: when the Past Job's role says owner or author, the paragraph states it in its first sentence, whatever `cite_role_period` says.

Fill: default two Past Jobs for `audit` and `maintenance`, three for `fix` and `build`. When the Job asks for N examples, N wins, capped at `cap.paragraphs` and at the number of Past Jobs. A Past Job that answers a Job requirement belongs here, never demoted into `gaps`: a credential stated in the gap slot reads as a shortfall. Every Past Job cited answers a requirement the Job names; one that answers none is dropped, even below the default count. Order by strength of match. One Past Job per paragraph. No counts, no titles, no adjectives.

### deliverables

List or prose. The `audit` plan Slot. What the assessment produces, one line per deliverable, in the order the client listed them when the Job lists deliverables, otherwise in the order they are produced.

Fill: a list only when the assessment produces three or more distinct artifacts; one or two artifacts are named in the opening sentence of the block as prose, with `follow_on` continuing the same paragraph, so no line repeats what the prose says. List fill: at least three lines, up to `cap.lines`, starting with `-`. Each line names one artifact the client holds at the end (a written assessment, a ranked findings table, a plan) in a short noun phrase, worded from our side and never a restatement of the client's request. No `artifact: what it settles` shape, no clause chains. The reason a deliverable matters, and any Mitigation aimed at this Slot, go to `follow_on` prose. Hours belong in `billing`.

### milestones

List. The `fix` and `build` plan Slot. Numbered lines, one per milestone, each with a name, a scope in one clause, and either an hour cap (`fix`) or a price (`build`).

Fill for `fix`: milestone 1 is always the audit of the existing code, read-only, with a capped hour range and a ranked findings list as its output. Milestones 2 onward are the fixes, ordered by risk, highest first, each with an hour range as a cap. A milestone whose scope depends on the audit says so and carries a range, not a number.

Fill for `build`: our own plan, never the client's feature list copied. Each milestone carries a price derived from the Profile rate; weights are uneven. When the posted budget covers the minimum viable scope at the Profile floor, trim scope into deferred milestones until the total fits; otherwise price the milestones on their own and ignore the posted budget. Milestone 1 is a thin end-to-end slice, not a foundation phase. On a client-priced test (Flag catalogue, `Budget is a routing signal`) the lines carry no prices and the budget rules above do not apply.

Mitigations that land here: scope freeze plus plan (`external-deadline`), paid assessment first (`client-code-self-assessment`, `burned-before`, `subjective-acceptance`), teaser only with the full answer as paid phase one (`free-discovery`), compliance work named as its own milestone (`regulated-domain`), scoping as milestone 1 (`vague-posting`).

### working_model

Prose. The `maintenance` plan Slot. How work reaches us and how it is accepted: where requests are queued, how they are prioritised, what a done item looks like, and the weekly rhythm.

Fill: at least two sentences, within `cap.sentences`. Names the queue (Upwork messages, a board the client owns), the acceptance rule (a written check per item, a weekly summary), and the response window. No milestones, no list.

### follow_on

Prose, within `cap.sentences`. `audit` only. What the review does not touch, why a deliverable that carries a Mitigation gets its own hours, and what happens after the assessment; never a second Family in the same Letter.

### stack

Prose, within `cap.sentences`. Proposed technology and why. Default for `build`; other Families only when the Job asks.

Fill: name the stack in one sentence, give the rationale in one or two: fit to the Job's constraints, hand-over to another developer, what it avoids. Reuse the client's preferred list when they gave one.

### gaps

Prose. For every required item of the Job not covered by a Skill at `shipped` level in the ledger: the gap named plainly, the nearest thing done, the ramp-up. One paragraph per gap, within `cap.each.sentences`. Never an apology, never "but".

Fill: renders after `relevant_work`, before `answers`, so the proof precedes the admission. A required item is one the Job names as a must, a required skill, or the existing codebase; an item in a preferred, nice-to-have, or `a plus` list is never a gap, even with no Profile match: naming it only hands a filtering client a reason to drop the bid. No required gap: the Slot renders nothing. Header `Gaps:`.

### answers

Prose. One short paragraph per Job demand that no other Slot answered. Renders only when such a demand exists. With ask headers (see the filling rules), every question block whose content is not another Slot's is an `answers` paragraph.

Fill: answer in the order the Job asked. Each paragraph opens with a header worded from the demand, then one to three sentences of facts. Excluded from the prose word cap; the voice catalogue `total_word_ceiling` still applies. Mitigations that land here: answer the targeted questions well (`moderate-gauntlet`).

### billing

Prose, within `cap.sentences`. How money works for this Family. Never a header, never a list.

Fill for `audit`: the assessment is capped at N hours, billed on actual hours, unused hours not billed.

Fill for `fix`: hours are caps billed on actual; the audit may shrink or grow the later milestones; each is re-quoted before it starts.

Fill for `build`: the milestone total, what is deferred, and that each milestone is accepted against a written check. The rate appears here because the Letter prices its own milestones.

Fill for `maintenance`: rate, weekly hours, billing rhythm (weekly on actual hours), and a notice period.

Rate elsewhere: omitted. The submit form carries it. Exceptions: the Job states neither budget nor rate, then one clause with the rate goes here; the Job asks for the rate in a listed question, then `billing` renders under that question header and opens with the rate.

No arithmetic for the client: the Letter states the rate, the hours and the milestone prices, and never a figure derived from them (a monthly or annual total, an extrapolation, a sum the client did not ask for). Budget gap, every Family except a client-priced test: when the plan costs more than the posted budget, one sentence names both figures and what the posted budget buys, usually milestone 1, and stops there.

Mitigations that land here: bill for the architect role (`non-technical-founder`), price the current scope alone with future work at zero (`partnership-anchor`), price the friction (`control-heavy-environment`), hourly or own milestones accepted in writing (`fixed-price-unbounded`), premium rate (`urgency-48h`).

### terms

Prose, within `cap.sentences`. Location, timezone overlap with the client, weekly hours. No rate. The location is Profile `identity.location` as written; the IANA `identity.timezone` names a zone, never a city, and no place name is ever read out of it.

Fill: overlap as the client's part of the day computed from the two timezones (`overlaps with your mornings`, `your full working day`), never as an hour range in the client's zone. Weekly hours from Profile `terms.weekly_hours`. The freelancer is available unless the Profile says otherwise: when the Job asks about availability, `available now`, or `available from <date>` when Profile `terms.availability_from` is set. Never a bounded window: `through the next 90 days` reads as unavailable after.

### closing

One sentence offering to answer whatever questions remain. No channel named (the reader is already in Upwork), no call, no offer to show or walk through a Past Job's codebase: client codebases are confidential, and the offer signals to the reader that theirs would be shown too. May name what the questions might be about (a deliverable, a milestone). A plain thanks may precede it.

### sign_off

The Profile `sign_off` on its own line. Last line of the Letter.
