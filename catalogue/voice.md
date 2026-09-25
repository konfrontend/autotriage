---
language: en
prose_word_cap_default: 350
total_word_ceiling: 700
banned:
  - "I'm excited"
  - "passionate"
  - "perfect fit"
  - "I have carefully read"
  - "I can assure"
  - "hit the ground running"
  - "leverage"
  - "cutting-edge"
  - "world-class"
  - "Dear"
  - "hope this finds you well"
  - "don't hesitate"
  - "look forward to hearing"
  - "extensive experience"
  - "proven track record"
  - "team of experts"
  - "guarantee"
  - "unlimited revisions"
  - "24/7"
soft_banned:
  - "delve"
  - "seamless"
  - "robust"
  - "ensure"
banned_patterns:
  - exclamation mark
  - rhetorical question (a client's question used verbatim as a header is not one)
  - first person plural ("we", "our team")
  - self-descriptive adjective or title ("senior", "lead", "expert", "experienced")
  - apology
  - contrastive negation ("X, not Y", "never Y", "rather than Y", "nothing changes")
  - Markdown syntax ("**", "*", "_", "#", "[text](url)", ">")
  - emoji
  - ALL-CAPS word or line
  - email, phone, messenger handle, social handle, booking link
---

# Voice rules

Profile-independent rules for every Letter. Personal parts (greeting, sign-off, extra phrases, language variant, calibration text) live in the Profile's `voice.md`. `proposal` applies both; `verify` enforces the machine-checkable parts.

## Goal

The Letter reads as a person who knows what they are doing and is reliable, without promises. Every sentence carries a fact or a concrete step. Nothing is filler.

## Structure

- Line 1 is the greeting from the Profile (`greeting`, default `Hi,`). No introduction: the client sees name and photo in the list view.
- The Hook is the first paragraph after the greeting: within the Slot catalogue `hook` `cap.chars`, one or two sentences that open with a phrase of understanding (`As I understand it, ...`) and restate the client's goal and its main constraint in our words. It shows the Job was understood; it sells nothing. No name, no stack list, no rate, no promise, no Profile fact.
- Then only the paragraphs the Job or the Family template demands. A paragraph that answers nothing in the Job is dropped.
- Relevant work and gaps are prose. At most one list per Letter, only for milestones (`fix`, `build`) or audit deliverables (`audit`) with three or more distinct artifacts. `maintenance` is all prose.
- Slots `relevant_work`, the plan Slot, `stack`, `gaps`, `answers`, `billing` open with a header: a short line ending with a colon, on its own line. `hook`, `terms`, `closing`, `sign_off` carry none. Headers are the only structure the client sees, so every one names what follows in two or three words. When the Job lists questions or asks (screening questions, `please include ...`), those become the headers and the Slots that answer them render underneath (Slot catalogue, `Ask headers`): a real question verbatim, numbering stripped, ending with `?` and allowed to run longer than three words; a request fragment reworded in first person from the freelancer's side (`Products I've built:`). A colon header never says `you` or `your`. `terms` then carries the availability question as its header.
- Gaps slot: for every required item of the Job not covered by a `shipped` Skill, one paragraph within the Slot catalogue `gaps` `cap.each.sentences`: the gap named plainly, the nearest thing done, what the ramp-up is. Never an apology, never "but". Nice-to-haves are never gaps; no required gap means no Gaps slot (Slot catalogue, `gaps`).
- Budget: the Letter never does arithmetic for the client. No derived total, no monthly or annual extrapolation, no comparison the client did not ask for. Except on a client-priced test (Flag catalogue), when the Letter's plan costs more than the posted budget, the billing sentence names both figures and what the posted budget buys, and stops there.
- Terms: one sentence with location, timezone overlap, and weekly hours from the Profile. Overlap is stated as the client's part of the day (`overlaps with your mornings`), never as hour ranges the client must convert. Availability is `available now` when the Job asks for it, or `from <date>` when the Profile `terms.availability_from` is set; never a bounded window (`through the next 90 days` reads as unavailable after). No header. Rate appears only when the Job has no budget and no rate, when the Family is `build` and the Letter prices its own milestones, or when the Job asks for the rate in a listed question; otherwise the submit form carries it.
- Closing: one line offering to answer the questions that remain. No channel named, no call, and no offer to show a client's codebase: Past Jobs for other clients are confidential, and a Letter that offers a walkthrough of one tells the client their own code would be shown next. A plain thanks is fine. Then the sign-off on its own line.

## Length

- Word cap from the Profile (`word_cap`, default `prose_word_cap_default`) applies to prose. List lines for milestones or deliverables, header lines, and the `answers` Slot are excluded from that count.
- Total hard ceiling `total_word_ceiling` words including lists.
- The cap is a ceiling, not a target. Shorter is better whenever every demanded item is covered.

## Facts and confidence

- Confidence comes from facts, never from adjectives. No seniority, title, or self-assessment words.
- A cited fact is a product name with URL, a role, a period in years, or one or two concrete things done there that match the Job. Role and period only when Profile `voice.md` `cite_role_period` is true (the default). Ownership or authorship of a Past Job is always stated when its role says so: it is the strongest fact a product can carry.
- Not cited: commit counts, percentages, team size, awards.
- Every fact traces to a `jobs/<slug>.md` entry in the Profile. When the Letter needs a fact the Profile lacks, `proposal` asks the human for it, appends it as a confirmed bullet to the matching `jobs/<slug>.md`, and only then writes the Letter. `letter.md` stays fact-free of anything not in the Profile.

## Formatting

Plain text. Short paragraphs separated by one blank line. Lists as lines starting with `-` or `1.`. Bare `https://` URLs to pages without a contact form; links to relevant work are not capped. No Markdown, no emoji, no ALL-CAPS, no leading indentation, no contact details or off-platform links.

## Rhythm

Short sentences, one idea each, active voice, present tense where true. No stacked clauses. Two rhythm rules are checked: a line with two or more semicolons (`voice/semicolon-chain`, script) and a sentence built on a contrast with what is not done (`voice/contrast-negation`, model): state what is done and stop.

## Enforcement split

`verify` fails on: banned phrases, banned patterns, Markdown, contact details, Hook over its Slot cap, missing Slot header where the Slot catalogue requires one, prose over the Profile cap, total over `total_word_ceiling`, missing gap slot when a required item of the Job is outside the ledger's `shipped` Skills, untraceable fact.

`verify` warns on: soft-banned words, semicolon chains, contrastive negation (the model rewrites the sentence; the Letter is not rejected).

The full Check list, Fix kinds, and the review-and-fix cycle are in the Verify catalogue, `catalogue/verify.md`. `verify` applies Fixes to `letter.md` itself; it does not hand a report back to `proposal`.

Rhythm, density, and Hook quality are model judgment, checked by the human at the Letter review.

## Profile `voice.md`

```yaml
language: en-US          # en-US | en-GB
greeting: "Hi,"          # line 1 of every Letter
sign_off: ""             # first name; this file owns it, profile.md carries no sign-off
banned_extra: []         # phrases added to the shared list
allowed_extra: []        # shared banned phrases this Profile permits
cite_role_period: true   # false: relevant_work cites product name, URL and things done, no role or years
```

Body: empty at `setup`. After the first Letter the human approves, its text is copied here as calibration. Until then the rules above carry the voice.
