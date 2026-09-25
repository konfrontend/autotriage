// Route guard. Runs as the injected command at the top of each State's SKILL.md and from the
// PreToolUse hook. Exit 1 with the refusal on stderr when the State may not run; on success
// print the context the State starts from.
// CLI: node scripts/guard.mjs <state> [candidate]
import fs from "node:fs";
import path from "node:path";
import { readArtifact, readLedger, validate, refuse, Refusal, candidateDir, listCandidates, listPastJobs, PROFILE_DIR } from "./lib.mjs";
import { recompute } from "./verdict.mjs";

const ORDER = ["intake", "triage", "proposal", "verify"];

function profileGate(state, level) {
  const profile = readArtifact(path.join(PROFILE_DIR, "profile.md"));
  if (!profile) refuse(state, "no Profile at data/profile/profile.md.", "Run /autotriage:setup first.");
  const errors = validate("profile", profile.frontmatter);
  if (errors.length) refuse(state, `data/profile/profile.md is invalid:\n  ${errors.join("\n  ")}`, "Run /autotriage:setup or fix the file by hand.");
  ledgerGate(state);
  if (level < 2) return profile;
  const jobs = listPastJobs();
  const valid = jobs.filter((f) => validate("past-job", readArtifact(f)?.frontmatter ?? {}).length === 0);
  if (!valid.length) refuse(state, "no valid Past Job under data/profile/jobs/.", "Run /autotriage:setup and add at least one past job.");
  if (!fs.existsSync(path.join(PROFILE_DIR, "voice.md"))) refuse(state, "no data/profile/voice.md.", "Run /autotriage:setup.");
  return profile;
}

// The Skill ledger (ADR 0003) is part of the Profile: triage records into it, so it must exist and validate.
function ledgerGate(state) {
  const ledger = readLedger();
  if (!ledger) refuse(state, "no Skill ledger at data/profile/skills.md.", "Run /autotriage:setup first.");
  if (ledger.errors.length) refuse(state, `data/profile/skills.md is invalid:\n  ${ledger.errors.join("\n  ")}`, "Run /autotriage:setup or fix the file by hand.");
  return ledger;
}

function candidateGate(state, candidate) {
  const dir = candidateDir(candidate);
  if (!dir) {
    const known = listCandidates();
    refuse(state, `needs a Candidate folder name as argument${candidate ? ` (got "${candidate}")` : ""}.`,
      known.length ? `Known Candidates:\n  ${known.join("\n  ")}\nUsage: /autotriage:${state} <YYYY-MM-DD-slug>` : "No Candidates yet. Run /autotriage:intake first.");
  }
  if (!fs.existsSync(dir)) refuse(state, `no Candidate folder data/candidates/${candidate}.`, "Run /autotriage:intake first.");
  const job = readArtifact(path.join(dir, "job.md"));
  if (!job) refuse(state, `data/candidates/${candidate}/job.md is missing.`, "Run /autotriage:intake first.");
  const errors = validate("job", job.frontmatter);
  if (errors.length) refuse(state, `data/candidates/${candidate}/job.md is invalid:\n  ${errors.join("\n  ")}`, "Run /autotriage:intake again or fix the file by hand.");
  return { dir, job };
}

export function guard(state, candidate) {
  const out = [];
  switch (state) {
    case "setup":
      break;
    case "intake": {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const known = listCandidates();
      out.push(`Today: ${today}`, known.length ? `Known Candidates:\n  ${known.join("\n  ")}` : "No Candidates yet.");
      break;
    }
    case "skills":
      ledgerGate(state);
      break;
    case "route":
      profileGate(state, 2);
      out.push("Profile gate passed.");
      break;
    case "triage": {
      profileGate(state, 1);
      const { dir, job } = candidateGate(state, candidate);
      if (fs.existsSync(path.join(dir, "letter.md"))) refuse(state, `data/candidates/${candidate}/letter.md already exists; the Route has passed triage.`, "Run /autotriage:verify " + candidate + " or start a new Candidate.");
      out.push(`Candidate: data/candidates/${candidate}`, `Title: ${job.frontmatter.title}`, `Budget: ${JSON.stringify(job.frontmatter.budget)}`, `Timezone: ${job.frontmatter.timezone}`);
      if (job.frontmatter.verdict) out.push("Note: a verdict block already exists; triage will overwrite it.");
      break;
    }
    case "proposal": {
      profileGate(state, 2);
      const { job } = candidateGate(state, candidate);
      const v = job.frontmatter.verdict;
      if (!v) refuse(state, `data/candidates/${candidate}/job.md has no verdict block.`, `Run /autotriage:triage ${candidate} first.`);
      const { mismatch } = recompute(candidate);
      if (mismatch.length) refuse(state, `stored verdict disagrees with the recomputation:\n  ${mismatch.join("\n  ")}`, `Run /autotriage:triage ${candidate} again.`);
      if (v.decision === "no-go") refuse(state, "decision is no-go. Route ended.", null);
      if (v.decision !== "go") refuse(state, "checkpoint pending: decision is not set.", `Answer go or no-go in /autotriage:triage ${candidate}, or set verdict.decision in job.md by hand.`);
      out.push(`Candidate: data/candidates/${candidate}`, `Family: ${v.family} (runner-up: ${v.family_runner_up ?? "none"})`, `Verdict: ${v.verdict}, Alert Level ${v.alert_level}, flags: ${(v.flags ?? []).join(", ") || "none"}`, `Scores: skill_fit ${v.skill_fit}, interest_fit ${v.interest_fit}, value ${v.value}`);
      break;
    }
    case "verify": {
      profileGate(state, 2);
      const { dir, job } = candidateGate(state, candidate);
      if (job.frontmatter.verdict?.decision !== "go") refuse(state, "decision is not go.", `Run /autotriage:triage ${candidate} first.`);
      const letter = readArtifact(path.join(dir, "letter.md"));
      if (!letter) refuse(state, `data/candidates/${candidate}/letter.md is missing.`, `Run /autotriage:proposal ${candidate} first.`);
      const errors = validate("letter", letter.frontmatter);
      if (errors.length) refuse(state, `data/candidates/${candidate}/letter.md is invalid:\n  ${errors.join("\n  ")}`, `Run /autotriage:proposal ${candidate} again.`);
      out.push(`Candidate: data/candidates/${candidate}`, `Family: ${letter.frontmatter.family}`);
      break;
    }
    default:
      refuse(state || "(none)", `unknown State. Known: setup, skills, route, ${ORDER.join(", ")}.`, null);
  }
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [state, candidate] = process.argv.slice(2);
  try {
    const ctx = guard(state, candidate || undefined);
    if (ctx) console.log(ctx);
  } catch (e) {
    if (e instanceof Refusal) { console.error(e.message); process.exit(1); }
    console.error(`autotriage: guard crashed: ${e.stack}`); process.exit(1);
  }
}
