import { LeagueView } from "@/components/LeagueView";
import {
  getStandings,
  getMatchdays,
  defaultMatchdayIndex,
} from "@/lib/standings";

export const dynamic = "force-dynamic";

export default async function CoachLigaPage() {
  const [standings, matchdays] = await Promise.all([
    getStandings(),
    getMatchdays(),
  ]);
  const initial = defaultMatchdayIndex(matchdays);

  return (
    <div className="space-y-4">
      <p className="eyebrow">Liga</p>
      <LeagueView
        standings={standings}
        matchdays={matchdays}
        initialMatchday={initial}
      />
    </div>
  );
}
