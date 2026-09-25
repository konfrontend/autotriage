// Fixtures for the script half of verify: a clean audit Letter passes, a Letter seeded with one
// Finding per Check group reports each one with the Fix the catalogue names, and a Letter the
// segmentation cannot read stops on slot/parse. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { analyse, segment } from "./verify.mjs";
import { loadCatalogue } from "./lib.mjs";

// Headers and caps come from the Slot catalogue, so a wording or cap change there does not break
// the fixtures; the tests pin segmentation and counting, not the current catalogue values.
const slotCatalogue = loadCatalogue("templates/letter-slots");
const H = slotCatalogue.headers;
const cap = (id) => slotCatalogue.slots.find((s) => s.id === id).cap;

const profile = {
  word_cap: 350,
  terms: { rate: 60, rate_floor: 40, billing: "hourly-caps", subcontracting: "none", weekly_hours: { min: 0, max: 30 } },
};
const skills = [{ name: "TypeScript", level: "shipped" }, { name: "React", level: "shipped" }, { name: "Postgres", level: "used" }];
const voice = { language: "en-US", greeting: "Hi,", sign_off: "Kon", banned_extra: ["synergy"], allowed_extra: ["leverage"] };
const pastJobs = [{ frontmatter: { slug: "acme", stack: ["typescript"], public_name: "Acme" }, body: "- product: https://acme.example, B2B dashboard\n- built the RBAC admin and the SAML login" }];
const job = (family, flags = ["regulated-domain"], alert = 2) => ({
  frontmatter: { slug: "acme-audit", verdict: { family, flags, alert_level: alert } },
  body: "Client wants a HIPAA review of a PHI pipeline. Budget $2,000.",
});

const cleanAudit = `Hi,

As I understand it, you want a paid review of the pipeline before any build is priced, with PHI handling settled first.

${H.deliverables}
- Findings ranked by severity
- Map of what to keep, fix, or rebuild
- Effort and order for the next stage
- Assumptions and deferred items
If the review lands, the fixes continue from that list, each accepted against a written check.

${H.relevant_work}
Acme (https://acme.example), B2B dashboard, contractor since 2021. Built the RBAC admin and the SAML login.

${H.gaps}
No HIPAA project yet; the nearest work is the RBAC admin on Acme, so the PHI boundary comes first in the review.

${H.billing}
The review is capped at 20 hours, billed on actual hours; unused hours are not billed.

Madrid, Spain, six hours ahead of you, so my afternoon overlaps with your mornings; up to 30 hours a week.

Happy to answer whatever questions remain, here in Upwork Messages.

Kon`;

function run(body, family = "audit", { flags, alert, candidate = "2026-09-20-acme-audit", fm = {} } = {}) {
  const letter = { frontmatter: { slug: "acme-audit", family, date: "2026-09-20", outcome: null, ...fm }, body, raw: "" };
  return analyse({ candidate, letter, job: job(family, flags, alert), profile, skills, voice, pastJobs });
}
const ids = (r) => r.findings.map((f) => f.id);
const has = (r, id) => r.findings.some((f) => f.id === id);
const fixOf = (r, id) => r.findings.find((f) => f.id === id)?.fix;

test("clean audit Letter passes the script Checks", () => {
  const r = run(cleanAudit);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.slots.map((s) => s.id), ["hook", "deliverables", "follow_on", "relevant_work", "gaps", "billing", "terms", "closing", "sign_off"]);
  assert.equal(r.brief.mitigations[0].slot, "deliverables");
  assert.deepEqual(r.brief.shipped_skills, ["TypeScript", "React"], "the brief lists shipped Skills from the ledger");
});

test("voice: banned phrase, Profile extra, allowed extra, exclamation, plural, self-descriptive", () => {
  const body = cleanAudit
    .replace("Built the RBAC admin", "I'm excited to say we built the RBAC admin with synergy and leverage")
    .replace("here in Upwork Messages.", "here in Upwork Messages!")
    .replace("contractor since 2021", "senior contractor since 2021")
    .replace("and the SAML login.", "; the SAML login; the tests.");
  const r = run(body);
  assert.ok(has(r, "voice/semicolon-chain"), ids(r));
  assert.equal(fixOf(r, "voice/semicolon-chain"), "patch");
  assert.ok(has(r, "voice/banned-phrase"), ids(r));
  assert.ok(r.findings.some((f) => f.id === "voice/banned-phrase" && f.detail.includes("synergy")));
  assert.ok(!r.findings.some((f) => f.detail.includes('"leverage"')), "allowed_extra lifts the shared ban");
  assert.ok(has(r, "voice/exclamation"));
  assert.ok(has(r, "voice/first-person-plural"));
  assert.ok(has(r, "voice/self-descriptive"));
  assert.equal(fixOf(r, "voice/banned-phrase"), "patch");
  assert.ok(r.findings.every((f) => f.id !== "voice/first-person-plural" || f.slot === "relevant_work"));
});

test("voice: a quoted client phrase and the country US are not first-person plural", () => {
  const body = cleanAudit.replace("Built the RBAC admin", 'Built what the brief calls "our admin" for a US client');
  const r = run(body);
  assert.ok(!has(r, "voice/first-person-plural"), ids(r));
});

test("format: markdown, emoji, all-caps, indentation, contact, url count", () => {
  const body = cleanAudit
    .replace("Findings ranked by severity", "**Findings** ranked by SHOUTING severity")
    .replace("- Assumptions and deferred items", "  - Assumptions and deferred items 🚀")
    .replace("here in Upwork Messages.", "here in Upwork Messages or at kon@example.com, https://calendly.com/kon, https://a.example, http://b.example.");
  const r = run(body);
  assert.ok(has(r, "format/markdown"));
  assert.ok(has(r, "format/emoji"));
  assert.ok(r.findings.some((f) => f.id === "format/all-caps" && f.detail.includes("SHOUTING")));
  assert.ok(!r.findings.some((f) => f.id === "format/all-caps" && /RBAC|SAML|PHI|HIPAA/.test(f.detail)), "acronyms from the Profile, the Past Jobs, and the Job are allowed");
  assert.ok(has(r, "format/indentation"));
  assert.ok(r.findings.filter((f) => f.id === "format/contact").length >= 2);
  assert.ok(r.findings.some((f) => f.id === "format/url-count" && f.detail.includes("not https")));
  assert.equal(fixOf(r, "format/url-count"), "regenerate");
});

test("slot: a colon header in second person fails, a verbatim question keeps its pronouns", () => {
  const r = run(cleanAudit.replace(`${H.billing}\n`, `Your rate and availability:\nRate is 60 USD.\n\n${H.billing}\n`));
  assert.ok(r.findings.some((f) => f.id === "slot/header-second-person" && f.slot === "answers"), ids(r));
  const r2 = run(cleanAudit.replace(`${H.billing}\n`, `What is your rate?\nRate is 60 USD.\n\n${H.billing}\n`));
  assert.ok(!has(r2, "slot/header-second-person"), ids(r2));
});

test("slot: an ask header over a list is the plan Slot", () => {
  const r = run(cleanAudit.replace(`${H.deliverables}\n`, "What I would deliver:\n"));
  const plan = r.slots.find((s) => s.id === "deliverables");
  assert.ok(plan && plan.demand === "What I would deliver", JSON.stringify(r.slots.map((s) => s.id)));
  assert.ok(!has(r, "slot/missing"), ids(r));
});

test("slot: extra Slot, header-missing list, family and folder mismatch", () => {
  const body = cleanAudit
    .replace(`${H.deliverables}\n`, "")
    .replace(H.billing, `${H.working_model}\nRequests come in through Upwork Messages.\n\n${H.billing}`);
  const r = run(body, "audit", { candidate: "2026-09-21-other-slug", fm: { family: "audit" } });
  assert.ok(has(r, "slot/header-missing"), ids(r));
  assert.ok(r.findings.some((f) => f.id === "slot/extra" && f.slot === "working_model"));
  assert.equal(fixOf(r, "slot/extra"), "remove");
  assert.ok(r.findings.filter((f) => f.id === "slot/family-mismatch").length >= 2);
  const r2 = run(cleanAudit, "fix");
  assert.ok(r2.findings.some((f) => f.id === "slot/missing" && f.slot === "milestones"), ids(r2));
  assert.ok(r2.findings.some((f) => f.id === "slot/extra" && f.slot === "deliverables"));
  assert.ok(r2.findings.some((f) => f.id === "slot/extra" && f.slot === "follow_on"));
});

test("slot/parse stops: too few blocks, a header in the tail, an unheadered block after the hook", () => {
  const r = run("Hi,\n\nHook.\n\nKon");
  assert.ok(has(r, "slot/parse"));
  assert.equal(fixOf(r, "slot/parse"), "stop");
  const r2 = run(cleanAudit.replace("Madrid, Spain", `${H.billing}\nMadrid, Spain`));
  assert.ok(r2.findings.some((f) => f.id === "slot/parse" && f.detail.includes("terms")), ids(r2));
  const r4 = run(cleanAudit.replace("Madrid, Spain", "My current availability:\nMadrid, Spain"));
  assert.ok(!has(r4, "slot/parse"), ids(r4));
  assert.equal(r4.slots.find((s) => s.id === "terms").header, "My current availability:");
  const r5 = run(cleanAudit.replace(H.relevant_work, "Show me one or two business applications you personally built or maintained. What were you responsible for?"));
  assert.ok(!has(r5, "slot/parse"), ids(r5));
  assert.equal(r5.slots.find((s) => s.id === "answers").demand, "Show me one or two business applications you personally built or maintained. What were you responsible for");
  const r3 = run(cleanAudit.replace(`${H.deliverables}\n- Findings`, `Some prose without a header.\n\n${H.deliverables}\n- Findings`));
  assert.ok(r3.findings.some((f) => f.id === "slot/parse" && f.detail.includes("follows the hook")), ids(r3));
});

test("length: hook, prose cap, total ceiling, second list", () => {
  const longHook = "As I understand it, " + "you want the pipeline reviewed and every PHI touchpoint listed before a single line of the build is priced or planned, ".repeat(2);
  const filler = ("Another sentence of prose that says nothing new about the work. ").repeat(60);
  const body = cleanAudit
    .replace(/As I understand it.*\n/, longHook + "\n")
    .replace("Built the RBAC admin and the SAML login.", "Built the RBAC admin.\n\nGaps list:\n- one\n- two")
    .replace("No HIPAA project yet;", filler + " No HIPAA project yet;");
  const r = run(body);
  for (const id of ["length/hook", "length/prose-cap", "length/total-ceiling", "length/list-lines"]) assert.ok(has(r, id), `${id} missing in ${ids(r)}`);
  assert.ok(r.findings.some((f) => f.id === "length/list-lines" && f.detail.includes("second list")));
  assert.equal(fixOf(r, "length/hook"), "regenerate");
});

test("length: relevant_work at its cap passes, one Past Job over fails", () => {
  const n = cap("relevant_work").paragraphs;
  const withPastJobs = (count) => cleanAudit.replace("Acme (https://acme.example), B2B dashboard, contractor since 2021. Built the RBAC admin and the SAML login.",
    Array.from({ length: count }, (_, i) => `Acme product ${i + 1} (https://acme.example/${i + 1}). Built the RBAC admin.`).join("\n\n"));
  const atCap = run(withPastJobs(n));
  assert.ok(!has(atCap, "length/relevant-work-count"), ids(atCap));
  const over = run(withPastJobs(n + 1));
  assert.ok(over.findings.some((f) => f.id === "length/relevant-work-count" && f.detail.includes(`cap ${n}`)), ids(over));
});

test("length: a plan list at its cap passes, one line over fails", () => {
  const n = cap("deliverables").lines;
  const withLines = (count) => cleanAudit.replace("- Findings ranked by severity\n- Map of what to keep, fix, or rebuild\n- Effort and order for the next stage\n- Assumptions and deferred items",
    Array.from({ length: count }, (_, i) => `- Artifact ${i + 1}`).join("\n"));
  const atCap = run(withLines(n));
  assert.ok(!has(atCap, "length/list-lines"), ids(atCap));
  const over = run(withLines(n + 1));
  assert.ok(over.findings.some((f) => f.id === "length/list-lines" && f.slot === "deliverables" && f.detail.includes(`cap ${n}`)), ids(over));
});

test("terms and closing patterns: hour range, bounded window, call", () => {
  const body = cleanAudit
    .replace("so my afternoon overlaps with your mornings; up to 30 hours a week.", "reachable 08:00 to 21:00 CET, 20 to 30 hours a week, available now and through the next 90 days.")
    .replace("Happy to answer whatever questions remain, here in Upwork Messages.", "Happy to walk through the Acme admin on a call.");
  const r = run(body);
  assert.ok(has(r, "terms/hour-range"), ids(r));
  assert.ok(has(r, "terms/bounded-window"));
  assert.ok(has(r, "closing/call"));
  assert.equal(fixOf(r, "closing/call"), "patch");
});

test("answers paragraphs are excluded from prose but counted in total; when-job-asks Slots are reported", () => {
  const body = cleanAudit.replace(H.billing, `${H.stack}\nReact and TypeScript, because the client already runs them.\n\nSubcontracting:\nNone. All work is mine.\n\n${H.billing}`);
  const r = run(body);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.brief.job_asks_present, ["stack"]);
  const answers = r.slots.find((s) => s.id === "answers");
  assert.equal(answers.demand, "Subcontracting");
  assert.equal(r.counts.words - r.counts.prose_words, 7 /* five header lines */ + 1 /* "Subcontracting:" */ + 5 /* "None. All work is mine." */ + 23 /* four list lines */);
});

test("segment reads the milestones Family without a follow_on", () => {
  const fix = cleanAudit
    .replace(`${H.deliverables}\n- Findings ranked by severity\n- Map of what to keep, fix, or rebuild\n- Effort and order for the next stage\n- Assumptions and deferred items\nIf the review lands, the fixes continue from that list, each accepted against a written check.`,
      `${H.milestones}\n1. Audit, 8 to 12 hours, read-only, findings ranked by severity.\n2. Access control, 10 to 20 hours.\n3. Tests, 8 to 12 hours.`);
  const seg = segment(fix, { headers: H, planSlot: "milestones" });
  assert.deepEqual(seg.errors, []);
  assert.deepEqual(seg.slots.map((s) => s.id), ["hook", "milestones", "relevant_work", "gaps", "billing", "terms", "closing", "sign_off"]);
  const r = run(fix, "fix");
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
});
