"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventRow } from "@/components/blocks";
import { useCurrentClub } from "@/components/SiteShell";
import { Empty, Modal, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { ClubEvent } from "@/lib/types";
import { cx, fmtTime } from "@/lib/utils";

export default function CalendarPage() {
  const club = useCurrentClub();
  const { db, now } = useStore();
  const [view, setView] = useState<"month" | "list">("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [day, setDay] = useState<ClubEvent[] | null>(null);
  const events = useMemo(() => db.events.filter((e) => e.clubId === club.id).sort((a, b) => a.startsAt - b.startsAt), [db.events, club.id]);
  const upcoming = events.filter((e) => e.startsAt >= now);
  const past = events.filter((e) => e.startsAt < now).reverse();

  const first = (cursor.getDay() + 6) % 7; // Monday-first
  const daysIn = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + daysIn) / 7) * 7 }, (_, i) => (i >= first && i < first + daysIn ? i - first + 1 : null));
  const onDay = (n: number) => events.filter((e) => {
    const d = new Date(e.startsAt);
    return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth() && d.getDate() === n;
  });
  const today = new Date(now);
  const shift = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <>
      <PageHero eyebrow="Fixtures & events" title="Club calendar" sub="Matches, training nights, trials and club events." />
      <div className="wrap py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-md border border-line p-1">
            {(["month", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cx("rounded px-4 py-1.5 font-display text-sm font-semibold uppercase tracking-wider", view === v ? "bg-accent text-black" : "text-white/60 hover:text-white")}>{v}</button>
            ))}
          </div>
          {view === "month" && (
            <div className="flex items-center gap-2">
              <button onClick={() => shift(-1)} aria-label="Previous month" className="btn-ghost !p-2"><ChevronLeft size={16} /></button>
              <span className="display w-44 text-center text-xl">{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
              <button onClick={() => shift(1)} aria-label="Next month" className="btn-ghost !p-2"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>

        {view === "month" ? (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-white/[0.03] text-center text-[11px] font-bold uppercase tracking-wider text-white/45">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((n, i) => {
                const list = n ? onDay(n) : [];
                const isToday = n === today.getDate() && cursor.getMonth() === today.getMonth() && cursor.getFullYear() === today.getFullYear();
                return (
                  <button key={i} disabled={!list.length} onClick={() => setDay(list)} className={cx("min-h-[4.5rem] border-b border-r border-line p-1.5 text-left align-top sm:min-h-[6.5rem]", list.length && "hover:bg-accent/5", !n && "bg-black/30")}>
                    {n && <span className={cx("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs", isToday ? "bg-accent font-bold text-black" : "text-white/50")}>{n}</span>}
                    <div className="mt-1 space-y-1">
                      {list.map((e) => (
                        <div key={e.id} className={cx("truncate rounded border-l-2 border-accent bg-accent/10 px-1 py-0.5 text-[10px] sm:text-xs", e.cancelled && "border-white/30 bg-white/5 text-white/40 line-through")}>
                          <span className="hidden sm:inline">{fmtTime(e.startsAt)} </span>{e.title}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">Upcoming</p>
              {upcoming.length ? <div className="space-y-2">{upcoming.map((e) => <EventRow key={e.id} ev={e} />)}</div> : <Empty title="Nothing scheduled" hint="No upcoming fixtures have been scheduled." />}
            </div>
            <div>
              <p className="eyebrow mb-3">Past events</p>
              {past.length ? <div className="space-y-2 opacity-70">{past.map((e) => <EventRow key={e.id} ev={e} />)}</div> : <Empty title="No past events" />}
            </div>
          </div>
        )}
      </div>
      <Modal open={!!day} onClose={() => setDay(null)} title="Events">
        <div className="space-y-3">
          {day?.map((e) => (
            <div key={e.id}>
              <EventRow ev={e} />
              {e.description && <p className="mt-2 px-1 text-sm text-white/60">{e.description}</p>}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
