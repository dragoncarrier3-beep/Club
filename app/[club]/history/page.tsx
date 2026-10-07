"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { BrandArt, SafeImg } from "@/components/art";
import { useCurrentClub } from "@/components/SiteShell";
import { Empty, Modal, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Era } from "@/lib/types";

export default function HistoryPage() {
  const club = useCurrentClub();
  const { db } = useStore();
  const [sel, setSel] = useState<Era | null>(null);
  const eras = db.history.filter((h) => h.clubId === club.id).sort((a, b) => a.order - b.order);
  return (
    <>
      <PageHero eyebrow={`Since ${club.founded}`} title="Club history" sub="Select an era to see the story of that season." />
      <div className="wrap py-10">
        {eras.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {eras.map((e) => (
              <button key={e.id} onClick={() => setSel(e)} className="card card-hover group relative h-64 overflow-hidden text-left">
                <BrandArt src={e.image} label="" className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                <span className="display absolute right-3 top-2 text-6xl text-white/10 transition group-hover:text-accent/40">{String(e.year).slice(2)}</span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="eyebrow">{e.year}</p>
                  <p className="display text-3xl">{e.game}</p>
                  <p className="text-sm text-white/65">“{e.title}”</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty title="History coming soon" hint="The club's story will be added here." />
        )}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.game ?? ""} wide>
        {sel && (
          <div>
            <p className="eyebrow">{sel.year}</p>
            <h3 className="display text-4xl">“{sel.title}”</h3>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Matches", sel.matches], ["Wins", sel.wins], ["Best finish", sel.bestFinish], ["Top scorer", sel.topScorer]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line p-3">
                  <p className="label !mb-1">{k}</p>
                  <p className="font-display text-lg font-bold uppercase leading-tight">{v || "—"}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/75">{sel.story}</p>
            {sel.achievements.length > 0 && (
              <>
                <p className="eyebrow mb-2 mt-6">Achievements</p>
                <ul className="space-y-1.5 text-sm text-white/80">{sel.achievements.map((a) => <li key={a} className="flex items-center gap-2"><Trophy size={14} className="shrink-0 text-accent" />{a}</li>)}</ul>
              </>
            )}
            <p className="eyebrow mb-2 mt-6">Gallery</p>
            <div className="grid grid-cols-3 gap-2">
              {(sel.gallery.length ? sel.gallery : [undefined, undefined, undefined]).map((g, i) => (
                <SafeImg key={i} src={g} alt={`${sel.game} gallery image ${i + 1}`} className="h-24 w-full rounded-md object-cover sm:h-32" fallback={<BrandArt label={sel.game} sub={["Matchday", "Squad", "Highlights"][i % 3]} className="h-24 w-full rounded-md sm:h-32" />} />
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
