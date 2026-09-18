import { db } from "@/lib/db";

/**
 * Reporter level logic for the DefacerID archive.
 *
 * A reporter's level is derived purely from the number of VERIFIED (approved)
 * defacements they have in the archive. On-hold / pending submissions do NOT
 * count toward the level — only accepted, verified mirrors do.
 *
 * Tiers (by verified count):
 *   ROOKIE   0 – 10
 *   ELITE    11 – 100
 *   PRO      101 – 1000
 *   LEGEND   1001+   (terminal / maxed-out level)
 */

export type ReporterLevel = "LEGEND" | "PRO" | "ELITE" | "ROOKIE";

// Level thresholds based on the count of VERIFIED (approved) defacements.
// Ordered highest-first so the first match wins.
const LEVEL_THRESHOLDS: Array<{ level: ReporterLevel; min: number }> = [
  { level: "LEGEND", min: 1001 },
  { level: "PRO", min: 101 },
  { level: "ELITE", min: 11 },
  { level: "ROOKIE", min: 0 },
];

/** Compute the reporter level for an attacker given their verified count. */
export function levelForVerifiedCount(verifiedCount: number): ReporterLevel {
  for (const t of LEVEL_THRESHOLDS) {
    if (verifiedCount >= t.min) return t.level;
  }
  return "ROOKIE";
}

/**
 * Recompute and persist the reporter level for a single attacker based on
 * their current count of VERIFIED (approved) defacements. Updates ALL of that
 * attacker's records so the badge stays consistent everywhere it appears.
 *
 * Skips the write when the level hasn't changed (cheap idempotent re-check).
 *
 * Call this after approving a defacement (the verified count may have crossed
 * a threshold and bumped the level).
 */
export async function recomputeAttackerLevel(
  attacker: string,
): Promise<ReporterLevel> {
  const verifiedCount = await db.defacement.count({
    where: { attacker, status: "approved" },
  });
  const level = levelForVerifiedCount(verifiedCount);

  // Cheap current-level probe — skip the write when nothing changed.
  const current = await db.defacement.findFirst({
    where: { attacker },
    select: { reporterLevel: true },
  });
  if (current?.reporterLevel === level) return level;

  await db.defacement.updateMany({
    where: { attacker },
    data: { reporterLevel: level },
  });
  return level;
}

/**
 * Recompute levels for every attacker in the archive. Used after seeding (so
 * seeded levels reflect verified counts rather than hardcoded values) and can
 * be called periodically as a safety net against any drift.
 */
export async function recomputeAllLevels(): Promise<void> {
  const all = await db.defacement.findMany({
    select: { attacker: true },
    distinct: ["attacker"],
  });
  for (const { attacker } of all) {
    await recomputeAttackerLevel(attacker);
  }
}
