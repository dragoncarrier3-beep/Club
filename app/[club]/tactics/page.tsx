"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Pitch } from "@/components/Pitch";
import { useCurrentClub } from "@/components/SiteShell";
import { Badge, Empty, PageHero } from "@/components/ui";
import { canManage, canViewTactics, useStore } from "@/lib/store";
import { cx, fmtDate } from "@/lib/utils";

export default function TacticsPage() {
  const club = useCurrentClub();
  const { db, user } = useStore();
  const [sel, setSel] = useState(0);

  // Access is decided before any tactics data is read. In production this check is a server-side
  // session check plus a Supabase RLS policy, so the rows are never sent to unauthorised visitors.
  if (!canViewTactics(user, club.id)) {
    return (
      <div className="grid-glow">
        <div className="wrap flex min-h-[65vh] items-center justify-center py-12">
          <div className="card w-full max-w-md p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-accent"><Lock size={24} /></span>
            <p className="eyebrow mt-5">Members only</p>
            <h1 className="display mt-1 text-4xl">Tactics Centre</h1>
            <p className="mt-3 text-sm text-white/60">{user ? `Your account is not a member of ${club.name}, so this club's tactics are not available to you.` : "Formations, set-piece routines and match notes are only available to registered club members. Please log in to continue."}</p>
            {!user && (
              <div className="mt-6 flex justify-center gap-3">
                <Link href={`/${club.slug}/login?next=/${club.slug}/tactics`} className="btn-primary">Log in</Link>
                <Link href={`/${club.slug}/register`} className="btn-ghost">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const admin = canManage(user, club.id);
  const tactics = db.tactics.filter((t) => t.clubId === club.id && (t.published || admin));
  const t = tactics[Math.min(sel, tactics.length - 1)];
  return (
    <>
      <PageHero eyebrow="Members only" title="Tactics Centre" sub="Confidential — please do not share outside the squad." />
      <div className="wrap py-10">
        {!t ? (
          <Empty title="No tactics published" hint="The coaching staff have not published any tactics yet." />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {tactics.map((x, i) => (
                <button key={x.id} onClick={() => setSel(i)} className={cx("rounded-lg border px-4 py-3 text-left transition", x.id === t.id ? "border-accent bg-accent/10" : "border-line bg-panel hover:border-accent/50")}>
                  <span className="display block text-lg">{x.name}</span>
                  <span className="text-xs text-white/50">{x.formation}{!x.published ? " · Draft" : ""}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div><p className="eyebrow">Formation</p><p className="display text-5xl">{t.formation}</p></div>
                  <div className="text-right">{!t.published && <Badge>Draft</Badge>}<p className="mt-1 text-xs text-white/40">Updated {fmtDate(t.updatedAt)}</p></div>
                </div>
                <Pitch markers={t.markers} />
                {admin && <Link href="/admin/tactics" className="btn-ghost mt-4 w-full">Edit in Admin</Link>}
              </div>
              <div className="space-y-4">
                {t.sections.filter((s) => s.body.trim()).map((s) => (
                  <section key={s.title} className="card p-5">
                    <h2 className="display text-xl text-accent">{s.title}</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/75">{s.body}</p>
                  </section>
                ))}
                {t.images.length > 0 && (
                  <section className="card p-5">
                    <h2 className="display mb-3 text-xl text-accent">Diagrams</h2>
                    <div className="grid grid-cols-2 gap-3">{t.images.map((src, i) => <img key={i} src={src} alt={`Tactical diagram ${i + 1}`} className="w-full rounded-md border border-line object-cover" />)}</div>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
