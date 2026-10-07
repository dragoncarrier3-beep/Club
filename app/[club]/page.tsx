"use client";

import Link from "next/link";
import { ArrowRight, Twitch } from "lucide-react";
import { Avatar, Crest } from "@/components/art";
import { CalendarLink, DonationProgress, EventRow, LeagueTable, NewsCard, ResultsList, StatsNote, StatusBanner } from "@/components/blocks";
import { SocialLinks, useCurrentClub } from "@/components/SiteShell";
import { Empty, SectionHead } from "@/components/ui";
import { useStats } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { fmtTime, playerName } from "@/lib/utils";

export default function HomePage() {
  const club = useCurrentClub();
  const { db, now } = useStore();
  const stats = useStats(db, club.id);
  const base = `/${club.slug}`;
  const short = club.name.replace(/ (Esports|FC)$/, "");

  const news = db.news.filter((n) => n.clubId === club.id && n.status === "published" && n.publishedAt <= now).sort((a, b) => b.publishedAt - a.publishedAt);
  const upcoming = db.events.filter((e) => e.clubId === club.id && e.startsAt >= now).sort((a, b) => a.startsAt - b.startsAt);
  const next = upcoming.find((e) => e.type === "Match" && !e.cancelled);
  const opponent = next?.title.split(/\s+vs\.?\s+/i)[1]?.trim();
  const position = stats.leaderboard.findIndex((r) => r.isClub) + 1;

  return (
    <>
      <section className="grid-glow relative overflow-hidden border-b border-line">
        <div className="wrap grid items-center gap-10 py-14 lg:grid-cols-[1.25fr_1fr] lg:py-24">
          <div className="animate-rise">
            <p className="eyebrow">{club.league} · Est. {club.founded}</p>
            <h1 className="display mt-3 text-6xl sm:text-7xl lg:text-8xl">{club.name}</h1>
            <p className="display mt-4 text-2xl text-accent sm:text-3xl">{club.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${base}/squad`} className="btn-primary">View club <ArrowRight size={16} /></Link>
              <Link href={`${base}/results`} className="btn-ghost">Latest results</Link>
            </div>
          </div>
          <div className="card animate-rise border-accent/30 p-6 shadow-[0_0_60px_-20px_rgb(var(--accent)/0.6)]">
            <p className="eyebrow">Next match</p>
            {next ? (
              <>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                  <div className="flex flex-col items-center gap-2"><Crest club={club} size={72} /><span className="display text-xl">{short}</span></div>
                  <span className="display text-2xl text-white/35">VS</span>
                  <div className="flex flex-col items-center gap-2"><Crest name={opponent ?? "TBC"} size={72} /><span className="display text-xl">{opponent ?? "To be confirmed"}</span></div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                  <div>
                    <p className="display text-2xl">{new Date(next.startsAt).toLocaleDateString("en-GB", { weekday: "long" })} · {fmtTime(next.startsAt)}</p>
                    <p className="text-sm text-white/55">{new Date(next.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}{next.competition ? ` · ${next.competition}` : ""}</p>
                  </div>
                  <CalendarLink club={club} />
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-white/55">No upcoming fixtures have been scheduled.</p>
            )}
          </div>
        </div>
      </section>

      <div className="wrap space-y-14 pt-8">
        {stats.loading ? <div className="skeleton h-16" aria-label="Loading club statistics…" /> : <StatusBanner club={club} lastActivityAt={stats.lastActivityAt} />}

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr] [&>*]:min-w-0">
          <div>
            <SectionHead eyebrow="Club news" title="Latest news" action={<Link href={`${base}/news`} className="btn-ghost !py-2 text-xs">All news</Link>} />
            {news.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><NewsCard club={club} article={news[0]} big /></div>
                {news.slice(1, 3).map((n) => <NewsCard key={n.id} club={club} article={n} />)}
              </div>
            ) : (
              <Empty title="No news yet" hint="Articles published by the club will appear here." />
            )}
          </div>
          <div className="space-y-5">
            <div className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="eyebrow">League position</p>
                  <p className="display mt-1 text-6xl text-accent">{position ? `#${position}` : "—"}</p>
                  <p className="font-display text-sm font-semibold uppercase tracking-wider text-white/60">{club.league}</p>
                </div>
                <Crest club={club} size={48} />
              </div>
              <div className="mt-4">
                {stats.loading ? <div className="skeleton h-40" /> : stats.leaderboard.length ? <LeagueTable rows={stats.leaderboard} limit={5} /> : <p className="text-sm text-white/50">We couldn&apos;t load the league table right now.</p>}
              </div>
              <div className="mt-3"><StatsNote snap={stats} /></div>
            </div>
            <DonationProgress club={club} cta />
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
          <div>
            <SectionHead eyebrow="Form guide" title="Last 5 results" action={<Link href={`${base}/results`} className="btn-ghost !py-2 text-xs">All results</Link>} />
            {stats.loading ? <div className="skeleton h-72" /> : stats.recent.length ? <ResultsList club={club} matches={stats.recent.slice(0, 5)} /> : <Empty title="No results yet" hint="Match results will appear here after the first fixture." />}
          </div>
          <div>
            <SectionHead eyebrow="Club calendar" title="Upcoming events" action={<CalendarLink club={club} />} />
            {upcoming.length ? <div className="space-y-2">{upcoming.slice(0, 5).map((e) => <EventRow key={e.id} ev={e} />)}</div> : <Empty title="Nothing scheduled" hint="No upcoming fixtures have been scheduled." />}
          </div>
        </section>

        <section>
          <SectionHead eyebrow="This season" title="Season leaders" action={<StatsNote snap={stats} />} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.leaders.map((l) => (
              <Link key={l.label} href={l.player ? `${base}/squad/${l.player.id}` : `${base}/squad`} className="card card-hover relative overflow-hidden p-5">
                <p className="eyebrow">{l.label}</p>
                {l.player ? (
                  <>
                    <p className="display mt-3 text-5xl">{l.unit === "Avg Rating" ? l.value.toFixed(1) : l.value}</p>
                    <p className="text-xs uppercase tracking-wider text-white/45">{l.unit}</p>
                    <p className="mt-4 font-semibold">{playerName(l.player)}</p>
                    <p className="text-xs text-white/45">#{l.player.kitNumber} · {l.player.position}</p>
                    <Avatar src={l.player.image} name={l.player.gamerTag} className="absolute -bottom-2 -right-3 h-24 w-24 rounded-full opacity-70" />
                  </>
                ) : (
                  <p className="mt-3 text-sm text-white/50">No statistics are currently available.</p>
                )}
              </Link>
            ))}
            {stats.loading && [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-44" />)}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <div className="card flex flex-col justify-between gap-6 overflow-hidden p-6 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow flex items-center gap-2"><Twitch size={14} /> {short} live</p>
              <p className="display mt-2 text-3xl">{short} is currently offline.</p>
              <p className="mt-2 max-w-md text-sm text-white/55">Match nights are streamed on Twitch. Follow the channel to be notified when the next broadcast starts.</p>
            </div>
            {/^https?:\/\//.test(club.socials.twitch) ? (
              <a href={club.socials.twitch} target="_blank" rel="noopener noreferrer" className="btn-ghost shrink-0"><Twitch size={16} /> Open Twitch</a>
            ) : (
              <span className="chip shrink-0">Channel not connected</span>
            )}
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-3">Social channels</p>
            <SocialLinks club={club} />
          </div>
        </section>

        <section>
          <SectionHead eyebrow="One platform" title="Other clubs" />
          <div className="grid gap-4 sm:grid-cols-3">
            {db.clubs.map((c) => (
              <Link key={c.id} href={`/${c.slug}`} style={{ ["--accent" as string]: c.accent }} className={`card card-hover flex items-center gap-4 p-5 ${c.id === club.id ? "border-accent/50" : ""}`}>
                <Crest club={c} size={56} />
                <div>
                  <p className="display text-2xl">{c.name}</p>
                  <p className="text-xs uppercase tracking-wider text-white/45">{c.id === club.id ? "You are here" : c.league}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
