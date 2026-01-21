// lib/pages/prayerpoint-clustering.ts

type ClusterKey = "stabilization" | "identity" | "wisdom" | "endurance";

const CLUSTER_META: Record<ClusterKey, { title: string; intent: string }> = {
  stabilization: {
    title: "God’s Presence and Peace",
    intent: "Calm the heart and re-center on God’s nearness.",
  },
  identity: {
    title: "Identity and Assurance",
    intent: "Remember who you are in God’s promises.",
  },
  wisdom: {
    title: "Wisdom and Next Steps",
    intent: "Ask for guidance and act with prudence.",
  },
  endurance: {
    title: "Endurance and Hope",
    intent: "Keep going with confidence in God’s timing.",
  },
};

const KEYWORDS: Record<ClusterKey, string[]> = {
  stabilization: ["peace", "fear", "anx", "rest", "trouble", "worry", "comfort", "still"],
  identity: ["beloved", "chosen", "adopt", "inherit", "faith", "righteous", "redeem", "grace"],
  wisdom: ["wisdom", "understanding", "counsel", "teach", "path", "guide", "discern"],
  endurance: ["endure", "hope", "wait", "persever", "strength", "patient", "steadfast"],
};

export function clusterPrayerPointVerses<T extends { text: string; reference: string }>(
  verses: T[]
): Array<{ key: ClusterKey; title: string; intent: string; verses: T[] }> {
  const buckets: Record<ClusterKey, T[]> = {
    stabilization: [],
    identity: [],
    wisdom: [],
    endurance: [],
  };

  for (const v of verses) {
    const hay = (v.text + " " + v.reference).toLowerCase();

    let bestKey: ClusterKey = "stabilization";
    let bestScore = -1;

    (Object.keys(KEYWORDS) as ClusterKey[]).forEach((k) => {
      const score = KEYWORDS[k].reduce((acc, kw) => (hay.includes(kw) ? acc + 1 : acc), 0);
      if (score > bestScore) {
        bestScore = score;
        bestKey = k;
      }
    });

    buckets[bestKey].push(v);
  }

  // Ensure no empty clusters: rebalance if needed
  const all = verses.slice();
  (Object.keys(buckets) as ClusterKey[]).forEach((k) => {
    if (buckets[k].length === 0 && all.length) {
      buckets[k].push(all.shift()!);
    }
  });

  return (Object.keys(CLUSTER_META) as ClusterKey[]).map((key) => ({
    key,
    title: CLUSTER_META[key].title,
    intent: CLUSTER_META[key].intent,
    verses: buckets[key],
  }));
}
