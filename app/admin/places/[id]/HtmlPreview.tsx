"use client";

import * as React from "react";

function looksLikeHtml(s: string): boolean {
  // Very small heuristic: if it contains a tag-like sequence, treat as HTML.
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

export function HtmlPreview({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  const v = (value || "").trim();

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-muted text-xs font-semibold">{title} Preview</div>
      <div className="p-4 text-sm leading-relaxed">
        {!v ? (
          <div className="text-muted-foreground">Nothing to preview.</div>
        ) : looksLikeHtml(v) ? (
          <div dangerouslySetInnerHTML={{ __html: v }} />
        ) : (
          <div className="whitespace-pre-line">{v}</div>
        )}
      </div>
    </div>
  );
}
