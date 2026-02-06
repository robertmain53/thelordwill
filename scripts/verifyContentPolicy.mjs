/**
 * @typedef {object} ContentFailure
 * @property {string} blueprintId
 * @property {string} path
 * @property {string} issue
 * @property {string} [details]
 *
 * @typedef {object} ContentPolicy
 * @property {string} name
 * @property {ContentFailure[]} failures
 *
 * @typedef {object} ContentResult
 * @property {string} blueprintId
 * @property {string} policy
 * @property {boolean} passed
 * @property {ContentFailure[]} failures
 * @property {Record<string, unknown>} metadata
 */

export function matchesOnlyFilter(only) {
  if (!only) {
    return () => true;
  }

  const normalized = only.trim();

  return (entry) => {
    if (!normalized) return true;
    const slug = entry.replace(/\.json$/i, "");
    return slug === normalized || slug.includes(normalized);
  };
}

export function getBlueprintId(entry, blueprint) {
  return (
    blueprint?.id ??
    blueprint?.blueprintId ??
    blueprint?.slug ??
    entry.replace(/\.json$/i, "")
  );
}

export function evaluateBlueprintPolicy(blueprint) {
  const policyName = blueprint?.policy ?? blueprint?.type ?? "default";
  const failures = Array.isArray(blueprint?.policyFailures)
    ? blueprint.policyFailures
    : [];

  return {
    name: policyName,
    failures: failures.map((failure) => ({
      issue: failure?.issue ?? "policy",
      details: failure?.details ?? "",
    })),
  };
}

export function buildJsonReport({ results, failures, summary }) {
  return {
    results,
    failures,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
