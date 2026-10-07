"use client";

import { LeagueTable, ResultsList, StatsNote } from "@/components/blocks";
import { useCurrentClub } from "@/components/SiteShell";
import { Empty, Loading, PageHero } from "@/components/ui";
import { useStats } from "@/lib/stats";
import { useStore } from "@/lib/store";

export default function ResultsPage() {
  const club = useCurrentClub();
  const { db } = useStore();
  const stats = useStats(db, club.id);
  const cs = stats.clubStats;
  return (
    <>
      <PageHero eyebrow={club.league} title="Results" sub="Select any result to open the match details." />
      <div className="wrap grid gap-8 py-10 lg:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <div>
          {stats.loading ? <Loading label="Loading results…" /> : stats.recent.length ? <ResultsList club={club} matches={stats.recent} /> : <Empty title="No results yet" hint="Results will appear here after the first fixture." />}
        </div>
        <aside className="space-y-5">
          <div className="card p-5">
            <p className="eyebrow mb-3">Season record</p>
            {cs ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["Played", cs.played], ["Won", cs.wins], ["Drawn", cs.draws], ["Lost", cs.losses], ["Goals for", cs.goalsFor], ["Goals against", cs.goalsAgainst]].map(([k, v]) => (
                  <div key={k} className="rounded bg-white/5 py-3"><p className="display text-3xl">{v}</p><p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{k}</p></div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">Loading club statistics…</p>
            )}
          </div>
          <div className="card p-5">
            <p className="eyebrow mb-3">League table</p>
            {stats.leaderboard.length ? <LeagueTable rows={stats.leaderboard} /> : <p className="text-sm text-white/50">We couldn&apos;t load the latest statistics right now.</p>}
            <div className="mt-3"><StatsNote snap={stats} /></div>
          </div>
        </aside>
      </div>
    </>
  );
}
