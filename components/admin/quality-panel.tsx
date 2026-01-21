"use client";

import { type QualityResult } from "@/lib/quality/checks";

export function QualityPanel({
  result,
  className = "",
}: {
  result: QualityResult;
  className?: string;
}) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Quality</div>
        <div
          className={`text-sm font-semibold ${
            result.ok ? "text-green-600" : "text-red-600"
          }`}
        >
          {result.ok ? "✓ Pass" : "✗ Fail"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">Words</div>
          <div className="font-semibold">{result.metrics.words}</div>
        </div>
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">Uniqueness</div>
          <div className="font-semibold">{result.metrics.uniquenessPct}%</div>
        </div>
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">Links</div>
          <div className="font-semibold">{result.metrics.links}</div>
        </div>
      </div>

      {!result.ok && (
        <div className="mt-3 text-sm">
          <div className="font-semibold mb-1">Fix required</div>
          <ul className="list-disc list-inside text-red-700">
            {result.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
