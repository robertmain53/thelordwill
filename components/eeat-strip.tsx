import React from "react";

interface EEATStripProps {
  authorName: string;
  reviewerName: string;
  reviewerCredential?: string;
  lastUpdatedISO: string; // YYYY-MM-DD
  categoryLabel: string;
  reviewedISO?: string; // optional YYYY-MM-DD
}

/**
 * EEAT strip: a lightweight, consistent trust widget to place under the H1.
 * Server component (no client JS).
 */
export function EEATStrip({
  authorName,
  reviewerName,
  reviewerCredential,
  lastUpdatedISO,
  categoryLabel,
  reviewedISO,
}: EEATStripProps) {
  const lastUpdatedHuman = toHumanDate(lastUpdatedISO);
  const reviewedHuman = reviewedISO ? toHumanDate(reviewedISO) : null;

  return (
    <div className="mt-2 mb-6 rounded-lg border bg-white px-4 py-3 text-sm text-gray-700">
      <dl className="grid grid-cols-1 gap-y-1 md:grid-cols-2 md:gap-x-6">
        <div className="flex gap-2">
          <dt className="font-semibold">Author:</dt>
          <dd>{authorName}</dd>
        </div>

        <div className="flex gap-2">
          <dt className="font-semibold">Reviewed by:</dt>
          <dd>
            {reviewerName}
            {reviewerCredential ? `, ${reviewerCredential}` : ""}
          </dd>
        </div>

        <div className="flex gap-2">
          <dt className="font-semibold">Last updated:</dt>
          <dd>
            <time dateTime={lastUpdatedISO}>{lastUpdatedHuman}</time>
          </dd>
        </div>

        <div className="flex gap-2">
          <dt className="font-semibold">Category:</dt>
          <dd>{categoryLabel}</dd>
        </div>

        {reviewedHuman && (
          <div className="flex gap-2 md:col-span-2">
            <dt className="font-semibold">Reviewed on:</dt>
            <dd>
              <time dateTime={reviewedISO}>{reviewedHuman}</time>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function toHumanDate(isoDate: string): string {
  // Assumes isoDate is YYYY-MM-DD
  const [y, m, d] = isoDate.split("-").map((x) => Number(x));
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
