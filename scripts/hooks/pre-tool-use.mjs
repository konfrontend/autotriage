// PreToolUse hook on the Skill tool: deny an autotriage State whose guard fails.
// The injected guard line in SKILL.md is the first layer; this catches model-initiated calls.
import { guard } from "../guard.mjs";
import { Refusal } from "../lib.mjs";

const input = JSON.parse(await new Promise((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s || "{}")); }));
const skill = input?.tool_input?.skill ?? "";
const m = /^autotriage:([a-z]+)$/.exec(skill);
if (!m) process.exit(0);
const candidate = (input.tool_input.args ?? "").trim().split(/\s+/)[0] || undefined;
const deny = (reason) => console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
try {
  guard(m[1], candidate);
} catch (e) {
  deny(e instanceof Refusal ? e.message : `autotriage: guard crashed: ${e.message}`);
}
