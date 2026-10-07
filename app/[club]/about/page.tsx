"use client";

import Link from "next/link";
import { BrandArt } from "@/components/art";
import { useCurrentClub } from "@/components/SiteShell";
import { PageHero, RichText } from "@/components/ui";
import { useStats } from "@/lib/stats";
import { useStore } from "@/lib/store";

export default function AboutPage() {
  const club = useCurrentClub();
  const { db } = useStore();
  const stats = useStats(db, club.id);
  const squad = db.players.filter((p) => p.clubId === club.id && p.status === "active").length;
  const facts = [["Founded", String(club.founded)], ["League", club.league], ["Squad", `${squad} players`], ["Wins this season", stats.clubStats ? String(stats.clubStats.wins) : "—"]];
  return (
    <>
      <PageHero eyebrow="The club" title={club.about.heading} sub={club.tagline} />
      <div className="wrap grid gap-10 py-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <BrandArt src={club.about.image} label={club.name} sub={`Est. ${club.founded}`} className="mb-8 h-56 w-full rounded-xl sm:h-72" />
          <RichText html={club.about.body} />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${club.slug}/trials`} className="btn-primary">Apply for a trial</Link>
            <Link href={`/${club.slug}/history`} className="btn-ghost">Club history</Link>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="card divide-y divide-line">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-5 py-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{k}</span>
                <span className="display text-xl">{v}</span>
              </div>
            ))}
          </div>
          {club.about.values.length > 0 && (
            <div className="card p-5">
              <p className="eyebrow mb-3">Club values</p>
              <ul className="space-y-2">
                {club.about.values.map((v) => (
                  <li key={v} className="flex items-center gap-3 font-display text-lg font-semibold uppercase tracking-wide"><span className="h-1.5 w-6 bg-accent" />{v}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
