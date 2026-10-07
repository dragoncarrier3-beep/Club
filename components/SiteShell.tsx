"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ChevronDown, Instagram, LogOut, Menu, MessageCircle, Music2, Shield, ShoppingBag, Twitch, Twitter, User as UserIcon, X, Youtube } from "lucide-react";
import type { Club, SocialKey } from "@/lib/types";
import { isAdmin, useStore } from "@/lib/store";
import { cx } from "@/lib/utils";
import { Crest } from "./art";

const ClubCtx = createContext<Club | null>(null);
export function useCurrentClub() {
  const c = useContext(ClubCtx);
  if (!c) throw new Error("No club in context");
  return c;
}

export const SOCIAL_META: Record<SocialKey, { label: string; Icon: typeof Twitch }> = {
  twitch: { label: "Twitch", Icon: Twitch },
  discord: { label: "Discord", Icon: MessageCircle },
  x: { label: "X / Twitter", Icon: Twitter },
  youtube: { label: "YouTube", Icon: Youtube },
  tiktok: { label: "TikTok", Icon: Music2 },
  instagram: { label: "Instagram", Icon: Instagram },
};

export function SocialLinks({ club, size = 18 }: { club: Club; size?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(SOCIAL_META) as SocialKey[]).map((k) => {
        const { label, Icon } = SOCIAL_META[k];
        const url = club.socials[k];
        const cls = "flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white/5";
        return /^https?:\/\//.test(url ?? "") ? (
          <a key={k} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={cx(cls, "text-white/70 transition hover:border-accent/60 hover:text-accent")}><Icon size={size} /></a>
        ) : (
          <span key={k} aria-label={`${label} — not connected`} title={`${label} — not connected yet`} className={cx(cls, "cursor-not-allowed text-white/20")}><Icon size={size} /></span>
        );
      })}
    </div>
  );
}

const MAIN = [["", "Home"], ["news", "News"], ["calendar", "Calendar"], ["squad", "Squad"], ["management", "Management"], ["history", "History"], ["shop", "Shop"]];
const MORE = [["about", "About Us"], ["results", "Results"], ["tactics", "Tactics Centre"], ["trials", "Trial Application"], ["donate", "Donate"], ["contact", "Contact"], ["copyright", "Copyright"]];

export function SiteShell({ club, children }: { club: Club; children: React.ReactNode }) {
  const { db, user, basket, logout } = useStore();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const base = `/${club.slug}`;
  const count = basket.filter((b) => db.products.some((p) => p.id === b.productId && p.clubId === club.id)).reduce((s, b) => s + b.qty, 0);
  useEffect(() => {
    setOpen(false);
    setMore(false);
  }, [pathname]);
  const href = (seg: string) => (seg ? `${base}/${seg}` : base);
  const active = (seg: string) => (seg ? pathname.startsWith(`${base}/${seg}`) : pathname === base);

  return (
    <ClubCtx.Provider value={club}>
      <div style={{ ["--accent" as string]: club.accent }} className="flex min-h-screen flex-col">
        <div className="border-b border-line bg-black text-[11px]">
          <div className="wrap flex h-9 items-center justify-between gap-3">
            <span className="truncate uppercase tracking-wider text-white/45">Demo environment · sample data</span>
            <div className="flex items-center gap-1.5">
              <span className="mr-1 hidden uppercase tracking-wider text-white/45 sm:inline">Our clubs</span>
              {db.clubs.map((c) => (
                <Link key={c.id} href={`/${c.slug}`} title={c.name} aria-label={c.name} className={cx("rounded p-0.5 transition", c.id === club.id ? "bg-white/10" : "opacity-60 hover:opacity-100")}>
                  <Crest club={c} size={24} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <header className="sticky top-0 z-50 border-b border-line bg-ink/90 backdrop-blur">
          <div className="wrap flex h-16 items-center gap-4">
            <Link href={base} className="flex items-center gap-2.5">
              <Crest club={club} size={38} />
              <span className="display text-xl">{club.name}</span>
            </Link>
            <nav className="ml-auto hidden items-center gap-1 lg:flex">
              {MAIN.map(([seg, label]) => (
                <Link key={seg} href={href(seg)} className={cx("rounded px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider transition", active(seg) ? "text-accent" : "text-white/70 hover:text-white")}>{label}</Link>
              ))}
              <div className="relative">
                <button onClick={() => setMore((v) => !v)} aria-expanded={more} className="flex items-center gap-1 rounded px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider text-white/70 hover:text-white">
                  More <ChevronDown size={14} />
                </button>
                {more && (
                  <div className="card absolute right-0 top-full mt-2 w-52 animate-rise p-1.5 shadow-2xl">
                    {MORE.map(([seg, label]) => (
                      <Link key={seg} href={href(seg)} className="block rounded px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">{label}</Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
            <div className="ml-auto flex items-center gap-1.5 lg:ml-2">
              <Link href={href("basket")} aria-label={`Basket, ${count} items`} className="relative rounded-md p-2 text-white/75 hover:bg-white/10 hover:text-white">
                <ShoppingBag size={20} />
                {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-black">{count}</span>}
              </Link>
              {user ? (
                <div className="hidden items-center gap-1.5 sm:flex">
                  {isAdmin(user) && <Link href="/admin" className="btn-ghost !px-3 !py-2 text-xs"><Shield size={14} /> Admin</Link>}
                  <span className="chip"><UserIcon size={12} /> {user.username}</span>
                  <button onClick={logout} aria-label="Log out" title="Log out" className="rounded-md p-2 text-white/60 hover:bg-white/10 hover:text-white"><LogOut size={18} /></button>
                </div>
              ) : (
                <Link href={href("login")} className="btn-primary hidden !px-3 !py-2 text-xs sm:inline-flex">Log in</Link>
              )}
              <button onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open} className="rounded-md p-2 text-white/80 hover:bg-white/10 lg:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button>
            </div>
          </div>
          {open && (
            <nav className="max-h-[calc(100vh-6rem)] overflow-y-auto border-t border-line bg-ink lg:hidden">
              <div className="wrap grid grid-cols-2 gap-1 py-3">
                {[...MAIN, ...MORE].map(([seg, label]) => (
                  <Link key={seg} href={href(seg)} className={cx("rounded px-3 py-3 font-display text-sm font-semibold uppercase tracking-wider", active(seg) ? "bg-accent/10 text-accent" : "text-white/75")}>{label}</Link>
                ))}
              </div>
              <div className="wrap flex flex-wrap items-center gap-2 border-t border-line py-3 sm:hidden">
                {user ? (
                  <>
                    <span className="chip"><UserIcon size={12} /> {user.username}</span>
                    {isAdmin(user) && <Link href="/admin" className="btn-ghost !py-2 text-xs">Admin</Link>}
                    <button onClick={logout} className="btn-ghost !py-2 text-xs">Log out</button>
                  </>
                ) : (
                  <Link href={href("login")} className="btn-primary !py-2 text-xs">Log in / Register</Link>
                )}
              </div>
            </nav>
          )}
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-line bg-black">
          <div className="wrap grid gap-10 py-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <Crest club={club} size={44} />
                <div>
                  <p className="display text-2xl">{club.name}</p>
                  <p className="text-sm text-white/50">{club.tagline}</p>
                </div>
              </div>
              <div className="mt-5"><SocialLinks club={club} /></div>
            </div>
            <div>
              <p className="eyebrow mb-3">Club</p>
              <ul className="space-y-2 text-sm text-white/65">
                {[["about", "About Us"], ["squad", "Squad"], ["trials", "Join the club"], ["donate", "Support us"], ["contact", "Contact"], ["copyright", "Copyright & content use"]].map(([seg, label]) => (
                  <li key={seg}><Link href={href(seg)} className="hover:text-accent">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-3">Other clubs</p>
              <ul className="space-y-2.5 text-sm">
                {db.clubs.filter((c) => c.id !== club.id).map((c) => (
                  <li key={c.id}><Link href={`/${c.slug}`} className="flex items-center gap-2 text-white/65 hover:text-white"><Crest club={c} size={26} /> {c.name}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-line">
            <div className="wrap flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} {club.name}. All rights reserved.</span>
              <span>Demonstration site. Statistics, payments and email use demo adapters. <Link href="/admin" className="text-white/60 underline hover:text-accent">Admin</Link></span>
            </div>
          </div>
        </footer>
      </div>
    </ClubCtx.Provider>
  );
}
