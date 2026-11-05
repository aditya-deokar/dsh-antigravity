/**
 * Pure model-catalog helpers.
 *
 * Keeping these functions free of DSH imports makes the public-ID mapping,
 * enable-list migration, and version rules unit-testable without booting the
 * harness.
 */

/** Canonical reasoning-effort order used by the picker. */
export const EFFORT_ORDER = ["minimal", "low", "medium", "high", "xhigh"];

/**
 * Runtime aliases where the backend uses a name that does not share the
 * public model family prefix.
 */
const RUNTIME_ALIASES = new Map([
  ["gemini-pro-agent", "gemini-3.1-pro"],
  ["gemini-3-flash-agent", "gemini-3.5-flash"],
]);

const EFFORT_SUFFIX = /-(?:extra-low|minimal|low|medium|high|xhigh|thinking|tiered)$/i;

/**
 * Convert a backend runtime id (for example `claude-opus-5-5-medium`) into
 * the public model id shown in the picker (`claude-opus-5-5`).
 *
 * @param {unknown} modelId
 * @returns {string}
 */
export function canonicalizeRuntimeModelId(modelId) {
  let value = String(modelId ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/\([^)]*\)$/g, "")
    .replace(/-+$/g, "");
  if (RUNTIME_ALIASES.has(value)) return RUNTIME_ALIASES.get(value);

  // Strip at most a few suffixes so `gemini-3.7-flash-tiered` and
  // `gemini-3.7-flash-high` both collapse to the same family.
  for (let index = 0; index < 3; index += 1) {
    const next = value.replace(EFFORT_SUFFIX, "");
    if (next === value) break;
    value = next;
  }
  return value;
}

/**
 * Return the reasoning effort encoded in a runtime id, or `undefined` when
 * the id is the base variant or is a tiered variant that accepts all levels.
 *
 * @param {unknown} modelId
 * @returns {string | undefined}
 */
export function effortOfRuntimeModelId(modelId) {
  const value = String(modelId ?? "").toLowerCase();
  if (/-extra-low$/.test(value)) return "minimal";
  if (/-minimal$/.test(value)) return "minimal";
  if (/-low$/.test(value)) return "low";
  if (/-medium$/.test(value)) return "medium";
  if (/-high$/.test(value)) return "high";
  if (/-xhigh$/.test(value)) return "xhigh";
  if (/-thinking$/.test(value)) return "high";
  return undefined;
}

/**
 * Whether a runtime id advertises a tiered/thinking control that accepts all
 * effort levels rather than exposing one level per runtime id.
 *
 * @param {unknown} modelId
 * @returns {boolean}
 */
export function isTieredRuntimeModelId(modelId) {
  return /-(?:tiered|thinking)$/i.test(String(modelId ?? ""));
}

/**
 * Sort effort ids by the canonical order and drop duplicates.
 *
 * @param {Iterable<string>} efforts
 * @returns {string[]}
 */
export function sortEfforts(efforts) {
  const seen = new Set(efforts);
  return EFFORT_ORDER.filter((effort) => seen.has(effort));
}

/**
 * Merge the persisted enabled list with a freshly discovered catalog.
 *
 * Rules:
 * - models still present and previously enabled stay enabled;
 * - brand-new models are enabled by default unless the user explicitly
 *   disabled them in an earlier catalog;
 * - models the backend no longer advertises are dropped.
 *
 * @param {object} input
 * @param {Iterable<string>} input.previousCatalogIds
 * @param {Iterable<string>} input.nextCatalogIds
 * @param {Iterable<string>} input.currentEnabled
 * @param {Iterable<string>} [input.explicitlyDisabled]
 * @returns {string[]}
 */
export function mergeEnabledModelIds({
  previousCatalogIds,
  nextCatalogIds,
  currentEnabled,
  explicitlyDisabled = [],
}) {
  const next = new Set(nextCatalogIds);
  const previous = new Set(previousCatalogIds);
  const enabled = new Set(currentEnabled);
  const disabled = new Set(explicitlyDisabled);
  const merged = new Set();

  for (const id of enabled) {
    if (next.has(id)) merged.add(id);
  }
  for (const id of next) {
    if (!previous.has(id) && !disabled.has(id) && !merged.has(id)) merged.add(id);
  }
  return [...merged];
}
