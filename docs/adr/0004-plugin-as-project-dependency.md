---
status: accepted
---

# The plugin is a dependency of the project; the data lives in that project

A freelancer installs autotriage into a project of their own, at project scope, from this repo acting as its own marketplace (`konfrontend`). The Profile and the Candidates live in `data/` of that project, which `setup` creates. The plugin repo holds no data. The Guard, the hooks, and the scripts resolve `data/` from the project directory (`CLAUDE_PROJECT_DIR`, else the working directory), so the session must start at the project root.

We chose the project over `${CLAUDE_PLUGIN_DATA}` or a fixed home directory because the Profile and the Letters are Markdown the freelancer reads and edits by hand, and a project can version them in its own git. A hidden per-plugin directory works from any directory, but its content is out of sight and out of version control.

Two consequences follow from installing through a marketplace:

- **The runtime dependencies are vendored.** An installed plugin runs from Claude Code's plugin cache. Claude Code 2.1 was seen running `npm install` there on install, but that step is undocumented, so the plugin does not rely on it. `ajv` and `yaml` are bundled into the committed `scripts/vendor/deps.mjs` with `npm run vendor`; npm is needed only to develop the plugin.
- **The permission rules live in the project.** A plugin cannot ship `permissions.allow` rules. `setup` offers to merge the script and `data/**` rules into the project's `.claude/settings.json`.

## Considered options

- `${CLAUDE_PLUGIN_DATA}` or `~/.autotriage/`: works from any directory, survives plugin updates; data hidden and unversioned; rejected.
- Plugin loaded in place from the project (`.claude/skills/autotriage/`, the layout before this decision): no install step, but the plugin source and the private data share one repo, which is how private data leaked into a public repo; rejected.
- Install `node_modules` into `${CLAUDE_PLUGIN_DATA}` from a `SessionStart` hook: no generated file in git, but the scripts the model runs through Bash do not receive that variable, and ESM ignores `NODE_PATH`; rejected.
- Commit `node_modules`: no build step, but hundreds of files and an unreviewable diff on every upgrade; rejected.
