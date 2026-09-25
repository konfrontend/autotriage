// Script half of the verify State (catalogue/verify.md). Segments the plain-text Letter into Slots
// and runs every Check marked `by: script`; the model Checks, the Fixes, and the cycles are the
// skill's job. Prints Findings, the Slot map with line numbers, the counts, and the brief the model
// pass reads (Mitigations to look for, `when: job asks` Slots present, Profile terms, shipped Skills).
// CLI: node scripts/verify.mjs <candidate> [--json]
//   exit 0 when no script Check fails, 1 when one does, 2 on usage or a missing input.
import fs from "node:fs";
import path from "node:path";
import { readArtifact, readLedger, loadCatalogue, candidateDir, listPastJobs, PLUGIN_ROOT, PROFILE_DIR } from "./lib.mjs";

const LIST_LINE = /^(?:-|\d+[.)])\s/;
const URL_RE = /https?:\/\/[^\s)>\]]+/g;
const ACRONYM = /\b[A-Z][A-Z0-9]{2,}(?=s?\b)/g;
// English and business abbreviations that are not shouting; the Profile, the Past Jobs, and the Job add theirs.
const COMMON_ACRONYMS = ["URL", "API", "CLI", "SDK", "UI", "UX", "CI", "CD", "PDF", "CSV", "HTML", "CSS", "SQL", "HTTP", "HTTPS", "JSON", "XML", "REST", "MVP", "CTO", "CEO", "COO", "CFO", "NDA", "USD", "EUR", "GBP", "CET", "CEST", "PST", "PDT", "EST", "EDT", "UTC", "GMT", "BST", "IST", "AEST", "FAQ", "SEO", "CMS", "CRM", "ERP", "SaaS", "SLA", "SSO", "RBAC", "IAM", "AWS", "GCP", "VPS", "DNS", "TLS", "SSL", "VPN", "SSH", "GDPR", "HIPAA", "PHI", "PII", "BAA", "DPA", "PCI", "FERPA", "COPPA", "CCPA", "WCAG", "SOC", "ISO", "ADR", "PRD", "QA", "IDE", "OAuth", "JWT", "ORM", "NPM", "IOS", "MCP", "LLM", "RAG", "AI", "ML"].map((s) => s.toUpperCase());
const CONTACT_DOMAINS = /\b(?:t\.me|wa\.me|calendly\.com|cal\.com|linkedin\.com|twitter\.com|x\.com|instagram\.com|facebook\.com|discord\.gg|zoom\.us|meet\.google\.com|skype\.com|telegram\.(?:me|org)|whatsapp\.com|signal\.me)\b/i;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const HANDLE = /(?:^|[\s(])@[A-Za-z0-9_]{2,}/;
const PHONE = /(?:\+|\b)\d[\d\s().-]{7,}\d\b/;
const EMOJI = /\p{Extended_Pictographic}/u;
const SELF_WORDS = /\b(?:senior|expert|experienced|seasoned|veteran|lead (?:developer|engineer|dev|architect|front-?end|back-?end|full-?stack))\b/i;
const WE = /\b(we|our|ours|us)\b/gi;

export function loadInputs(candidate) {
  const dir = candidateDir(candidate);
  if (!dir || !fs.existsSync(dir)) throw new Error(`no Candidate folder for "${candidate}"`);
  const letter = readArtifact(path.join(dir, "letter.md"));
  const job = readArtifact(path.join(dir, "job.md"));
  if (!letter || !job) throw new Error(`data/candidates/${candidate} lacks letter.md or job.md`);
  const profile = readArtifact(path.join(PROFILE_DIR, "profile.md"))?.frontmatter ?? {};
  const voice = readArtifact(path.join(PROFILE_DIR, "voice.md"))?.frontmatter ?? {};
  const pastJobs = listPastJobs().map((f) => readArtifact(f));
  const skills = readLedger()?.frontmatter?.skills ?? [];
  return { candidate, letter, job, profile, skills, voice, pastJobs };
}

function loadCatalogues(family) {
  const verify = loadCatalogue("verify");
  const voiceRules = loadCatalogue("voice");
  const slots = readArtifact(path.join(PLUGIN_ROOT, "catalogue", "templates", "letter-slots.md")).frontmatter;
  const flags = loadCatalogue("flags");
  const templateFile = path.join(PLUGIN_ROOT, "catalogue", "templates", `letter-${family}.md`);
  const template = fs.existsSync(templateFile) ? readArtifact(templateFile).frontmatter : null;
  return { verify, voiceRules, slots, flags, template };
}

// A catalogue number the script needs; a missing one is a catalogue bug, never a silent default.
function required(value, key) {
  if (typeof value !== "number") throw new Error(`catalogue value ${key} is missing or not a number`);
  return value;
}
function slotCap(slots, id) {
  const cap = slots.slots.find((s) => s.id === id)?.cap;
  if (!cap) throw new Error(`catalogue value letter-slots ${id}.cap is missing`);
  return cap;
}

function words(text) {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function isHeader(line) {
  if (/https?:\/\//.test(line)) return false;
  return (/:\s*$/.test(line) && words(line) <= 12) || /\?\s*$/.test(line);
}

// Blocks are runs of non-blank lines; line numbers are 1-based within the Letter body.
function toBlocks(body) {
  const lines = body.replace(/\r/g, "").split("\n");
  const blocks = [];
  let cur = null;
  lines.forEach((raw, i) => {
    if (raw.trim() === "") { cur = null; return; }
    if (!cur) { cur = { start: i + 1, end: i + 1, lines: [] }; blocks.push(cur); }
    cur.end = i + 1;
    cur.lines.push(raw);
  });
  return { lines, blocks };
}

// Deterministic segmentation per "Finding Slots in plain text" in catalogue/verify.md.
export function segment(body, { headers, planSlot }) {
  const { lines, blocks } = toBlocks(body);
  const errors = [];
  const slots = [];
  const headerMap = new Map(Object.entries(headers).filter(([, h]) => h).map(([id, h]) => [h.trim().toLowerCase(), id]));
  const push = (slot) => { slots.push(slot); return slot; };
  const mk = (id, block, { header = null, contentLines = block.lines, start = block.start } = {}) =>
    ({ id, header, demand: null, paragraphs: [{ start, end: block.end, lines: contentLines }], headerLine: header ? block.start : null });

  if (blocks.length < 6) {
    errors.push(`too few blocks (${blocks.length}); a Letter has at least greeting, hook, the plan Slot, terms, closing, sign-off`);
    return { lines, blocks, slots, greeting: blocks[0] ?? null, errors };
  }
  const greeting = blocks[0];
  if (greeting.lines.length > 1) errors.push(`block 1 (lines ${greeting.start}-${greeting.end}) is the greeting and must be one line`);
  if (isHeader(greeting.lines[0])) errors.push(`line ${greeting.start} is the greeting and opens with a header`);
  const hookBlock = blocks[1];
  if (isHeader(hookBlock.lines[0])) errors.push(`block 2 (line ${hookBlock.start}) is the hook and opens with a header`);
  push(mk("hook", hookBlock));

  const tail = blocks.slice(-3);
  const middle = blocks.slice(2, -3);
  let current = null;
  for (const b of middle) {
    const first = b.lines[0];
    if (isHeader(first)) {
      const key = first.trim().toLowerCase();
      let id = headerMap.get(key) ?? "answers";
      // an ask header over a list is the plan Slot answering that ask (Slot catalogue, Ask headers)
      if (id === "answers" && b.lines.length > 1 && LIST_LINE.test(b.lines[1]) && !slots.some((s) => s.id === planSlot)) id = planSlot;
      if (id !== "answers" && slots.some((s) => s.id === id)) errors.push(`Slot ${id} appears twice (second header on line ${b.start})`);
      if (b.lines.length === 1) errors.push(`header "${first.trim()}" on line ${b.start} has no content under it`);
      const slot = push(mk(id, b, { header: first.trim(), contentLines: b.lines.slice(1), start: b.start + 1 }));
      if (!headerMap.has(key)) slot.demand = first.trim().replace(/[:?]\s*$/, "");
      current = slot;
    } else if (LIST_LINE.test(first)) {
      // a list without its header: the plan Slot lost its header line
      const slot = push(mk(planSlot, b));
      slot.headerMissing = true;
      current = slot;
    } else if (!current) {
      errors.push(`block at lines ${b.start}-${b.end} has no header and follows the hook directly`);
    } else if (current.id === "deliverables" || current.id === "milestones" || current.id === "working_model") {
      // prose after the plan block: follow_on (audit); slot/extra reports it for other Families
      current = push(mk("follow_on", b));
    } else {
      current.paragraphs.push({ start: b.start, end: b.end, lines: b.lines });
    }
  }
  // trailing prose lines inside a list block are follow_on too (no blank line before them)
  for (const slot of [...slots]) {
    if (slot.id !== "deliverables" && slot.id !== "milestones") continue;
    const p = slot.paragraphs[0];
    let lastList = -1;
    p.lines.forEach((l, i) => { if (LIST_LINE.test(l)) lastList = i; });
    if (lastList >= 0 && lastList < p.lines.length - 1) {
      const tailLines = p.lines.slice(lastList + 1);
      const start = p.start + lastList + 1;
      p.lines = p.lines.slice(0, lastList + 1);
      p.end = start - 1;
      const at = slots.indexOf(slot);
      slots.splice(at + 1, 0, { id: "follow_on", header: null, demand: null, headerLine: null, paragraphs: [{ start, end: p.end + tailLines.length, lines: tailLines }] });
    }
  }
  const tailIds = ["terms", "closing", "sign_off"];
  tail.forEach((b, i) => {
    const first = b.lines[0];
    if (isHeader(first)) {
      // terms may carry the availability ask as its header; a catalogue header there is a Slot out of place
      if (i === 0 && !headerMap.has(first.trim().toLowerCase()) && b.lines.length > 1) {
        push(mk("terms", b, { header: first.trim(), contentLines: b.lines.slice(1), start: b.start + 1 }));
        return;
      }
      errors.push(`block at line ${b.start} opens with a header where ${tailIds[i]} is expected`);
    }
    push(mk(tailIds[i], b));
  });
  const signOff = slots.find((s) => s.id === "sign_off");
  if (signOff && signOff.paragraphs[0].lines.length > 1) errors.push(`sign-off (lines ${signOff.paragraphs[0].start}-${signOff.paragraphs[0].end}) must be one line`);
  for (const s of slots) s.text = s.paragraphs.map((p) => p.lines.join("\n")).join("\n\n");
  return { lines, blocks, slots, greeting, errors };
}

function lineOwner(seg) {
  const owner = new Map();
  if (seg.greeting) for (let l = seg.greeting.start; l <= seg.greeting.end; l++) owner.set(l, "greeting");
  for (const s of seg.slots) {
    if (s.headerLine) owner.set(s.headerLine, s.id);
    for (const p of s.paragraphs) for (let l = p.start; l <= p.end; l++) owner.set(l, s.id);
  }
  return (l) => owner.get(l) ?? "?";
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function phraseRe(p) {
  const a = /^\w/.test(p) ? "\\b" : "", z = /\w$/.test(p) ? "\\b" : "";
  return new RegExp(`${a}${escapeRe(p)}${z}`, "i");
}
function stripQuotes(line) { return line.replace(/"[^"]*"|“[^”]*”/g, " "); }

export function analyse({ candidate, letter, job, profile, skills = [], voice, pastJobs }) {
  const family = letter.frontmatter?.family;
  const cat = loadCatalogues(family);
  const checkMeta = new Map(cat.verify.checks.map((c) => [c.id, c]));
  const findings = [];
  const add = (id, slot, detail) => {
    const meta = checkMeta.get(id) ?? { severity: "fail", fix: "none" };
    findings.push({ id, severity: meta.severity, fix: meta.fix, slot, detail });
  };

  const body = letter.body.replace(/\s+$/, "");
  const planSlot = cat.slots.plan_slot[family];
  const seg = segment(body, { headers: cat.slots.headers, planSlot });
  const own = lineOwner(seg);
  const lines = seg.lines;
  const at = (l) => `line ${l}`;

  // slot/parse and slot/family-mismatch stop the run; everything else still reports so the human sees it all
  for (const e of seg.errors) add("slot/parse", "letter", e);
  if (!cat.template) add("slot/parse", "letter", `no Family template for "${family}"`);
  const v = job.frontmatter?.verdict ?? {};
  if (v.family && v.family !== family) add("slot/family-mismatch", "letter", `letter.md family ${family}, job.md verdict.family ${v.family}`);
  const m = /^(\d{4}-\d{2}-\d{2})-(.+)$/.exec(candidate ?? "");
  if (m && letter.frontmatter?.slug !== m[2]) add("slot/family-mismatch", "letter", `letter.md slug ${letter.frontmatter?.slug}, folder slug ${m[2]}`);
  if (m && letter.frontmatter?.date !== m[1]) add("slot/family-mismatch", "letter", `letter.md date ${letter.frontmatter?.date}, folder date ${m[1]}`);

  const templateSlots = (cat.template?.slots ?? []).map((s) => (typeof s === "string" ? { id: s } : s));
  const templateIds = new Set(templateSlots.map((s) => s.id));
  const jobAsks = new Set(templateSlots.filter((s) => s.when === "job asks").map((s) => s.id));
  const present = new Set(seg.slots.map((s) => s.id));

  // slot
  if (planSlot && !present.has(planSlot)) add("slot/missing", planSlot, `the ${family} plan Slot "${cat.slots.headers[planSlot]}" is absent (or its header line is missing)`);
  for (const s of seg.slots) {
    if (s.headerMissing) add("slot/header-missing", s.id, `list at ${at(s.paragraphs[0].start)} opens without "${cat.slots.headers[s.id]}"`);
    if (s.header && s.header.endsWith(":") && /\byou(?:r|'ve|'re|rs)?\b/i.test(s.header)) add("slot/header-second-person", s.id, `header "${s.header}" addresses the reader; reword in first person`);
    if (!templateIds.has(s.id)) add("slot/extra", s.id, `${s.id} at ${at(s.paragraphs[0].start)} is not in the ${family} template`);
  }

  // voice
  const banned = [...(cat.voiceRules.banned ?? []), ...(voice.banned_extra ?? [])].filter((p) => !(voice.allowed_extra ?? []).some((a) => a.toLowerCase() === p.toLowerCase()));
  lines.forEach((line, i) => {
    const n = i + 1, slot = own(n);
    for (const p of banned) if (phraseRe(p).test(line)) add("voice/banned-phrase", slot, `"${p}" at ${at(n)}`);
    for (const w of cat.voiceRules.soft_banned ?? []) if (phraseRe(w).test(line)) add("voice/soft-banned", slot, `"${w}" at ${at(n)}`);
    if (line.includes("!")) add("voice/exclamation", slot, at(n));
    if ((line.match(/;/g) ?? []).length >= 2) add("voice/semicolon-chain", slot, `${(line.match(/;/g) ?? []).length} semicolons at ${at(n)}`);
    const unquoted = stripQuotes(line);
    for (const hit of unquoted.matchAll(WE)) if (hit[1] !== "US") add("voice/first-person-plural", slot, `"${hit[1]}" at ${at(n)}`);
    const self = SELF_WORDS.exec(unquoted);
    if (self) add("voice/self-descriptive", slot, `"${self[0]}" at ${at(n)}`);
  });

  // format
  const acronyms = new Set(COMMON_ACRONYMS);
  const harvest = (text) => { for (const t of String(text ?? "").matchAll(ACRONYM)) acronyms.add(t[0]); };
  for (const s of skills) harvest(s.name);
  harvest(job.body);
  for (const pj of pastJobs) { harvest(pj.body); harvest((pj.frontmatter?.stack ?? []).join(" ").toUpperCase()); harvest(pj.frontmatter?.public_name); }
  const urls = [];
  lines.forEach((line, i) => {
    const n = i + 1, slot = own(n);
    const noUrl = line.replace(URL_RE, " ");
    if (/\*\*/.test(noUrl) || /(^|\s)\*\S/.test(noUrl) || /(^|\s)_\S[^_]*\S_(\s|$)/.test(noUrl) || /^#/.test(line) || /\[[^\]]+\]\([^)]+\)/.test(line) || /^>/.test(line) || /`/.test(line)) add("format/markdown", slot, at(n));
    if (EMOJI.test(line)) add("format/emoji", slot, at(n));
    for (const t of noUrl.matchAll(ACRONYM)) if (!acronyms.has(t[0])) add("format/all-caps", slot, `"${t[0]}" at ${at(n)}`);
    if (/^[ \t]/.test(line)) add("format/indentation", slot, at(n));
    if (EMAIL.test(noUrl)) add("format/contact", slot, `email at ${at(n)}`);
    if (HANDLE.test(noUrl)) add("format/contact", slot, `handle at ${at(n)}`);
    const phone = PHONE.exec(noUrl);
    if (phone && phone[0].replace(/\D/g, "").length >= 9) add("format/contact", slot, `phone number at ${at(n)}`);
    if (CONTACT_DOMAINS.test(line)) add("format/contact", slot, `messenger, social, or booking link at ${at(n)}`);
    for (const u of line.match(URL_RE) ?? []) urls.push({ url: u, line: n, slot });
    if (/\bwww\.[^\s]+/.test(noUrl)) add("format/url-count", slot, `bare www address at ${at(n)}; only https:// URLs`);
  });
  for (const u of urls) if (!u.url.startsWith("https://")) add("format/url-count", u.slot, `${u.url} at ${at(u.line)} is not https://`);
  if (urls.length) add("format/url-list", "letter", `${urls.length} URLs: ${urls.map((u) => u.url).join(" ")}`);
  if (body.length > cat.verify.char_ceiling) add("format/char-ceiling", "letter", `${body.length} characters, ceiling ${cat.verify.char_ceiling}`);

  // length
  const hook = seg.slots.find((s) => s.id === "hook");
  const hookChars = hook ? hook.text.length : 0;
  const hookMax = required(slotCap(cat.slots, "hook").chars, "letter-slots hook.cap.chars");
  if (hookChars > hookMax) add("length/hook", "hook", `${hookChars} characters, cap ${hookMax}`);
  const wordCap = profile.word_cap ?? required(cat.voiceRules.prose_word_cap_default, "voice prose_word_cap_default");
  const ceiling = required(cat.voiceRules.total_word_ceiling, "voice total_word_ceiling");
  let prose = 0, total = 0;
  const perSlot = {};
  lines.forEach((line, i) => {
    const n = i + 1, slot = own(n);
    const w = words(line);
    total += w;
    perSlot[slot] = (perSlot[slot] ?? 0) + w;
    const s = seg.slots.find((x) => x.id === slot);
    const isHeaderLine = s?.headerLine === n;
    if (!isHeaderLine && !LIST_LINE.test(line) && slot !== "answers") prose += w;
  });
  if (prose > wordCap) add("length/prose-cap", "letter", `${prose} prose words, Profile word_cap ${wordCap}`);
  if (total > ceiling) add("length/total-ceiling", "letter", `${total} words, ceiling ${ceiling}`);
  const listRuns = [];
  let run = null;
  lines.forEach((line, i) => {
    if (LIST_LINE.test(line)) { if (!run) { run = { start: i + 1, count: 0, slot: own(i + 1) }; listRuns.push(run); } run.count++; } else run = null;
  });
  if (listRuns.length > 1) add("length/list-lines", listRuns[1].slot, `a second list starts at ${at(listRuns[1].start)}; one list per Letter`);
  for (const r of listRuns) {
    if (r.slot !== "deliverables" && r.slot !== "milestones") continue;
    const cap = required(slotCap(cat.slots, r.slot).lines, `letter-slots ${r.slot}.cap.lines`);
    if (r.count > cap) add("length/list-lines", r.slot, `${r.count} list lines, cap ${cap}`);
  }
  const rw = seg.slots.find((s) => s.id === "relevant_work");
  const rwCap = required(slotCap(cat.slots, "relevant_work").paragraphs, "letter-slots relevant_work.cap.paragraphs");
  if (rw && rw.paragraphs.length > rwCap) add("length/relevant-work-count", "relevant_work", `${rw.paragraphs.length} paragraphs, cap ${rwCap}`);

  // terms and closing patterns the voice rules forbid (hour ranges, bounded windows, calls)
  const terms = seg.slots.find((s) => s.id === "terms");
  if (terms) {
    if (/\b\d{1,2}:\d{2}\b|\b\d{1,2}\s?(?:am|pm)\b/i.test(terms.text)) add("terms/hour-range", "terms", "a clock time; state overlap as the client's part of the day");
    if (/\b(?:through|for|over) the next\b|\buntil\b|\bthrough (?:january|february|march|april|may|june|july|august|september|october|november|december|\d)/i.test(terms.text)) add("terms/bounded-window", "terms", "a bounded availability window; say available now or from a date");
  }
  const closing = seg.slots.find((s) => s.id === "closing");
  if (closing && /\b(?:call|walk ?through|walk you through|screen ?share|zoom|google meet|video|demo)\b/i.test(closing.text)) add("closing/call", "closing", "offers a call or a walkthrough; questions are answered in writing through Upwork Messages");

  // brief for the model pass
  const flagById = new Map(cat.flags.flags.map((f) => [f.id, f]));
  const mitigations = (v.flags ?? []).map((id) => flagById.get(id)).filter((f) => f && (!f.kind || f.kind === "risk") && f.slot && f.slot !== "none")
    .map((f) => ({ id: f.id, level: f.level, slot: f.slot === "plan" ? planSlot : f.slot, mitigation: f.mitigation }));
  const counts = { chars: body.length, words: total, prose_words: prose, word_cap: wordCap, total_ceiling: ceiling, hook_chars: hookChars, hook_max: hookMax, urls: urls.length, lists: listRuns.length, per_slot: perSlot };
  const brief = {
    family, plan_slot: planSlot, alert_level: v.alert_level ?? null, mitigations,
    job_asks_present: seg.slots.filter((s) => jobAsks.has(s.id)).map((s) => s.id),
    template_slots: templateSlots, terms: profile.terms ?? {}, past_jobs: pastJobs.map((p) => p.frontmatter?.slug).filter(Boolean),
    mandatory_keyword: (v.flags ?? []).includes("mandatory-keyword"),
    shipped_skills: skills.filter((s) => s.level === "shipped").map((s) => s.name),
  };
  const slots = seg.slots.map((s) => ({ id: s.id, header: s.header, demand: s.demand, header_line: s.headerLine, paragraphs: s.paragraphs.map((p) => [p.start, p.end]), words: words(s.text), chars: s.text.length }));
  const order = { fail: 0, warn: 1 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { findings, slots, counts, brief, fails: findings.filter((f) => f.severity === "fail").length, warns: findings.filter((f) => f.severity === "warn").length };
}

export function render(r, frontmatterLines) {
  const off = frontmatterLines ?? 0;
  const out = [];
  out.push(`script: ${r.fails} fail, ${r.warns} warn (line numbers count from the start of the file; the Letter body starts on line ${off + 1})`);
  for (const f of r.findings) out.push(`  ${f.severity} ${f.id} [${f.slot}] ${f.detail.replace(/line (\d+)/g, (_, n) => `line ${Number(n) + off}`)} -> ${f.fix}`);
  out.push("", "slots:");
  for (const s of r.slots) {
    const range = s.paragraphs.map(([a, b]) => (a === b ? `${a + off}` : `${a + off}-${b + off}`)).join(", ");
    out.push(`  ${s.id}${s.demand ? ` (${s.demand})` : ""}: lines ${range}${s.header_line ? `, header line ${s.header_line + off}` : ""}, ${s.words} words${s.id === "hook" ? `, ${s.chars} chars` : ""}`);
  }
  const c = r.counts;
  out.push("", `counts: ${c.chars} chars, ${c.words} words (ceiling ${c.total_ceiling}), ${c.prose_words} prose words (cap ${c.word_cap}), hook ${c.hook_chars}/${c.hook_max} chars, ${c.urls} URLs, ${c.lists} list${c.lists === 1 ? "" : "s"}`);
  const b = r.brief;
  out.push("", `brief: family ${b.family}, plan Slot ${b.plan_slot}, Alert Level ${b.alert_level ?? "?"}`);
  out.push(`  mitigations to find (${b.mitigations.length}):`);
  for (const mit of b.mitigations) out.push(`    ${mit.id} (level ${mit.level}) in ${mit.slot}: ${mit.mitigation}`);
  out.push(`  when-job-asks Slots present: ${b.job_asks_present.join(", ") || "none"}`);
  out.push(`  mandatory-keyword Flag: ${b.mandatory_keyword ? "triggered, the keyword must appear nowhere in the Letter" : "no"}`);
  out.push(`  Profile terms: ${JSON.stringify(b.terms)}`);
  out.push(`  Past Jobs: ${b.past_jobs.join(", ")}`);
  out.push(`  Profile shipped Skills: ${b.shipped_skills.join(", ")}`);
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const candidate = args.find((a) => !a.startsWith("--"));
  if (!candidate) { console.error("usage: verify.mjs <candidate> [--json]"); process.exit(2); }
  let inputs;
  try { inputs = loadInputs(candidate); } catch (e) { console.error(`autotriage: verify script: ${e.message}`); process.exit(2); }
  const r = analyse(inputs);
  const fmLines = inputs.letter.raw === null ? 0 : inputs.letter.raw.split("\n").length + 2;
  console.log(json ? JSON.stringify({ ...r, frontmatter_lines: fmLines }, null, 2) : render(r, fmLines));
  process.exit(r.fails ? 1 : 0);
}
