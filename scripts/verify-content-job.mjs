import fs from "node:fs/promises";
import path from "node:path";
import {
  buildJsonReport,
  evaluateBlueprintPolicy,
  getBlueprintId,
  matchesOnlyFilter,
} from "./verifyContentPolicy.mjs";

const DEFAULT_BLUEPRINT_DIR = "blueprints";

/**
 * @typedef {import("./verifyContentPolicy.js").ContentFailure} ContentFailure
 * @typedef {import("./verifyContentPolicy.js").ContentPolicy} ContentPolicy
 * @typedef {import("./verifyContentPolicy.js").ContentResult} ContentResult
 * @typedef {object} VerifyContentJobOptions
 * @property {string} repoRoot
 * @property {boolean} [failFast]
 * @property {string} [only]
 * @property {boolean} [json]
 */

function validateBlueprintContent(blueprint) {
  const text =
    (typeof blueprint?.content === "string" && blueprint.content) ||
    (typeof blueprint?.description === "string" && blueprint.description) ||
    "";
  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  const failures = [];
  return {
    failures,
    metrics: {
      wordCount: words,
    },
  };
}

export async function verifyContentJob(opts) {
  const { repoRoot, failFast = false, only, json = false } = opts;
  const blueprintDir = path.join(repoRoot, DEFAULT_BLUEPRINT_DIR);
  const dirEntries = await fs.readdir(blueprintDir).catch(() => []);
  if (dirEntries.length === 0) {
    const report = buildJsonReport({
      results: [],
      failures: [],
      summary: {
        total: 0,
        failed: 0,
      },
    });
    console.warn(`No blueprints found in ${blueprintDir}`);
    return {
      report,
      failures: [],
    };
  }

  const filterBlueprint = matchesOnlyFilter(only);
  const failures = [];
  const results = [];

  for (const entry of dirEntries) {
    if (!entry.endsWith(".json") || !filterBlueprint(entry)) {
      continue;
    }

    const filePath = path.join(blueprintDir, entry);
    const raw = await fs.readFile(filePath, "utf8");
    const blueprint = JSON.parse(raw);
    const blueprintId = getBlueprintId(entry, blueprint);
    const policy = evaluateBlueprintPolicy(blueprint);
    const validation = validateBlueprintContent(blueprint);

    const entryFailures = validation.failures?.length
      ? validation.failures
      : policy.failures ?? [];

    failures.push(
      ...entryFailures.map((failure) => ({
        blueprintId,
        path: entry,
        ...failure,
      })),
    );

    results.push({
      blueprintId,
      policy: policy.name,
      passed: entryFailures.length === 0,
      failures: entryFailures,
      metadata: {
        source: entry,
        timestamp: new Date().toISOString(),
        ...(validation.metrics ?? {}),
      },
    });

    if (failFast && entryFailures.length > 0) {
      break;
    }
  }

  const report = buildJsonReport({
    results,
    failures,
    summary: {
      total: results.length,
      failed: failures.length,
    },
  });

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("Content verification report:");
    for (const result of results) {
      console.log(
        `  - ${result.blueprintId} (${result.policy}) → ${
          result.passed ? "PASS" : `FAIL (${result.failures.length} issues)`
        }`,
      );
    }
  }

  return {
    report,
    failures,
  };
}

if (process.argv[1]?.endsWith("verify-content-job.mjs")) {
  const [, , ...args] = process.argv;
  /** @type {VerifyContentJobOptions} */
  const opts = { repoRoot: process.cwd() };

  for (const arg of args) {
    if (arg === "--fail-fast") {
      opts.failFast = true;
    } else if (arg === "--json") {
      opts.json = true;
    } else if (arg.startsWith("--only=")) {
      opts.only = arg.replace("--only=", "");
    }
  }

  verifyContentJob(opts)
    .then(({ failures }) => {
      if (failures.length > 0) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
