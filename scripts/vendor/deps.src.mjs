// Entry for `npm run vendor`: bundles the runtime dependencies into deps.mjs, so an installed
// plugin runs without `npm install`. Re-run after changing a dependency version.
export { default as YAML } from "yaml";
export { default as Ajv } from "ajv";
