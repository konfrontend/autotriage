// Where the plugin and the data live. The data is `data/` of the project the session runs in (ADR 0004).
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd(), "data");
export const PROFILE_DIR = path.join(DATA, "profile");
export const CANDIDATES_DIR = path.join(DATA, "candidates");
