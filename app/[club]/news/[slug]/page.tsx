"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BrandArt } from "@/components/art";
import { NewsCard } from "@/components/blocks";
import { useCurrentClub } from "@/components/SiteShell";
import { Badge, Empty, RichText } from "@/components/ui";
import { canManage, useStore } from "@/lib/store";
import { fmtDate } from "@/lib/utils";

export default function ArticlePage() {
  const club = useCurrentClub();
  const { slug } = useParams<{ slug: string }>();
  const { db, user } = useStore();
  const article = db.news.find((n) => n.clubId === club.id && n.slug === slug);
  const visible = article && (article.status === "published" || canManage(user, club.id));
  if (!article || !visible) {
    return (
      <div className="wrap py-16">
        <Empty title="Article not found" hint="This article may have been unpublished or moved.">
          <Link href={`/${club.slug}/news`} className="btn-primary">Back to news</Link>
        </Empty>
      </div>
    );
  }
  const more = db.news.filter((n) => n.clubId === club.id && n.status === "published" && n.id !== article.id).sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 3);
  return (
    <article className="wrap max-w-4xl py-10">
      <Link href={`/${club.slug}/news`} className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 hover:text-accent"><ArrowLeft size={15} /> All news</Link>
      {article.status !== "published" && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          <Badge>{article.status}</Badge> Preview — only administrators can see this article.
        </div>
      )}
      <p className="eyebrow">{article.category}</p>
      <h1 className="display mt-2 text-4xl sm:text-6xl">{article.title}</h1>
      <p className="mt-3 text-sm text-white/50">By {article.author} · {fmtDate(article.publishedAt, { day: "numeric", month: "long", year: "numeric" })}</p>
      <BrandArt src={article.image} label={article.category} sub={club.name} className="mt-6 h-56 w-full rounded-xl sm:h-80" />
      <p className="mt-8 text-lg text-white/85">{article.excerpt}</p>
      <div className="mt-6"><RichText html={article.content} /></div>
      {more.length > 0 && (
        <div className="mt-14 border-t border-line pt-8">
          <p className="eyebrow mb-4">More from the club</p>
          <div className="grid gap-4 sm:grid-cols-3">{more.map((n) => <NewsCard key={n.id} club={club} article={n} />)}</div>
        </div>
      )}
    </article>
  );
}
