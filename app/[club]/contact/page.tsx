"use client";

import { Mail } from "lucide-react";
import { SocialLinks, useCurrentClub } from "@/components/SiteShell";
import { Empty, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ContactPage() {
  const club = useCurrentClub();
  const { db } = useStore();
  const staff = db.staff.filter((s) => s.clubId === club.id).sort((a, b) => a.order - b.order);
  const short = club.name.split(" ")[0];
  return (
    <>
      <PageHero eyebrow="Get in touch" title={`Contact ${short}`} sub="Reach the management team directly on PSN or Discord, or email the club." />
      <div className="wrap space-y-10 py-10">
        {staff.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {staff.map((s) => (
              <div key={s.id} className="card p-5">
                <p className="eyebrow">{s.role}</p>
                <p className="display mt-1 text-2xl">{s.name}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-white/45">PSN</dt><dd className="truncate font-semibold">{s.psn || "—"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-white/45">Discord</dt><dd className="truncate font-semibold">{s.discord || "—"}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No contacts listed" hint="Management contact details will appear here." />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {[["General contact", club.contact.general], ["Recruitment", club.contact.recruitment]].map(([label, email]) => (
            <div key={label} className="card flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10 text-accent"><Mail size={20} /></span>
              <div className="min-w-0">
                <p className="label !mb-0.5">{label}</p>
                <p className="truncate font-semibold">{email || "Not provided"}</p>
                <p className="text-xs text-white/40">Demo address</p>
              </div>
            </div>
          ))}
        </div>
        <div className="card p-6 text-center">
          <p className="eyebrow mb-3">Follow {club.name}</p>
          <div className="flex justify-center"><SocialLinks club={club} size={20} /></div>
        </div>
      </div>
    </>
  );
}
