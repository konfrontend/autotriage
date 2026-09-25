// PostToolUse hook on Write|Edit: validate any artifact written under data/ against its schema.
// The write has already landed; a failing artifact returns the errors to the model so the State fixes
// it, and the next Guard refuses the file until it does.
import path from "node:path";
import { DATA, readArtifact, validate, schemaForPath } from "../lib.mjs";

const input = JSON.parse(await new Promise((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s || "{}")); }));
const file = input?.tool_input?.file_path;
if (!file || path.relative(DATA, path.resolve(file)).startsWith("..")) process.exit(0);
const schema = schemaForPath(file);
if (!schema) process.exit(0);
const art = readArtifact(file);
if (!art) process.exit(0);
const errors = art.frontmatter === null ? ["no YAML frontmatter"] : validate(schema, art.frontmatter);
if (errors.length) {
  console.log(JSON.stringify({ decision: "block", reason: `autotriage: ${file} does not match the ${schema} schema:\n  ${errors.join("\n  ")}\nFix the frontmatter before continuing.` }));
}
