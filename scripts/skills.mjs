// The Skill ledger (ADR 0003, catalogue/skills.md): data/profile/skills.md. Targets are derived here,
// never stored. `triage` records what a Job required through `record`; the skills skill prints
// through `print`.
// CLI: node scripts/skills.mjs print [gaps]
//      node scripts/skills.mjs match <item>...
//      node scripts/skills.mjs record <candidate> [--seen <name>]... [--gap <name>:<category>]...
import fs from "node:fs";
import { YAML } from "./vendor/deps.mjs";
import { readLedger, validate, candidateDir, LEDGER_FILE } from "./lib.mjs";

export const LEVELS = ["gap", "learning", "used", "shipped"];

export function isTarget(row, targetAfter) {
  return row.level === "gap" && (row.seen ?? []).length >= targetAfter;
}

const bySeen = (a, b) => (b.seen ?? []).length - (a.seen ?? []).length;

export function group(ledger) {
  const targets = [], gaps = [], rest = [];
  for (const r of ledger.skills) {
    if (isTarget(r, ledger.target_after)) targets.push(r);
    else if (r.level === "gap") gaps.push(r);
    else rest.push(r);
  }
  return { targets: targets.sort(bySeen), gaps: gaps.sort(bySeen), rest: rest.sort(bySeen) };
}

export function renderTable(ledger, { gapsOnly = false } = {}) {
  const g = group(ledger);
  const sections = [["Targets", g.targets], ["Gaps", g.gaps]];
  if (!gapsOnly) sections.push(["Rest", g.rest]);
  const out = [];
  for (const [title, rows] of sections) {
    out.push(`${title} (${rows.length})`, "", "| name | level | category | seen |", "| --- | --- | --- | --- |");
    for (const r of rows) out.push(`| ${r.name} | ${r.level} | ${r.category} | ${(r.seen ?? []).length} |`);
    out.push("");
  }
  return out.join("\n").trimEnd();
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function termRe(term) {
  const a = /^\w/.test(term) ? "\\b" : "", z = /\w$/.test(term) ? "\\b" : "";
  return new RegExp(`${a}${escapeRe(term)}${z}`, "i");
}

// Rows a Job item matches: by name or by keyword, whole words, any number of rows per item.
export function match(ledger, item) {
  const text = String(item);
  return ledger.skills.filter((r) => [r.name, ...(r.keywords ?? [])].some((t) => termRe(t).test(text)));
}

function rowNamed(ledger, name) {
  const row = ledger.skills.find((r) => r.name.toLowerCase() === String(name).toLowerCase());
  if (!row) throw new Error(`no row named "${name}" in the ledger`);
  return row;
}

// Append the Candidate to each named row's seen list and add a gap row per unknown item. Idempotent.
export function record(ledger, candidate, { seen = [], gaps = [] }) {
  const changes = { appended: [], added: [], unchanged: [] };
  for (const name of seen) {
    const row = rowNamed(ledger, name);
    row.seen ??= [];
    if (row.seen.includes(candidate)) changes.unchanged.push(row.name);
    else { row.seen.push(candidate); changes.appended.push(row.name); }
  }
  for (const { name, category } of gaps) {
    const existing = ledger.skills.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (existing.seen.includes(candidate)) changes.unchanged.push(existing.name);
      else { existing.seen.push(candidate); changes.appended.push(existing.name); }
      continue;
    }
    ledger.skills.push({ name, category, level: "gap", evidence: [], keywords: [], seen: [candidate] });
    changes.added.push(name);
  }
  return changes;
}

function loadOrFail() {
  const ledger = readLedger();
  if (!ledger) throw new Error(`no ledger at data/profile/skills.md. Run /autotriage:setup.`);
  if (ledger.errors.length) throw new Error(`data/profile/skills.md is invalid:\n  ${ledger.errors.join("\n  ")}`);
  return ledger;
}

// One flow-style row per line, so a hand edit and a diff stay readable at tens of rows.
export function serialize(fm) {
  const { skills, ...rest } = fm;
  const head = YAML.stringify(rest, { lineWidth: 0 }).trimEnd();
  const rows = skills.map((r) => "  - " + YAML.stringify(r, { flow: true, lineWidth: 0 }).trim());
  return `${head}\nskills:\n${rows.join("\n")}`;
}

function save(ledger) {
  const errors = validate("skills", ledger.frontmatter);
  if (errors.length) throw new Error(`refusing to write an invalid ledger:\n  ${errors.join("\n  ")}`);
  fs.writeFileSync(LEDGER_FILE, `---\n${serialize(ledger.frontmatter)}\n---\n${ledger.body ?? ""}`);
}

function flagValues(args, flag) {
  const out = [];
  for (let i = 0; i < args.length; i++) if (args[i] === flag && args[i + 1] !== undefined) out.push(args[++i]);
  return out;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (cmd === "print") {
      console.log(renderTable(loadOrFail().frontmatter, { gapsOnly: args[0] === "gaps" }));
    } else if (cmd === "match") {
      const ledger = loadOrFail().frontmatter;
      for (const item of args) console.log(`${item}: ${match(ledger, item).map((r) => r.name).join(", ") || "(no row)"}`);
    } else if (cmd === "record") {
      const candidate = args[0];
      if (!candidateDir(candidate)) throw new Error("usage: skills.mjs record <candidate> [--seen <name>]... [--gap <name>:<category>]...");
      const gaps = flagValues(args, "--gap").map((g) => {
        const m = /^(.+):([a-z0-9-]+)$/.exec(g);
        if (!m) throw new Error(`--gap wants <name>:<category>, got "${g}"`);
        return { name: m[1], category: m[2] };
      });
      const ledger = loadOrFail();
      const changes = record(ledger.frontmatter, candidate, { seen: flagValues(args, "--seen"), gaps });
      save(ledger);
      console.log(JSON.stringify(changes));
    } else {
      console.error("usage: skills.mjs print [gaps] | match <item>... | record <candidate> [--seen <name>]... [--gap <name>:<category>]...");
      process.exit(2);
    }
  } catch (e) {
    console.error(`autotriage: skills.mjs failed: ${e.message}`); process.exit(1);
  }
}
