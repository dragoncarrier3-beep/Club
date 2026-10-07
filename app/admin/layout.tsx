"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Briefcase, Building2, CalendarDays, ClipboardList, ExternalLink, FileText, Heart, History, LayoutDashboard, LogOut, Menu, Newspaper, Package, ScrollText, Settings, Share2, Store, Target, UserCog, Users, X } from "lucide-react";
import { AdminClubCtx } from "@/components/admin/Crud";
import { Crest } from "@/components/art";
import { isAdmin, useStore } from "@/lib/store";
import { cx } from "@/lib/utils";

const NAV = [
  ["", "Dashboard", LayoutDashboard], ["news", "News", Newspaper], ["events", "Events", CalendarDays], ["squad", "Squad", Users], ["management", "Management", Briefcase],
  ["history", "History", History], ["trials", "Trials", ClipboardList], ["donations", "Donations", Heart], ["shop", "Shop", Store], ["orders", "Orders", Package],
  ["tactics", "Tactics", Target], ["users", "Users", UserCog], ["clubs", "Clubs", Building2], ["socials", "Socials", Share2], ["content", "Content", FileText],
  ["statistics", "Statistics", BarChart3], ["logs", "Logs", ScrollText], ["settings", "Settings", Settings],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { db, user, quickLogin, logout, toast } = useStore();
  const pathname = usePathname();
  const [clubId, setClubId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  if (!isAdmin(user)) {
    return (
      <div className="grid-glow flex min-h-screen items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md p-7 text-center">
          <p className="eyebrow">Administration</p>
          <h1 className="display mt-1 text-4xl">Admin access required</h1>
          <p className="mt-3 text-sm text-white/60">{user ? `${user.username} is signed in as a member and cannot open the admin area.` : "Sign in with an administrator account to manage the club."}</p>
          <div className="mt-6 space-y-3">
            <button className="btn-primary w-full" onClick={() => { quickLogin("u-admin"); toast("Signed in as Club Admin."); }}>Demo: sign in as Club Admin</button>
            <button className="btn-ghost w-full" onClick={() => { quickLogin("u-super"); toast("Signed in as Super Admin."); }}>Demo: sign in as Super Admin</button>
            <Link href="/venari" className="block pt-2 text-sm text-white/50 hover:text-accent">Back to the website</Link>
          </div>
        </div>
      </div>
    );
  }

  const allowed = user!.role === "superadmin" ? db.clubs : db.clubs.filter((c) => c.id === user!.clubId);
  const club = allowed.find((c) => c.id === clubId) ?? allowed[0];
  const seg = pathname.split("/")[2] ?? "";

  const nav = (
    <nav className="space-y-0.5">
      {NAV.map(([s, label, Icon]) => (
        <Link key={s} href={s ? `/admin/${s}` : "/admin"} className={cx("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition", seg === s ? "bg-accent/15 font-semibold text-accent" : "text-white/65 hover:bg-white/5 hover:text-white")}>
          <Icon size={16} /> {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <AdminClubCtx.Provider value={club}>
      <div style={{ ["--accent" as string]: club.accent }} className="min-h-screen lg:flex">
        <aside className="hidden w-60 shrink-0 border-r border-line bg-black/60 p-4 lg:block">
          <div className="sticky top-4">
            <div className="mb-5 flex items-center gap-2.5 px-1"><Crest club={club} size={34} /><div><p className="display text-lg leading-none">{club.name}</p><p className="text-[10px] uppercase tracking-widest text-white/40">Admin</p></div></div>
            {nav}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-ink/90 px-4 backdrop-blur">
            <button className="rounded p-2 hover:bg-white/10 lg:hidden" aria-label="Menu" onClick={() => setOpen((v) => !v)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
            {allowed.length > 1 ? (
              <select aria-label="Club" className="input !w-auto !py-1.5" value={club.id} onChange={(e) => setClubId(e.target.value)}>
                {allowed.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <span className="display text-lg lg:hidden">{club.name}</span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="chip hidden sm:inline-flex">{user!.username} · {user!.role === "superadmin" ? "Super Admin" : "Admin"}</span>
              <Link href={`/${club.slug}`} className="btn-ghost !px-3 !py-1.5 text-xs"><ExternalLink size={13} /> View site</Link>
              <button onClick={logout} title="Log out" aria-label="Log out" className="rounded p-2 text-white/60 hover:bg-white/10 hover:text-white"><LogOut size={17} /></button>
            </div>
          </header>
          {open && <div className="border-b border-line bg-ink p-3 lg:hidden">{nav}</div>}
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminClubCtx.Provider>
  );
}
