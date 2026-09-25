// Fixtures for the Skill ledger script: Target grouping in the print and the matching and
// recording rules triage applies. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { isTarget, group, renderTable, match, record } from "./skills.mjs";

const row = (name, level, extra = {}) => ({ name, category: "frontend", level, evidence: level === "shipped" || level === "used" ? ["acme"] : [], keywords: [], seen: [], ...extra });
const ledger = () => ({
  target_after: 3,
  skills: [
    row("React", "shipped", { keywords: ["react.js"] }),
    row("Next.js", "used"),
    row("Postgres", "shipped", { keywords: ["sql", "postgresql"], category: "database" }),
    row("Stripe Connect", "gap", { seen: ["2026-09-01-a", "2026-09-02-b", "2026-09-03-c"], category: "backend" }),
    row("Escrow", "gap", { seen: ["2026-09-01-a"], category: "other" }),
    row("RBAC", "gap", { seen: ["2026-09-01-a", "2026-09-02-b"], category: "backend" }),
    row("Rust", "learning"),
  ],
});

test("a Target is a Gap seen target_after times or more", () => {
  const l = ledger();
  assert.ok(isTarget(l.skills[3], l.target_after));
  assert.ok(!isTarget(l.skills[4], l.target_after), "seen once");
  assert.ok(!isTarget(l.skills[5], l.target_after), "seen twice");
  assert.ok(!isTarget(row("x", "shipped", { seen: ["2026-09-01-a", "2026-09-02-b", "2026-09-03-c"] }), 3), "not a Gap");
});

test("print groups Targets, then Gaps, then the rest, each by seen count descending", () => {
  const g = group(ledger());
  assert.deepEqual(g.targets.map((r) => r.name), ["Stripe Connect"]);
  assert.deepEqual(g.gaps.map((r) => r.name), ["RBAC", "Escrow"]);
  assert.deepEqual(g.rest.map((r) => r.name), ["React", "Next.js", "Postgres", "Rust"]);
  const out = renderTable(ledger());
  assert.match(out, /^\| name \| level \| category \| seen \|$/m);
  assert.ok(out.indexOf("Targets") < out.indexOf("Stripe Connect"));
  assert.ok(out.indexOf("Stripe Connect") < out.indexOf("RBAC"));
  assert.ok(out.indexOf("RBAC") < out.indexOf("Escrow"));
  assert.ok(out.indexOf("Escrow") < out.indexOf("React"));
  assert.match(out, /\| RBAC \| gap \| backend \| 2 \|$/m);
  const gapsOnly = renderTable(ledger(), { gapsOnly: true });
  assert.ok(gapsOnly.includes("Escrow") && !gapsOnly.includes("React"));
});

test("match finds rows by name, by keyword, and several rows for a slash item", () => {
  const l = ledger();
  assert.deepEqual(match(l, "React").map((r) => r.name), ["React"]);
  assert.deepEqual(match(l, "SQL database").map((r) => r.name), ["Postgres"]);
  assert.deepEqual(match(l, "React/Next.js").map((r) => r.name), ["React", "Next.js"]);
  assert.deepEqual(match(l, "Strong React and Postgres").map((r) => r.name), ["React", "Postgres"]);
  assert.deepEqual(match(l, "Supabase"), []);
});

test("record appends the Candidate to matched rows once and spawns gap rows for unknown items", () => {
  const l = ledger();
  const changes = record(l, "2026-09-25-fix", { seen: ["React", "Stripe Connect"], gaps: [{ name: "Supabase", category: "database" }] });
  assert.deepEqual(l.skills.find((r) => r.name === "React").seen, ["2026-09-25-fix"]);
  assert.equal(l.skills.find((r) => r.name === "Stripe Connect").seen.length, 4);
  const sb = l.skills.find((r) => r.name === "Supabase");
  assert.deepEqual(sb, { name: "Supabase", category: "database", level: "gap", evidence: [], keywords: [], seen: ["2026-09-25-fix"] });
  assert.deepEqual(changes.appended, ["React", "Stripe Connect"]);
  assert.deepEqual(changes.added, ["Supabase"]);
  // idempotent: a second run on the same Candidate changes nothing
  const again = record(l, "2026-09-25-fix", { seen: ["React"], gaps: [{ name: "Supabase", category: "database" }] });
  assert.deepEqual(again, { appended: [], added: [], unchanged: ["React", "Supabase"] });
  assert.equal(l.skills.find((r) => r.name === "React").seen.length, 1);
  assert.throws(() => record(l, "2026-09-25-fix", { seen: ["Nope"], gaps: [] }), /no row named "Nope"/);
});
