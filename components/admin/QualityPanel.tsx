"use client";

import { type QualityResult } from "@/lib/quality/checks";

/**
 * QualityPanel - Displays quality check results in the admin UI
 *
 * Shows:
 * - PASS / FAIL status
 * - Quality score (0-100)
 * - Metrics breakdown
 * - List of failure reasons (actionable)
 */
export function QualityPanel({
  result,
  className = "",
}: {
  result: QualityResult;
  className?: string;
}) {
  const passColor = "text-green-600 dark:text-green-400";
  const failColor = "text-red-600 dark:text-red-400";

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      {/* Header: Pass/Fail + Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">Quality Gate</div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Score: <span className="font-semibold">{result.score}/100</span>
          </span>
          <div
            className={`text-sm font-bold ${result.ok ? passColor : failColor}`}
          >
            {result.ok ? "✓ PASS" : "✗ FAIL"}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {/* Word Count */}
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">Words</div>
          <div className="font-semibold flex items-center justify-between">
            <span>{result.metrics.wordCount}</span>
            <span
              className={`text-xs ${
                result.metrics.wordCount >= 300 ? passColor : failColor
              }`}
            >
              {result.metrics.wordCount >= 300 ? "✓" : "< 300"}
            </span>
          </div>
        </div>

        {/* Internal Links */}
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">Internal Links</div>
          <div className="font-semibold flex items-center justify-between">
            <span>{result.metrics.internalLinkCount}</span>
            <span
              className={`text-xs ${
                result.metrics.internalLinkCount >= 3 ? passColor : failColor
              }`}
            >
              {result.metrics.internalLinkCount >= 3 ? "✓" : "< 3"}
            </span>
          </div>
        </div>

        {/* Entity Links */}
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">Entity Links</div>
          <div className="font-semibold flex items-center justify-between">
            <span>{result.metrics.entityLinksPresent ? "Yes" : "No"}</span>
            <span
              className={`text-xs ${
                result.metrics.entityLinksPresent ? passColor : failColor
              }`}
            >
              {result.metrics.entityLinksPresent ? "✓" : "✗"}
            </span>
          </div>
        </div>

        {/* Has Intro */}
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">Introduction</div>
          <div className="font-semibold flex items-center justify-between">
            <span>{result.metrics.hasIntro ? "Yes" : "No"}</span>
            <span
              className={`text-xs ${
                result.metrics.hasIntro ? passColor : failColor
              }`}
            >
              {result.metrics.hasIntro ? "✓" : "✗"}
            </span>
          </div>
        </div>

        {/* Has Conclusion */}
        <div className="border rounded p-2 col-span-2">
          <div className="text-xs text-muted-foreground">Conclusion</div>
          <div className="font-semibold flex items-center justify-between">
            <span>{result.metrics.hasConclusion ? "Yes" : "No"}</span>
            <span
              className={`text-xs ${
                result.metrics.hasConclusion ? passColor : failColor
              }`}
            >
              {result.metrics.hasConclusion ? "✓" : "✗"}
            </span>
          </div>
        </div>
      </div>

      {/* Failure Reasons */}
      {!result.ok && result.reasons.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <div className="text-sm font-semibold mb-2 text-red-700 dark:text-red-400">
            Fix required to publish:
          </div>
          <ul className="list-disc list-inside text-sm space-y-1 text-red-700 dark:text-red-400">
            {result.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pass message */}
      {result.ok && (
        <div className="mt-4 border-t pt-3">
          <div className="text-sm text-green-700 dark:text-green-400">
            All quality checks passed. Ready to publish.
          </div>
        </div>
      )}
    </div>
  );
}
