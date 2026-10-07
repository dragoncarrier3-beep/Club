"use client";

import { useState } from "react";
import { Avatar } from "@/components/art";
import { useCurrentClub } from "@/components/SiteShell";
import { Empty, Modal, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Staff } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export default function ManagementPage() {
  const club = useCurrentClub();
  const { db } = useStore();
  const [sel, setSel] = useState<Staff | null>(null);
  const staff = db.staff.filter((s) => s.clubId === club.id).sort((a, b) => a.order - b.order);
  return (
    <>
      <PageHero eyebrow="Behind the team" title="Management" sub={`The people who run ${club.name}.`} />
      <div className="wrap py-10">
        {staff.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {staff.map((s) => (
              <button key={s.id} onClick={() => setSel(s)} className="card card-hover group overflow-hidden text-left">
                <Avatar src={s.image} name={s.name} className="h-48 w-full" />
                <div className="border-t border-line p-4">
                  <p className="eyebrow">{s.role}</p>
                  <p className="display mt-1 text-2xl group-hover:text-accent">{s.name}</p>
                  <p className="mt-2 text-xs text-white/50">PSN: {s.psn || "—"} · Discord: {s.discord || "—"}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty title="No management profiles" hint="Management profiles will appear here once they have been added." />
        )}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ""}>
        {sel && (
          <div>
            <div className="flex items-center gap-4">
              <Avatar src={sel.image} name={sel.name} className="h-24 w-24 shrink-0 rounded-lg border border-line" />
              <div>
                <p className="eyebrow">{sel.role}</p>
                <p className="text-sm text-white/55">With the club since {fmtDate(sel.joinedAt, { month: "long", year: "numeric" })}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/75">{sel.bio || "No biography has been added yet."}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-line p-3"><dt className="label">PSN / EA ID</dt><dd>{sel.psn || "—"}</dd></div>
              <div className="rounded-lg border border-line p-3"><dt className="label">Discord</dt><dd>{sel.discord || "—"}</dd></div>
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}
