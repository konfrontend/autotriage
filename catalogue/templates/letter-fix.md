---
family: fix
slots:
  - hook
  - milestones
  - { id: stack, when: job asks }
  - relevant_work
  - gaps
  - answers
  - billing
  - terms
  - closing
  - sign_off
---

# Letter template: fix

Existing code, bounded change list. Audit is milestone 1 inside the plan, never a separate engagement. The Letter shows the client that the risky items are known and go first.

Slot notes for this Family:

- `milestones`: milestone 1 is a read-only audit with an hour cap and a ranked findings list; the client approves the scope of the rest from that list. Then fixes ordered by risk, highest first, each with an hour range as a cap. Five lines is the usual size; six is the ceiling.
- `relevant_work`: three Past Jobs by default. Prefer ones with the same concern class (payments, auth, integrations) over the same stack.
- `billing`: hours are caps billed on actual; the audit may shrink or grow milestones 2 onward; each is re-quoted before it starts. When the posted budget is fixed and below the plan, state both figures and that milestone 1 fits inside the posted budget and prices the rest.
- `stack`: only when the Job asks. A `fix` Letter keeps the client's stack.
