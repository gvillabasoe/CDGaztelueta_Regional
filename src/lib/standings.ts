import { prisma } from "@/lib/prisma";

export type StandingRow = {
  teamId: string;
  name: string;
  isOwn: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export async function getStandings(): Promise<StandingRow[]> {
  const teams = await prisma.team.findMany();
  const matches = await prisma.leagueMatch.findMany({
    where: { status: "FINISHED" },
  });

  const map = new Map<string, StandingRow>();
  for (const t of teams) {
    map.set(t.id, {
      teamId: t.id,
      name: t.name,
      isOwn: t.isOwn,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (m.homeGoals == null || m.awayGoals == null) continue;
    const home = map.get(m.homeTeamId);
    const away = map.get(m.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.gf += m.homeGoals;
    home.ga += m.awayGoals;
    away.gf += m.awayGoals;
    away.ga += m.homeGoals;

    if (m.homeGoals > m.awayGoals) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.homeGoals < m.awayGoals) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  const rows = [...map.values()].map((r) => ({ ...r, gd: r.gf - r.ga }));
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.name.localeCompare(b.name),
  );
  return rows;
}

export type LeagueMatchView = {
  id: string;
  matchday: number;
  status: "SCHEDULED" | "IN_PLAY" | "FINISHED";
  dateLabel: string;
  timeLabel: string;
  dateISO: string;
  home: { name: string; isOwn: boolean };
  away: { name: string; isOwn: boolean };
  homeGoals: number | null;
  awayGoals: number | null;
};

export type MatchdayView = { matchday: number; matches: LeagueMatchView[] };

import { formatDateShort, formatTime } from "@/lib/format";

export async function getMatchdays(): Promise<MatchdayView[]> {
  const matches = await prisma.leagueMatch.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ matchday: "asc" }, { date: "asc" }],
  });

  const byDay = new Map<number, LeagueMatchView[]>();
  for (const m of matches) {
    const view: LeagueMatchView = {
      id: m.id,
      matchday: m.matchday,
      status: m.status,
      dateLabel: formatDateShort(m.date),
      timeLabel: formatTime(m.date),
      dateISO: m.date.toISOString(),
      home: { name: m.homeTeam.name, isOwn: m.homeTeam.isOwn },
      away: { name: m.awayTeam.name, isOwn: m.awayTeam.isOwn },
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
    };
    if (!byDay.has(m.matchday)) byDay.set(m.matchday, []);
    byDay.get(m.matchday)!.push(view);
  }

  return [...byDay.entries()]
    .map(([matchday, ms]) => ({ matchday, matches: ms }))
    .sort((a, b) => a.matchday - b.matchday);
}

export function defaultMatchdayIndex(days: MatchdayView[]): number {
  if (days.length === 0) return 0;

  // 1) Jornada en juego
  const inPlayIdx = days.findIndex((d) =>
    d.matches.some((m) => m.status === "IN_PLAY"),
  );
  if (inPlayIdx >= 0) return inPlayIdx;

  // 2) Jornada más cercana a la fecha actual
  const now = Date.now();
  let bestIdx = 0;
  let bestDiff = Infinity;
  days.forEach((d, i) => {
    const times = d.matches.map((m) => new Date(m.dateISO).getTime());
    const rep = times.length ? Math.min(...times) : now;
    const diff = Math.abs(rep - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  });
  return bestIdx;
}

export type NextMatchView = {
  matchday: number;
  status: "SCHEDULED" | "IN_PLAY" | "FINISHED";
  dateLabel: string;
  timeLabel: string;
  home: { name: string; isOwn: boolean };
  away: { name: string; isOwn: boolean };
} | null;

export async function getNextMatch(): Promise<NextMatchView> {
  const own = await prisma.team.findFirst({ where: { isOwn: true } });
  if (!own) return null;

  const base = {
    OR: [{ homeTeamId: own.id }, { awayTeamId: own.id }],
  };

  const inPlay = await prisma.leagueMatch.findFirst({
    where: { status: "IN_PLAY", ...base },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { date: "asc" },
  });

  const chosen =
    inPlay ??
    (await prisma.leagueMatch.findFirst({
      where: { status: "SCHEDULED", ...base },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: "asc" },
    }));

  if (!chosen) return null;

  return {
    matchday: chosen.matchday,
    status: chosen.status,
    dateLabel: formatDateShort(chosen.date),
    timeLabel: formatTime(chosen.date),
    home: { name: chosen.homeTeam.name, isOwn: chosen.homeTeam.isOwn },
    away: { name: chosen.awayTeam.name, isOwn: chosen.awayTeam.isOwn },
  };
}

export async function getTeamAverages(): Promise<{
  training: number | null;
  match: number | null;
}> {
  const [t, m] = await Promise.all([
    prisma.trainingPlayer.aggregate({
      _avg: { grade: true },
      where: { grade: { not: null } },
    }),
    prisma.matchPlayer.aggregate({
      _avg: { grade: true },
      where: { grade: { not: null } },
    }),
  ]);
  return {
    training: t._avg.grade ?? null,
    match: m._avg.grade ?? null,
  };
}
