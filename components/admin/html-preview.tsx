"use client";

import { useMemo } from "react";

export function HtmlPreview({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  // Provide minimal wrapper styles to make preview readable
  const srcDoc = useMemo(() => {
    const safe = html ?? "";
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 16px; line-height: 1.6; }
  h1,h2,h3 { line-height: 1.2; }
  a { text-decoration: underline; }
  blockquote { border-left: 3px solid #ddd; padding-left: 12px; color: #444; }
  code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  pre { background: #f3f4f6; padding: 12px; border-radius: 8px; overflow: auto; }
</style>
</head>
<body>
${safe}
</body>
</html>`;
  }, [html]);

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="px-3 py-2 text-xs font-semibold bg-muted">Preview</div>
      <iframe
        title="HTML Preview"
        className="w-full h-[420px] bg-white"
        sandbox="allow-same-origin" // no scripts; safe-ish. keep scripts out of html anyway.
        srcDoc={srcDoc}
      />
    </div>
  );
}
