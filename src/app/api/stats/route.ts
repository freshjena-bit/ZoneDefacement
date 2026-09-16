// SAM1337 stats endpoint — returns verified-report counts, unique-host count,
// reporter count, today's submissions, and the top-10 attacker/team rankings.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { recomputeAllLevels } from "@/lib/level";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedIfEmpty();
    // Self-heal reporter levels: recompute from verified counts. Skips writes
    // when levels are already correct, so this is cheap after the first run.
    await recomputeAllLevels();

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const [
      verifiedReports,
      uniqueHostsAgg,
      reportersAgg,
      submittedTodayAgg,
      attackersTodayAgg,
      topAttackersAgg,
      topTeamsAgg,
    ] = await Promise.all([
      db.defacement.count({ where: { status: "approved" } }),
      db.defacement.findMany({
        where: { status: "approved" },
        select: { targetDomain: true },
        distinct: ["targetDomain"],
      }),
      db.defacement.findMany({
        where: { status: "approved" },
        select: { attacker: true },
        distinct: ["attacker"],
      }),
      db.defacement.count({ where: { capturedAt: { gte: startOfToday } } }),
      db.defacement.findMany({
        where: { capturedAt: { gte: startOfToday } },
        select: { attacker: true },
        distinct: ["attacker"],
      }),
      db.defacement.groupBy({
        by: ["attacker"],
        where: { status: "approved" },
        _count: { attacker: true },
        orderBy: { _count: { attacker: "desc" } },
        take: 10,
      }),
      db.defacement.groupBy({
        by: ["team"],
        where: { status: "approved", NOT: { team: null } },
        _count: { team: true },
        orderBy: { _count: { team: "desc" } },
        take: 10,
      }),
    ]);

    // For attacker rankings we also need their level. Pull it cheaply with a
    // findFirst per attacker (only 10 entries).
    const attackerLevels = await Promise.all(
      topAttackersAgg.map((a) =>
        db.defacement.findFirst({
          where: { attacker: a.attacker },
          select: { reporterLevel: true },
        }),
      ),
    );

    const attackers = topAttackersAgg.map((a, i) => ({
      name: a.attacker,
      count: a._count.attacker,
      level: attackerLevels[i]?.reporterLevel ?? "ROOKIE",
    }));

    const teams = topTeamsAgg
      .filter((t) => t.team != null)
      .map((t) => ({
        name: t.team as string,
        count: t._count.team,
      }));

    return NextResponse.json({
      verifiedReports,
      uniqueHosts: uniqueHostsAgg.length,
      reporters: reportersAgg.length,
      submittedToday: submittedTodayAgg,
      attackersToday: attackersTodayAgg.length,
      rankings: { attackers, teams },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
