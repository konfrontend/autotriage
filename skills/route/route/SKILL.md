---
name: route
description: Drive one Job through the whole Route in one sitting - intake, triage, checkpoint, proposal, verify.
disable-model-invocation: true
argument-hint: "[paste the Job here or in the next message]"
---
!`node ${CLAUDE_PLUGIN_ROOT}/scripts/guard.mjs route`

The Route is one sitting: the human pastes a Job, reads a one-screen triage summary, answers go or no-go, and receives the Letter. Each State is its own skill; invoke them in order with the Skill tool and forward the Candidate folder name between them. The guards refuse a State out of order in both this mode and manual mode.

## Steps

1. **Collect the Job.** The argument or the next message carries the paste: the posting body, usually behind a parameter line with country, budget, hours, and duration. Done when the paste is in hand; `intake` reads the fields and asks for what is missing.
2. **Intake.** Invoke `autotriage:intake` with the collected material as its argument. Its last line names the Candidate folder (`YYYY-MM-DD-<slug>`). Done when that folder name is in hand.
3. **Triage and proposal.** Invoke `autotriage:triage <candidate>`. It prints the summary, asks the human for go or no-go, records the decision, asks separately for confirmation of the Skill ledger changes, and on `go` invokes `autotriage:proposal <candidate>` itself, which invokes `autotriage:verify <candidate>` in turn. A `no-go` ends the Route: say so and stop. `verify` output ends with the Letter in a code block, ready to paste. The Route ends when the human has pasted it.

A State that answers with a line starting `autotriage:` has refused. Print that line verbatim and stop; it names the fix.
