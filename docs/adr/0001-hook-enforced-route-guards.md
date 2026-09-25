---
status: accepted
---

# Route guards are enforced by hooks, not by skill prose

The Route must not drift: a State may run only when the previous State's artifact exists and validates. Skill prose alone is advisory (Anthropic's guidance: deterministic guardrails come from hooks and permissions), and no surveyed prompt-only skill set actually refuses an out-of-order state. We therefore keep prompt-defined routes (one skill per State, namespaced `autotriage:<state>`) but enforce transitions deterministically: an injected-command guard line at the top of each SKILL.md that aborts the skill when the guard script fails, a `PreToolUse` hook on `Skill` that denies out-of-order invocations, and `PostToolUse` plus `Stop` hooks that validate artifact frontmatter under `data/` against per-State JSON schemas. Each State runs in its own forked agent context with narrowed tools.

## Considered options

- Prompt-only routes with artifact conventions: zero infrastructure, but the model can skip or reorder States; rejected.
- Code orchestrator (script owns state, calls the model per State): strongest guarantee, but duplicates the interactive session for five States, two of them human-in-the-loop; rejected for v1, kept as batch fallback via `claude -p --json-schema`.

## Amended 2026-09-20 (skill skeleton)

Two parts of the original decision were dropped after the skeleton was tested against Claude Code 2.1.270:

- **No `context: fork` per State.** The whole Route runs inline in one session. Two States talk to the human mid-way (`triage` at the checkpoint, `proposal` when a fact is missing) and a forked subagent cannot ask the human. A forked State also keeps its transcript, and the human reads the session, not the files. The Skill tool does honour `context: fork` in this version, so one frontmatter line brings it back for a State that turns out to need isolation.
- **No `Stop` hook.** Inline, `Stop` fires at the end of every turn, including the checkpoint and any Route the human abandons, and would force up to eight retries. The `PostToolUse` validation already rejects a bad artifact at write time, and the next State's guard rejects it again at load time.

What stayed: the injected guard line (a non-zero exit aborts the skill before the model sees its body, and when invoked through the Skill tool the caller receives the guard's stderr as the tool result), the `PreToolUse` deny on out-of-order `Skill` calls (the reason reaches the model through `permissionDecisionReason`; `continueOnBlock` does not apply to `PreToolUse`), and the `PostToolUse` schema validation. State skills stay model-invocable: `disable-model-invocation: true` also blocks the Skill tool, so the entry command could not drive them.

One layout fact found on the way: Claude Code marks every write inside a loaded plugin's directory as sensitive and prompts for it, so the plugin must not be the directory where `data/` is written. ADR 0004 settles this by keeping `data/` in the project that installs the plugin.
