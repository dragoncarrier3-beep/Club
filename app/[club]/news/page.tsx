"use client";

import { useState } from "react";
import { NewsCard } from "@/components/blocks";
import { useCurrentClub } from "@/components/SiteShell";
import { Empty, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/utils";

export default function NewsPage() {
  const club = useCurrentClub();
  const { db, now } = useStore();
  const [cat, setCat] = useState("All");
  const all = db.news.filter((n) => n.clubId === club.id && n.status === "published" && n.publishedAt <= now).sort((a, b) => b.publishedAt - a.publishedAt);
  const cats = ["All", ...Array.from(new Set(all.map((n) => n.category)))];
  const list = cat === "All" ? all : all.filter((n) => n.category === cat);
  return (
    <>
      <PageHero eyebrow="Club news" title="News" sub={`Match reports, announcements and updates from ${club.name}.`} />
      <div className="wrap py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cx("chip transition", cat === c && "!border-accent/60 !bg-accent/10 !text-accent")}>{c}</button>
          ))}
        </div>
        {list.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((n) => <NewsCard key={n.id} club={club} article={n} />)}</div>
        ) : (
          <Empty title="No articles yet" hint="Published news will appear here." />
        )}
      </div>
    </>
  );
}
