---
status: accepted
---

# Verdict arithmetic lives in scripts; the model only detects

`triage` splits judgment from arithmetic. The model detects Flags (showing verbatim evidence in the session), the Family, and the three soft scores. A script computes the Alert Level, hard stops, and the Verdict from those plus the Profile floors, and the `proposal` guard recomputes them and rejects a `job.md` whose stored `verdict` block disagrees. The model never writes `alert_level` or `verdict` from judgment. We chose this over letting the model apply the combination rules in prose because the rules are pure arithmetic, a model applying them in prose is not reproducible, and a recomputable Verdict makes the human checkpoint auditable. The human never edits `verdict`; they record their own call in a separate `decision` field (`go` or `no-go`), so the script's recommendation and the human's choice stay visible side by side.

## Considered options

- Model applies combination rules and writes the Verdict directly: simplest, non-deterministic, no audit trail; rejected.
- Script detects Flags by keyword matching too: deterministic end to end, but postings are unstructured and cues are paraphrased; rejected.
