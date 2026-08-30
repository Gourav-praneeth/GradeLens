export type OverrideInput = {
  pointsAwarded: number;
  maxPoints: number;
  modelPointsAwarded: number;
  note: string;
};

export type OverrideResult =
  | { ok: true; pointsAwarded: number; overrideNote: string | null }
  | { ok: false; error: string };

export function validateOverride(input: OverrideInput): OverrideResult {
  const points = Number(input.pointsAwarded);
  if (!Number.isFinite(points)) {
    return { ok: false, error: "Enter a valid point value." };
  }
  if (points < 0 || points > input.maxPoints) {
    return { ok: false, error: `Points must be between 0 and ${input.maxPoints}.` };
  }

  const note = input.note.trim();
  const changed = Math.abs(points - input.modelPointsAwarded) > 0.001;

  if (changed && note.length < 3) {
    return { ok: false, error: "Add a note explaining the override." };
  }

  return {
    ok: true,
    pointsAwarded: points,
    overrideNote: changed ? note : null,
  };
}
