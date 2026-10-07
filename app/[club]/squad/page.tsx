"use client";

import Link from "next/link";
import { Avatar } from "@/components/art";
import { StatsNote } from "@/components/blocks";
import { useCurrentClub } from "@/components/SiteShell";
import { Badge, Empty, PageHero } from "@/components/ui";
import { kitTable } from "@/lib/kit";
import { lineOf } from "@/lib/seed";
import { useStats } from "@/lib/stats";
import { useStore } from "@/lib/store";

const LINES = [["GK", "Goalkeepers"], ["DEF", "Defenders"], ["MID", "Midfielders"], ["FWD", "Forwards"]] as const;

export default function SquadPage() {
  const club = useCurrentClub();
  const { db } = useStore();
  const stats = useStats(db, club.id);
  const players = db.players.filter((p) => p.clubId === club.id && p.status === "active").sort((a, b) => a.kitNumber - b.kitNumber);
  const kits = kitTable(db.players, club.id);
  return (
    <>
      <PageHero eyebrow="First team" title="Squad" sub={`${players.length} registered players for the current season.`} />
      <div className="wrap space-y-12 py-10">
        {!players.length && <Empty title="No players registered" hint="The squad will appear here once players have been added." />}
        {LINES.map(([key, label]) => {
          const group = players.filter((p) => lineOf(p.position) === key);
          if (!group.length) return null;
          return (
            <section key={key}>
              <h2 className="display mb-4 flex items-center gap-3 text-3xl"><span className="h-6 w-1.5 bg-accent" />{label}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.map((p) => (
                  <Link key={p.id} href={`/${club.slug}/squad/${p.id}`} className="card card-hover group relative overflow-hidden">
                    <span className="display absolute left-3 top-2 z-10 text-5xl text-accent/90">{p.kitNumber}</span>
                    <span className="absolute right-3 top-3 z-10"><Badge tone="accent">{p.position}</Badge></span>
                    <Avatar src={p.image} name={p.gamerTag} className="h-44 w-full" />
                    <div className="border-t border-line p-4">
                      <p className="display text-2xl group-hover:text-accent">{p.gamerTag}</p>
                      <p className="text-sm text-white/55">{p.firstName} {p.lastName} · {p.nationality}</p>
                      <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                        {[["Apps", p.stats.apps], [key === "GK" ? "CS" : "Goals", key === "GK" ? p.stats.cleanSheets : p.stats.goals], ["Ast", p.stats.assists], ["Rating", p.stats.rating.toFixed(1)]].map(([l, v]) => (
                          <div key={l} className="rounded bg-white/5 py-1.5">
                            <p className="display text-lg">{v}</p>
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">{l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        <StatsNote snap={stats} />

        <section>
          <h2 className="display mb-1 text-3xl">Kit number availability</h2>
          <p className="mb-4 text-sm text-white/55">Each active player holds exactly one number. Available numbers can be requested by new signings.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {kits.map((k) => (
              <div key={k.number} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${k.player ? "border-line bg-panel" : "border-accent/30 bg-accent/5"}`}>
                <span className="display w-8 text-2xl">{k.number}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-white/60">{k.player ? `${k.player.firstName} ${k.player.lastName}` : ""}</span>
                <Badge>{k.player ? "Used" : "Available"}</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
