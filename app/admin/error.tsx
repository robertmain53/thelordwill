"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <h1 className="text-2xl font-bold mb-2">Admin Error</h1>
      <p className="text-muted-foreground mb-6">
        The admin page hit a server error. Details below can help us trace it.
      </p>

      <div className="border rounded-lg p-4 bg-muted/30 space-y-2 text-sm">
        <div>
          <span className="font-semibold">Message:</span> {error.message || "Unknown error"}
        </div>
        {error.digest && (
          <div>
            <span className="font-semibold">Digest:</span> {error.digest}
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button className="border rounded px-4 py-2 hover:bg-muted" onClick={() => reset()}>
          Try again
        </button>
        <button className="border rounded px-4 py-2 hover:bg-muted" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    </div>
  );
}
