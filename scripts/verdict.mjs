// Verdict arithmetic (ADR 0002). The model detects Flags, Family, and scores;
// this script computes alert_level, hard_stops, and verdict from them plus Profile floors.
// CLI: node scripts/verdict.mjs <candidate> [--check]
//   without --check: rewrites the computed fields into job.md and prints them
//   with --check: exits 1 when stored values disagree with the recomputation
import path from "node:path";
import { readArtifact, writeArtifact, loadCatalogue, candidateDir, PROFILE_DIR } from "./lib.mjs";

export function compute(verdict, profile, job) {
  const catalogue = loadCatalogue("flags");
  const byId = new Map(catalogue.flags.map((f) => [f.id, f]));
  const triggered = (verdict.flags ?? []).map((id) => byId.get(id)).filter(Boolean);
  const risk = triggered.filter((f) => !f.kind || f.kind === "risk");
  const green = triggered.filter((f) => f.kind === "green");
  const stop = triggered.filter((f) => f.kind === "stop");

  // alert_level_steps from catalogue/flags.md
  let level = risk.length ? Math.max(...risk.map((f) => f.level)) : 1;
  const midCount = new Set(risk.filter((f) => (f.level === 2 || f.level === 3) && f.id !== "budget-scope-mismatch").map((f) => f.id)).size;
  if (midCount >= 3) level += 1;
  const ids = new Set(risk.map((f) => f.id));
  if ((ids.has("hostile-tone") || ids.has("burned-before")) && risk.some((f) => f.level >= 2 && f.id !== "hostile-tone" && f.id !== "burned-before")) level += 1;
  if (green.length) level -= 1;
  level = Math.min(5, Math.max(1, level));

  // hard_stops from catalogue/flags.md. refused-stack and unmet-constraint are stop Flags the model
  // detects against the Profile; each forces the hard stop of the same id and stays out of the Alert Level.
  const hardStops = [];
  if (level === 5) hardStops.push("alert-level-5");
  if (risk.some((f) => f.level === 5)) hardStops.push("level-5-flag");
  const floor = profile?.terms?.rate_floor ?? 0;
  if (job?.budget?.type === "hourly" && typeof job.budget.max === "number" && floor > 0 && job.budget.max < floor) hardStops.push("rate-below-floor");
  for (const f of stop) hardStops.push(f.id);

  // verdict_mapping, in order
  let result;
  if (hardStops.length) result = "no-go";
  else if (verdict.skill_fit === 1) result = "no-go";
  else if (verdict.skill_fit === 2) result = "ask";
  else if (!verdict.family) result = "ask";
  else if (level <= 2) result = "go";
  else if (level === 3) result = "go";
  else if (level === 4) result = verdict.skill_fit === 5 ? "go" : "ask";
  else result = "no-go";

  return { alert_level: level, hard_stops: hardStops, verdict: result };
}

export function recompute(candidate) {
  const dir = candidateDir(candidate);
  const job = readArtifact(path.join(dir, "job.md"));
  const profile = readArtifact(path.join(PROFILE_DIR, "profile.md"));
  if (!job?.frontmatter?.verdict) return { job, computed: null, mismatch: ["verdict block missing"] };
  const computed = compute(job.frontmatter.verdict, profile?.frontmatter, job.frontmatter);
  const stored = job.frontmatter.verdict;
  const mismatch = [];
  for (const k of ["alert_level", "verdict"]) if (stored[k] !== computed[k]) mismatch.push(`${k}: stored ${stored[k]}, computed ${computed[k]}`);
  const a = JSON.stringify([...(stored.hard_stops ?? [])].sort()), b = JSON.stringify([...computed.hard_stops].sort());
  if (a !== b) mismatch.push(`hard_stops: stored ${a}, computed ${b}`);
  return { job, computed, mismatch };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [candidate, flag] = process.argv.slice(2);
  const dir = candidateDir(candidate);
  if (!dir) { console.error("usage: verdict.mjs <candidate> [--check]"); process.exit(2); }
  const { job, computed, mismatch } = recompute(candidate);
  if (!computed) { console.error(mismatch.join("\n")); process.exit(1); }
  if (flag === "--check") {
    if (mismatch.length) { console.error(`verdict mismatch in ${candidate}/job.md:\n${mismatch.join("\n")}`); process.exit(1); }
    console.log("verdict ok");
  } else {
    Object.assign(job.frontmatter.verdict, computed);
    if (!("decision" in job.frontmatter.verdict)) job.frontmatter.verdict.decision = null;
    writeArtifact(job.file, job.frontmatter, job.body);
    console.log(JSON.stringify(computed));
  }
}
