import { db } from "@/lib/db";

/**
 * Reporter level logic for the SAM1337 archive.
 *
 * A reporter's level (ROOKIE → PRO → ELITE → LEGEND) is derived from the
 * number of **verified (approved)** defacements they have in the archive.
 * On-hold / pending submissions do NOT count toward the level — only
 * accepted, verified mirrors do.
 *
 * ADMIN is a staff override for the archive operator and is independent of
 * the verified count.
 */

export type ReporterLevel = "ADMIN" | "LEGEND" | "ELITE" | "PRO" | "ROOKIE";

// Staff handles — always ADMIN regardless of their verified count.
const ADMIN_HANDLES = new Set(["sam"]);

// Level thresholds based on the count of VERIFIED (approved) defacements.
//   LEGEND  ≥ 15 verified
//   ELITE   ≥ 7  verified
//   PRO     ≥ 3  verified
//   ROOKIE  < 3  verified
const LEVEL_THRESHOLDS: Array<{ level: ReporterLevel; min: number }> = [
  { level: "LEGEND", min: 15 },
  { level: "ELITE", min: 7 },
  { level: "PRO", min: 3 },
  { level: "ROOKIE", min: 0 },
];

/** Compute the reporter level for an attacker given their verified count. */
export function levelForVerifiedCount(
  verifiedCount: number,
  attacker: string,
): ReporterLevel {
  if (ADMIN_HANDLES.has(attacker.toLowerCase())) return "ADMIN";
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
  const level = levelForVerifiedCount(verifiedCount, attacker);

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
