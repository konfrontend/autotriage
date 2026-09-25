// Profile helper for the setup skill. Deterministic parts of the wizard: which Profile files
// exist and validate, and a YAML skeleton built from a schema's defaults.
// CLI: node scripts/profile.mjs status
//      node scripts/profile.mjs skeleton <profile|skills|voice|past-job>
import fs from "node:fs";
import path from "node:path";
import { PLUGIN_ROOT, PROFILE_DIR, readArtifact, validate, listPastJobs } from "./lib.mjs";

function fileStatus(label, file, schema) {
  const art = readArtifact(file);
  if (!art) return `${label}: missing`;
  if (art.frontmatter === null) return `${label}: invalid\n    no YAML frontmatter`;
  const errors = validate(schema, art.frontmatter);
  return errors.length ? `${label}: invalid\n    ${errors.join("\n    ")}` : `${label}: ok`;
}

export function status() {
  const out = [];
  const profileFile = path.join(PROFILE_DIR, "profile.md");
  const voiceFile = path.join(PROFILE_DIR, "voice.md");
  const ledgerFile = path.join(PROFILE_DIR, "skills.md");
  out.push(fileStatus("data/profile/profile.md", profileFile, "profile"));
  out.push(fileStatus("data/profile/skills.md", ledgerFile, "skills"));
  out.push(fileStatus("data/profile/voice.md", voiceFile, "voice"));
  const jobs = listPastJobs();
  if (!jobs.length) out.push("data/profile/jobs/: no files");
  for (const f of jobs) out.push(fileStatus(`data/profile/jobs/${path.basename(f)}`, f, "past-job"));

  const profileOk = readArtifact(profileFile)?.frontmatter && validate("profile", readArtifact(profileFile).frontmatter).length === 0;
  const ledgerOk = readArtifact(ledgerFile)?.frontmatter && validate("skills", readArtifact(ledgerFile).frontmatter).length === 0;
  const jobOk = jobs.some((f) => readArtifact(f)?.frontmatter && validate("past-job", readArtifact(f).frontmatter).length === 0);
  const voiceOk = readArtifact(voiceFile)?.frontmatter && validate("voice", readArtifact(voiceFile).frontmatter).length === 0;
  out.push("", `triage gate (profile.md and skills.md valid): ${profileOk && ledgerOk ? "pass" : "fail"}`);
  out.push(`proposal gate (plus one valid past job and voice.md): ${profileOk && ledgerOk && jobOk && voiceOk ? "pass" : "fail"}`);
  return out.join("\n");
}

// YAML skeleton from a schema: defaults where the schema has them, typed placeholders elsewhere,
// a trailing comment naming required fields and enum choices.
export function skeleton(name) {
  const file = path.join(PLUGIN_ROOT, "scripts", "schemas", `${name}.schema.json`);
  if (!fs.existsSync(file)) throw new Error(`no schema ${name}; known: profile, skills, voice, past-job`);
  const schema = JSON.parse(fs.readFileSync(file, "utf8"));
  return emit(schema, 0, new Set()).join("\n");
}

function emit(schema, depth, required) {
  const pad = "  ".repeat(depth);
  const lines = [];
  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    const req = new Set(schema.required ?? []);
    const note = [];
    if (req.has(key)) note.push("required");
    if (prop.enum) note.push(`one of: ${prop.enum.join(" | ")}`);
    if (prop.items?.enum) note.push(`items one of: ${prop.items.enum.join(" | ")}`);
    if (prop.pattern) note.push(`pattern ${prop.pattern}`);
    const comment = note.length ? `  # ${note.join("; ")}` : "";
    if (prop.type === "object" && prop.properties) {
      lines.push(`${pad}${key}:${comment}`);
      lines.push(...emit(prop, depth + 1, req));
    } else if (prop.type === "array" && prop.items?.type === "object" && prop.items.properties) {
      lines.push(`${pad}${key}:${comment}`);
      const inner = emit(prop.items, depth + 2, new Set(prop.items.required ?? []));
      inner[0] = inner[0].replace(/^(\s*)  /, "$1- ");
      lines.push(...inner);
    } else {
      lines.push(`${pad}${key}: ${JSON.stringify(placeholder(prop))}${comment}`);
    }
  }
  return lines;
}

function placeholder(prop) {
  if (prop.default !== undefined) return prop.default;
  if (prop.enum) return prop.enum[0];
  switch (prop.type) {
    case "array": return [];
    case "number": case "integer": return 0;
    case "object": return {};
    default: return "";
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === "status") console.log(status());
    else if (cmd === "skeleton") console.log(skeleton(arg));
    else { console.error("usage: profile.mjs status | skeleton <profile|skills|voice|past-job>"); process.exit(2); }
  } catch (e) {
    console.error(`autotriage: profile.mjs failed: ${e.message}`); process.exit(1);
  }
}
