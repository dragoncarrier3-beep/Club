"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { Avatar } from "@/components/art";
import { useCurrentClub } from "@/components/SiteShell";
import { Badge, Empty } from "@/components/ui";
import { playerDetail } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { cx, fmtDate, resultOf } from "@/lib/utils";

export default function PlayerPage() {
  const club = useCurrentClub();
  const { id } = useParams<{ id: string }>();
  const { db } = useStore();
  const player = db.players.find((p) => p.id === id && p.clubId === club.id);
  if (!player) {
    return (
      <div className="wrap py-16">
        <Empty title="Player not found" hint="This player may have left the club.">
          <Link href={`/${club.slug}/squad`} className="btn-primary">Back to squad</Link>
        </Empty>
      </div>
    );
  }
  const s = player.stats;
  const detail = playerDetail(player, db.matches.filter((m) => m.clubId === club.id));
  const tiles: [string, string | number][] = [["Appearances", s.apps], ["Goals", s.goals], ["Assists", s.assists], ["Player of the Match", s.motm], ["Yellow Cards", s.yellow], ["Red Cards", s.red], ["Average Rating", s.rating.toFixed(1)]];
  if (player.position === "GK") tiles.splice(1, 1, ["Clean Sheets", s.cleanSheets]);
  const short = club.name.replace(/ (Esports|FC)$/, "");

  return (
    <>
      <div className="grid-glow border-b border-line">
        <div className="wrap py-8">
          <Link href={`/${club.slug}/squad`} className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-accent"><ArrowLeft size={15} /> Squad</Link>
          <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
            <Avatar src={player.image} name={player.gamerTag} className="h-40 w-40 shrink-0 rounded-xl border border-line" />
            <div>
              <p className="display text-7xl text-accent">#{player.kitNumber}</p>
              <h1 className="display text-4xl sm:text-6xl">{player.firstName} “{player.gamerTag}” {player.lastName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="accent">{player.position}</Badge>
                <Badge>{player.status === "active" ? "Active" : "Archived"}</Badge>
                <span className="chip">{player.nationality}</span>
                <span className="chip">EA ID: {player.eaId}</span>
                <span className="chip">Joined {fmtDate(player.joinedAt, { month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap space-y-10 py-10">
        <section>
          <h2 className="display mb-4 text-3xl">Season statistics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {tiles.map(([label, value]) => (
              <div key={label} className="card p-4 text-center">
                <p className="display text-4xl">{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-wider text-white/35">Demo statistics</p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-8">
            <section className="card p-5">
              <p className="eyebrow mb-2">Profile</p>
              <p className="text-sm leading-relaxed text-white/70">{player.bio || "No biography has been added for this player yet."}</p>
            </section>
            <section className="card p-5">
              <p className="eyebrow mb-3">Recent form</p>
              {detail.log.length ? (
                <div className="flex items-end gap-2">
                  {detail.log.slice(0, 5).reverse().map((l) => (
                    <div key={l.match.id} className="flex flex-1 flex-col items-center gap-1" title={`vs ${l.match.opponent}`}>
                      <span className="text-xs font-semibold tabular-nums">{l.rating.toFixed(1)}</span>
                      <div className="flex h-24 w-full items-end rounded bg-white/5"><div className={cx("w-full rounded", l.rating >= 8 ? "bg-accent" : "bg-accent/45")} style={{ height: `${Math.max(12, (l.rating - 5) * 20)}%` }} /></div>
                      <span className="w-full truncate text-center text-[9px] uppercase text-white/40">{l.match.opponent.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">No statistics are currently available for this player.</p>
              )}
            </section>
            <section className="card p-5">
              <p className="eyebrow mb-3">Achievements</p>
              {detail.achievements.length ? (
                <ul className="space-y-2 text-sm text-white/75">{detail.achievements.map((a) => <li key={a} className="flex items-center gap-2"><Trophy size={14} className="shrink-0 text-accent" />{a}</li>)}</ul>
              ) : (
                <p className="text-sm text-white/50">No achievements recorded yet this season.</p>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="display mb-3 text-2xl">Match history</h2>
              {detail.log.length ? (
                <div className="card divide-y divide-line">
                  {detail.log.map((l) => (
                    <div key={l.match.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <Badge>{resultOf(l.match)}</Badge>
                      <span className="min-w-0 flex-1 truncate">{l.match.home ? `${short} ${l.match.gf}–${l.match.ga} ${l.match.opponent}` : `${l.match.opponent} ${l.match.ga}–${l.match.gf} ${short}`}</span>
                      <span className="hidden text-xs text-white/40 sm:inline">{fmtDate(l.match.playedAt, { day: "numeric", month: "short" })}</span>
                      {l.goals > 0 && <span className="text-xs text-accent">{l.goals} goal{l.goals > 1 ? "s" : ""}</span>}
                      <span className="display w-9 text-right text-lg tabular-nums">{l.rating.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="No matches yet" hint="Match history appears after this player's first appearance." />
              )}
            </section>
            <section>
              <h2 className="display mb-3 text-2xl">Career statistics</h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-wider text-white/45">
                    <tr>{["Season", "Apps", "Goals", "Assists", "Rating"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {detail.career.map((c) => (
                      <tr key={c.season}><td className="px-4 py-3 font-semibold">{c.season}</td><td className="px-4 py-3 tabular-nums">{c.apps}</td><td className="px-4 py-3 tabular-nums">{c.goals}</td><td className="px-4 py-3 tabular-nums">{c.assists}</td><td className="px-4 py-3 tabular-nums">{c.rating.toFixed(1)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
