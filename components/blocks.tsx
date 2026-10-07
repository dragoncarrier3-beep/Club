"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { Club, ClubEvent, DB, LeagueRow, Match, News } from "@/lib/types";
import { isOnline, type StatsSnapshot } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { cx, fmtDate, fmtTime, money, resultOf, timeAgo } from "@/lib/utils";
import { BrandArt, Crest } from "./art";
import { Badge, Modal } from "./ui";

export function StatsNote({ snap }: { snap: StatsSnapshot }) {
  const { now } = useStore();
  if (snap.source === "live") return <span className="text-[11px] uppercase tracking-wider text-white/35">Live statistics</span>;
  if (snap.source === "cache") return <span className="text-[11px] text-amber-300/80">Live statistics are temporarily unavailable. Last updated {timeAgo(snap.updatedAt, now)}.</span>;
  return <span className="text-[11px] uppercase tracking-wider text-white/35">Demo statistics</span>;
}

export function StatusBanner({ club, lastActivityAt }: { club: Club; lastActivityAt: number }) {
  const { now } = useStore();
  const online = isOnline(lastActivityAt, now);
  const short = club.name.split(" ")[0].toUpperCase();
  return (
    <div className={cx("card flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4", online ? "border-emerald-400/40 bg-emerald-400/[0.07]" : "")}>
      <span className={cx("h-3 w-3 rounded-full", online ? "animate-pulseDot bg-emerald-400 shadow-[0_0_14px_2px_rgba(52,211,153,0.7)]" : "bg-white/25")} />
      <p className="display text-2xl">
        {short} IS <span className={online ? "text-emerald-400" : "text-white/45"}>{online ? "ONLINE" : "OFFLINE"}</span>
      </p>
      <p className="text-sm text-white/55">{online ? "Last activity" : "Last match activity"} {timeAgo(lastActivityAt, now)}</p>
    </div>
  );
}

export function NewsCard({ club, article, big }: { club: Club; article: News; big?: boolean }) {
  return (
    <Link href={`/${club.slug}/news/${article.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <BrandArt src={article.image} label={article.category} sub={club.name} className={cx("w-full", big ? "h-56 sm:h-72" : "h-36")} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/45">
          <span className="text-accent">{article.category}</span>·<span>{fmtDate(article.publishedAt)}</span>
        </div>
        <h3 className={cx("display mt-2 group-hover:text-accent", big ? "text-3xl" : "text-xl")}>{article.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-white/60">{article.excerpt}</p>
      </div>
    </Link>
  );
}

export function ResultsList({ club, matches }: { club: Club; matches: Match[] }) {
  const [sel, setSel] = useState<Match | null>(null);
  const short = club.name.replace(/ (Esports|FC)$/, "");
  return (
    <>
      <ul className="space-y-2">
        {matches.map((m) => {
          const res = resultOf(m);
          return (
            <li key={m.id}>
              <button onClick={() => setSel(m)} className="card card-hover grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 text-left sm:px-4">
                <span className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-semibold">
                  <span className="truncate">{m.home ? short : m.opponent}</span>
                  {m.home ? <Crest club={club} size={26} /> : <Crest name={m.opponent} size={26} />}
                </span>
                <span className="flex flex-col items-center px-1">
                  <span className="display text-2xl tabular-nums">{m.home ? m.gf : m.ga}–{m.home ? m.ga : m.gf}</span>
                  <Badge>{res}</Badge>
                </span>
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  {m.home ? <Crest name={m.opponent} size={26} /> : <Crest club={club} size={26} />}
                  <span className="truncate">{m.home ? m.opponent : short}</span>
                </span>
                <span className="col-span-3 text-center text-[11px] uppercase tracking-wider text-white/40">{m.competition} · {fmtDate(m.playedAt)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Modal open={!!sel} onClose={() => setSel(null)} title="Match details">
        {sel && (
          <div>
            <p className="text-center text-xs uppercase tracking-wider text-white/45">{sel.competition} · {fmtDate(sel.playedAt)} · {fmtTime(sel.playedAt)}</p>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              <div className="flex flex-col items-center gap-2">{sel.home ? <Crest club={club} size={56} /> : <Crest name={sel.opponent} size={56} />}<span className="text-sm font-semibold">{sel.home ? short : sel.opponent}</span></div>
              <div className="display text-5xl tabular-nums">{sel.home ? sel.gf : sel.ga}–{sel.home ? sel.ga : sel.gf}</div>
              <div className="flex flex-col items-center gap-2">{sel.home ? <Crest name={sel.opponent} size={56} /> : <Crest club={club} size={56} />}<span className="text-sm font-semibold">{sel.home ? sel.opponent : short}</span></div>
            </div>
            <div className="mt-3 flex justify-center"><Badge>{resultOf(sel)}</Badge></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line p-4">
                <p className="eyebrow mb-2">{short} scorers</p>
                {sel.scorers.length ? <ul className="space-y-1 text-sm text-white/75">{sel.scorers.map((s, i) => <li key={i}>⚽ {s}</li>)}</ul> : <p className="text-sm text-white/45">No goals for {short} in this match.</p>}
              </div>
              <div className="rounded-lg border border-line p-4">
                <p className="eyebrow mb-2">Player of the match</p>
                <p className="display text-2xl">{sel.motm || "Not recorded"}</p>
                <p className="mt-2 text-xs text-white/45">{sel.home ? "Home" : "Away"} fixture</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export function LeagueTable({ rows, limit }: { rows: LeagueRow[]; limit?: number }) {
  return (
    <ol className="divide-y divide-line text-sm">
      {rows.slice(0, limit ?? rows.length).map((r, i) => (
        <li key={r.team} className={cx("flex items-center gap-3 px-1 py-2", r.isClub && "rounded bg-accent/10 font-semibold text-accent")}>
          <span className="w-5 text-right tabular-nums text-white/45">{i + 1}</span>
          <span className="flex-1 truncate">{r.team}</span>
          <span className="tabular-nums">{r.pts} pts</span>
        </li>
      ))}
    </ol>
  );
}

export function EventRow({ ev }: { ev: ClubEvent }) {
  const d = new Date(ev.startsAt);
  return (
    <div className={cx("card flex items-center gap-4 px-4 py-3", ev.cancelled && "opacity-55")}>
      <div className="flex w-12 shrink-0 flex-col items-center rounded-md bg-white/5 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{d.toLocaleDateString("en-GB", { month: "short" })}</span>
        <span className="display text-2xl">{d.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cx("truncate font-semibold", ev.cancelled && "line-through")}>{ev.title}</p>
        <p className="truncate text-xs text-white/50">{d.toLocaleDateString("en-GB", { weekday: "long" })} · {fmtTime(ev.startsAt)}{ev.competition ? ` · ${ev.competition}` : ""}</p>
      </div>
      {ev.cancelled ? <Badge>Cancelled</Badge> : <Badge>{ev.type}</Badge>}
    </div>
  );
}

export function donationSummary(db: DB, club: Club, now: number) {
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const list = db.donations.filter((d) => d.clubId === club.id && d.status === "succeeded" && d.createdAt >= start.getTime());
  const raised = Math.round(list.reduce((s, d) => s + d.amount, 0) * 100) / 100;
  const goal = club.donationGoal > 0 ? club.donationGoal : 1;
  return { raised, goal, supporters: list.length, pct: Math.round((raised / goal) * 1000) / 10 };
}

export function DonationProgress({ club, cta }: { club: Club; cta?: boolean }) {
  const { db, now } = useStore();
  const s = donationSummary(db, club, now);
  return (
    <div className="card p-5">
      <p className="eyebrow">Monthly club goal</p>
      <p className="display mt-2 text-4xl">{money(s.raised)} <span className="text-xl text-white/40">/ {money(s.goal)}</span></p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.min(100, s.pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-accent shadow-[0_0_16px_rgb(var(--accent)/0.7)] transition-all duration-700" style={{ width: `${Math.min(100, s.pct)}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-white/60">
        <span>{s.pct}% funded</span>
        <span>{s.supporters} supporter{s.supporters === 1 ? "" : "s"}</span>
      </div>
      {cta && <Link href={`/${club.slug}/donate`} className="btn-primary mt-5 w-full">Support the club</Link>}
    </div>
  );
}

export function CalendarLink({ club }: { club: Club }) {
  return <Link href={`/${club.slug}/calendar`} className="btn-ghost !py-2 text-xs"><CalendarDays size={14} /> Full calendar</Link>;
}
