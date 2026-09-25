---
name: skills
description: Print the Skill ledger - Targets, Gaps, the rest - to show which missing Skills Jobs keep asking for.
argument-hint: "print | print gaps"
---
!`node ${CLAUDE_PLUGIN_ROOT}/scripts/guard.mjs skills`

The Skill ledger is `data/profile/skills.md` (catalogue `${CLAUDE_PLUGIN_ROOT}/catalogue/skills.md`: row contract, Level tests, the Target rule). Rendering is the script's; `print` shows its output and nothing else. The ledger is a signal: what the freelancer does about a Gap is outside the plugin.

## Commands

- `print`: run `node ${CLAUDE_PLUGIN_ROOT}/scripts/skills.mjs print` and show its output verbatim in the session. Three groups: Targets (Gaps Seen at least `target_after` times), the other Gaps, then the rest, each by Seen count descending.
- `print gaps`: `node ${CLAUDE_PLUGIN_ROOT}/scripts/skills.mjs print gaps`; the first two groups only.

No argument means `print`. Any other argument: print the two commands above.

Argument received: $ARGUMENTS
