const STOP = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "not",
  "was",
  "were",
  "did",
  "does",
  "has",
  "had",
  "but",
  "are",
  "you",
  "your",
  "they",
  "their",
  "missing",
  "because",
]);

export type DeductionRow = {
  submissionId: string;
  studentName: string;
  criterionId: string;
  criterionLabel: string;
  maxPoints: number;
  pointsAwarded: number;
  deductionReason: string;
};

export type DeductionCluster = {
  criterionId: string;
  criterionLabel: string;
  fingerprint: string;
  sampleReason: string;
  minPoints: number;
  maxPointsAwarded: number;
  spread: number;
  inconsistent: boolean;
  rows: DeductionRow[];
};

export function deductionFingerprint(reason: string): string {
  const words = [
    ...new Set(
      reason
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !STOP.has(word)),
    ),
  ].sort();
  if (words.length > 0) {
    return words.slice(0, 8).join(" ");
  }
  return reason.trim().toLowerCase().slice(0, 40);
}

export function clusterDeductions(rows: DeductionRow[]): DeductionCluster[] {
  const deducted = rows.filter((row) => row.maxPoints - row.pointsAwarded > 0.001);
  const groups = new Map<string, DeductionRow[]>();

  for (const row of deducted) {
    const key = `${row.criterionId}::${deductionFingerprint(row.deductionReason)}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const clusters: DeductionCluster[] = [];
  for (const [key, members] of groups) {
    const points = members.map((row) => row.pointsAwarded);
    const minPoints = Math.min(...points);
    const maxPointsAwarded = Math.max(...points);
    const rounded = new Set(points.map((value) => value.toFixed(1)));
    const [, fingerprint] = key.split("::");
    clusters.push({
      criterionId: members[0].criterionId,
      criterionLabel: members[0].criterionLabel,
      fingerprint,
      sampleReason: members[0].deductionReason,
      minPoints,
      maxPointsAwarded,
      spread: maxPointsAwarded - minPoints,
      inconsistent: rounded.size > 1,
      rows: members,
    });
  }

  return clusters.sort((a, b) => {
    if (a.inconsistent !== b.inconsistent) return a.inconsistent ? -1 : 1;
    return b.rows.length - a.rows.length;
  });
}

export type ScoreBand = {
  label: string;
  count: number;
};

export function scoreDistribution(
  totals: Array<{ awarded: number; possible: number }>,
): ScoreBand[] {
  const bands = [
    { label: "Under 50%", count: 0 },
    { label: "50–70%", count: 0 },
    { label: "70–90%", count: 0 },
    { label: "90–100%", count: 0 },
  ];

  for (const row of totals) {
    if (row.possible <= 0) continue;
    const pct = row.awarded / row.possible;
    if (pct < 0.5) bands[0].count += 1;
    else if (pct < 0.7) bands[1].count += 1;
    else if (pct < 0.9) bands[2].count += 1;
    else bands[3].count += 1;
  }

  return bands;
}
