"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, ArrowDown, ArrowUp, DownloadCloud, Eye, EyeOff, RotateCcw } from "lucide-react";
import { kitConflict, kitTable } from "@/lib/kit";
import { type ExternalPlayer, getStatsProvider } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { ClubEvent, Era, News, Player, Product, Staff } from "@/lib/types";
import { fmtDate, fmtDateTime, money, playerName, slugify } from "@/lib/utils";
import { Badge, Modal } from "../ui";
import { Crud, useAdminClub } from "./Crud";

const iconBtn = "rounded p-2 text-white/60 hover:bg-white/10 hover:text-accent";

export function NewsAdmin() {
  const club = useAdminClub();
  const { user, update, toast } = useStore();
  const toggle = (n: News) => {
    const status = n.status === "published" ? "draft" : "published";
    update((d, log) => {
      const x = d.news.find((y) => y.id === n.id);
      if (x) x.status = status;
      log(status === "published" ? "News published" : "News unpublished", n.title, "", club.id);
    });
    toast(status === "published" ? "Article published — it is now live on the website." : "Article unpublished.");
  };
  return (
    <Crud<News>
      collection="news" title="News" sub="Create, edit and publish articles. Published articles appear on the homepage immediately." noun="Article"
      verbs={{ create: "News created", edit: "News edited", remove: "News deleted" }}
      label={(n) => n.title} sort={(a, b) => b.publishedAt - a.publishedAt}
      blank={() => ({ title: "", slug: "", category: "Club News", excerpt: "", content: "", author: user?.username ?? "", publishedAt: Date.now(), status: "published" })}
      fields={[
        { key: "title", label: "Title", required: true, max: 120, full: true },
        { key: "category", label: "Category", type: "select", required: true, options: ["Club News", "Match Report", "Recruitment", "Milestone", "Fixtures"] },
        { key: "status", label: "Status", type: "select", required: true, options: ["draft", "published", "archived"] },
        { key: "author", label: "Author", required: true, max: 60 },
        { key: "publishedAt", label: "Publication date", type: "datetime", required: true },
        { key: "excerpt", label: "Excerpt", type: "textarea", required: true, max: 220 },
        { key: "content", label: "Content", type: "rich", required: true },
        { key: "image", label: "Featured image", type: "image", help: "Optional. Branded artwork is used when no image is uploaded." },
        { key: "seoTitle", label: "SEO title", max: 70 },
        { key: "seoDescription", label: "SEO description", max: 160 },
      ]}
      prepare={(n, prev, db) => {
        let slug = prev?.slug || slugify(n.title) || "article";
        while (db.news.some((x) => x.clubId === n.clubId && x.slug === slug && x.id !== n.id)) slug += "-2";
        return { ...n, slug };
      }}
      columns={[
        { label: "Title", render: (n) => <span className="font-semibold">{n.title}</span> },
        { label: "Category", render: (n) => <span className="text-white/60">{n.category}</span> },
        { label: "Date", render: (n) => <span className="whitespace-nowrap text-white/60">{fmtDate(n.publishedAt)}</span> },
        { label: "Status", render: (n) => <Badge>{n.status}</Badge> },
      ]}
      rowActions={(n) => (
        <>
          <Link href={`/${club.slug}/news/${n.slug}`} target="_blank" title="Preview" aria-label="Preview" className={iconBtn}><Eye size={15} /></Link>
          <button onClick={() => toggle(n)} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">{n.status === "published" ? <><EyeOff size={13} /> Unpublish</> : "Publish"}</button>
        </>
      )}
    />
  );
}

export function EventsAdmin() {
  const club = useAdminClub();
  const { update, toast } = useStore();
  const cancel = (e: ClubEvent) => {
    update((d, log) => {
      const x = d.events.find((y) => y.id === e.id);
      if (x) x.cancelled = !e.cancelled;
      log(e.cancelled ? "Event reinstated" : "Event cancelled", e.title, "", club.id);
    });
    toast(e.cancelled ? "Event reinstated." : "Event marked as cancelled.");
  };
  return (
    <Crud<ClubEvent>
      collection="events" title="Events" sub="Fixtures, training and club events shown on the public calendar." noun="Event"
      label={(e) => e.title} sort={(a, b) => b.startsAt - a.startsAt}
      blank={() => ({ title: "", type: "Match", startsAt: Date.now() + 7 * 864e5, competition: "", description: "" })}
      fields={[
        { key: "title", label: "Title", required: true, max: 100, full: true, help: "For matches use “Club vs Opponent” so the homepage can show the opponent." },
        { key: "type", label: "Type", type: "select", required: true, options: ["Match", "Training", "Trial", "Tournament", "Club Event"] },
        { key: "startsAt", label: "Date and time", type: "datetime", required: true },
        { key: "competition", label: "Competition", max: 60 },
        { key: "description", label: "Description", type: "textarea", max: 400 },
      ]}
      columns={[
        { label: "Event", render: (e) => <span className={`font-semibold ${e.cancelled ? "line-through opacity-60" : ""}`}>{e.title}</span> },
        { label: "When", render: (e) => <span className="whitespace-nowrap text-white/60">{fmtDateTime(e.startsAt)}</span> },
        { label: "Type", render: (e) => (e.cancelled ? <Badge>Cancelled</Badge> : <Badge>{e.type}</Badge>) },
      ]}
      rowActions={(e) => <button onClick={() => cancel(e)} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">{e.cancelled ? "Reinstate" : "Cancel"}</button>}
    />
  );
}

const POSITIONS = ["GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "ST"];

export function SquadAdmin() {
  const club = useAdminClub();
  const { db, update, toast } = useStore();
  const [importing, setImporting] = useState(false);
  const [roster, setRoster] = useState<ExternalPlayer[] | null>(null);
  const [seed, setSeed] = useState<Partial<Player> | null>(null);
  const kits = kitTable(db.players, club.id);
  const free = kits.filter((k) => !k.player).map((k) => k.number);

  useEffect(() => {
    if (!importing) return;
    setRoster(null);
    getStatsProvider(db, club.id).getPlayers().then(setRoster).catch(() => setRoster([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importing]);

  const setStatus = (p: Player, status: Player["status"]) => {
    const err = kitConflict(db.players, { ...p, status });
    if (err) return toast(`${err} Edit the player and choose another number first.`, "error");
    update((d, log) => {
      const x = d.players.find((y) => y.id === p.id);
      if (x) x.status = status;
      log(status === "archived" ? "Player archived" : "Player reactivated", playerName(p), "", club.id);
    });
    toast(status === "archived" ? `${p.gamerTag} archived. Kit number ${p.kitNumber} is available again.` : `${p.gamerTag} is back in the active squad.`);
  };

  return (
    <>
      <Crud<Player>
        collection="players" title="Squad" sub="Players shown on the public squad page. Statistics are filled from the stats provider when available." noun="Player"
        verbs={{ create: "Player added", edit: "Player edited", remove: "Player removed" }}
        removeLabel="Remove player" removeBody={(p) => `Remove ${p.firstName} ‘${p.gamerTag}’ ${p.lastName} from the squad? Their profile and statistics will be deleted. Use Archive instead to keep the record.`}
        label={playerName} sort={(a, b) => (a.status === b.status ? a.kitNumber - b.kitNumber : a.status === "active" ? -1 : 1)}
        seedDraft={seed} onSeedUsed={() => setSeed(null)}
        blank={() => ({ gamerTag: "", firstName: "", lastName: "", eaId: "", position: "CM", kitNumber: free[0] ?? 31, nationality: "", status: "active", joinedAt: Date.now(), bio: "", stats: { apps: 0, goals: 0, assists: 0, cleanSheets: 0, rating: 0, motm: 0, yellow: 0, red: 0 } })}
        validate={(p, d) => kitConflict(d.players, p)}
        prepare={(p) => ({ ...p, gamerTag: p.gamerTag.toUpperCase() })}
        afterSave={(p, prev, log) => {
          if (prev && prev.kitNumber !== p.kitNumber) log("Kit number changed", playerName(p), `${prev.kitNumber} → ${p.kitNumber}`, club.id);
        }}
        fields={[
          { key: "gamerTag", label: "Gamer tag", required: true, max: 16 },
          { key: "eaId", label: "EA / PSN ID", required: true, max: 32 },
          { key: "firstName", label: "First name", required: true, max: 30 },
          { key: "lastName", label: "Last name", required: true, max: 30 },
          { key: "position", label: "Position", type: "select", required: true, options: POSITIONS },
          { key: "kitNumber", label: "Kit number", type: "number", required: true, help: free.length ? `Available: ${free.slice(0, 8).join(", ")}${free.length > 8 ? "…" : ""}` : "No numbers under 30 are free." },
          { key: "nationality", label: "Nationality", max: 30 },
          { key: "status", label: "Status", type: "select", required: true, options: ["active", "archived"] },
          { key: "joinedAt", label: "Join date", type: "date", required: true },
          { key: "image", label: "Profile image", type: "image", help: "Optional. A player silhouette is used when no image is uploaded." },
          { key: "bio", label: "Biography", type: "textarea", max: 500 },
          { key: "stats.apps", label: "Appearances", type: "number" },
          { key: "stats.goals", label: "Goals", type: "number" },
          { key: "stats.assists", label: "Assists", type: "number" },
          { key: "stats.cleanSheets", label: "Clean sheets", type: "number" },
          { key: "stats.rating", label: "Average rating", type: "number", step: "0.1" },
          { key: "stats.motm", label: "Player of the match", type: "number" },
          { key: "stats.yellow", label: "Yellow cards", type: "number" },
          { key: "stats.red", label: "Red cards", type: "number" },
        ]}
        columns={[
          { label: "#", render: (p) => <span className="display text-xl text-accent">{p.kitNumber}</span> },
          { label: "Player", render: (p) => <span><span className="font-semibold">{p.gamerTag}</span><span className="ml-2 text-white/50">{p.firstName} {p.lastName}</span></span> },
          { label: "Pos", render: (p) => p.position },
          { label: "Apps / G / A", render: (p) => <span className="whitespace-nowrap tabular-nums text-white/60">{p.stats.apps} / {p.stats.goals} / {p.stats.assists}</span> },
          { label: "Status", render: (p) => <Badge>{p.status}</Badge> },
        ]}
        rowActions={(p) => (p.status === "active"
          ? <button title="Archive" aria-label={`Archive ${p.gamerTag}`} onClick={() => setStatus(p, "archived")} className={iconBtn}><Archive size={15} /></button>
          : <button title="Reactivate" aria-label={`Reactivate ${p.gamerTag}`} onClick={() => setStatus(p, "active")} className={iconBtn}><RotateCcw size={15} /></button>)}
        headerExtra={<button className="btn-ghost" onClick={() => setImporting(true)}><DownloadCloud size={16} /> Add from stats provider</button>}
        footer={
          <section className="mt-10">
            <h2 className="display text-2xl">Kit number availability</h2>
            <p className="mb-4 mt-1 text-sm text-white/55">One number per active player. Archiving or removing a player frees their number.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {kits.map((k) => (
                <div key={k.number} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${k.player ? "border-line bg-panel" : "border-accent/30 bg-accent/5"}`}>
                  <span className="display w-7 text-xl">{k.number}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-white/60">{k.player ? `${k.player.firstName} ${k.player.lastName}` : ""}</span>
                  <Badge>{k.player ? "Used" : "Available"}</Badge>
                </div>
              ))}
            </div>
          </section>
        }
      />
      <Modal open={importing} onClose={() => setImporting(false)} title="Add from stats provider">
        <p className="mb-4 text-sm text-white/60">Club members returned by the statistics provider who are not yet in the squad. Selecting one pre-fills their profile and statistics. <span className="text-white/40">Source: demo statistics.</span></p>
        {roster === null ? <p className="text-sm text-white/50">Loading squad…</p> : roster.length === 0 ? <p className="rounded-md border border-line p-4 text-sm text-white/55">Every player returned by the provider is already in the squad.</p> : (
          <ul className="space-y-2">
            {roster.map((r) => (
              <li key={r.eaId} className="card flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><p className="font-semibold">{r.firstName} “{r.gamerTag}” {r.lastName}</p><p className="text-xs text-white/50">{r.position} · {r.stats.apps} apps · {r.stats.goals} goals · {r.eaId}</p></div>
                <button className="btn-primary !py-2 text-xs" onClick={() => { setSeed({ ...r, kitNumber: free[0] ?? 31 }); setImporting(false); }}>Select</button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}

export function ManagementAdmin() {
  const club = useAdminClub();
  const { db, update } = useStore();
  const staff = db.staff.filter((s) => s.clubId === club.id).sort((a, b) => a.order - b.order);
  const move = (s: Staff, dir: -1 | 1) => {
    const i = staff.findIndex((x) => x.id === s.id);
    const other = staff[i + dir];
    if (!other) return;
    update((d, log) => {
      staff.forEach((x, k) => {
        const row = d.staff.find((y) => y.id === x.id)!;
        row.order = x.id === s.id ? i + dir : x.id === other.id ? i : k;
      });
      log("Management reordered", s.name, "", club.id);
    });
  };
  return (
    <Crud<Staff>
      collection="staff" title="Management" sub="Profiles shown on the Management and Contact pages." noun="Profile"
      verbs={{ create: "Management profile created", edit: "Management profile edited", remove: "Management profile deleted" }}
      label={(s) => s.name} sort={(a, b) => a.order - b.order}
      blank={() => ({ name: "", role: "", psn: "", discord: "", bio: "", joinedAt: Date.now(), order: staff.length })}
      fields={[
        { key: "name", label: "Name", required: true, max: 60 },
        { key: "role", label: "Role", required: true, max: 60 },
        { key: "psn", label: "PSN / EA ID", max: 32 },
        { key: "discord", label: "Discord", max: 40 },
        { key: "joinedAt", label: "Join date", type: "date", required: true },
        { key: "image", label: "Photo", type: "image" },
        { key: "bio", label: "Biography", type: "textarea", max: 500 },
      ]}
      columns={[
        { label: "Name", render: (s) => <span className="font-semibold">{s.name}</span> },
        { label: "Role", render: (s) => <span className="text-white/60">{s.role}</span> },
        { label: "PSN", render: (s) => <span className="text-white/60">{s.psn || "—"}</span> },
      ]}
      rowActions={(s) => (
        <>
          <button title="Move up" aria-label="Move up" disabled={staff[0]?.id === s.id} onClick={() => move(s, -1)} className={`${iconBtn} disabled:opacity-25`}><ArrowUp size={15} /></button>
          <button title="Move down" aria-label="Move down" disabled={staff[staff.length - 1]?.id === s.id} onClick={() => move(s, 1)} className={`${iconBtn} disabled:opacity-25`}><ArrowDown size={15} /></button>
        </>
      )}
    />
  );
}

export function HistoryAdmin() {
  return (
    <Crud<Era>
      collection="history" title="History" sub="Each era appears as a tile on the public History page." noun="Era"
      verbs={{ create: "History updated", edit: "History updated", remove: "History deleted" }}
      label={(e) => `${e.game} — ${e.title}`} sort={(a, b) => a.order - b.order}
      blank={() => ({ game: "", title: "", year: new Date().getFullYear(), story: "", matches: 0, wins: 0, bestFinish: "", topScorer: "", achievements: [], gallery: [], order: 99 })}
      fields={[
        { key: "game", label: "Era / game", required: true, max: 40, help: "e.g. EA SPORTS FC 26" },
        { key: "title", label: "Title", required: true, max: 60 },
        { key: "year", label: "Year", type: "number", required: true },
        { key: "order", label: "Display order", type: "number", help: "Lower numbers appear first." },
        { key: "matches", label: "Matches", type: "number" },
        { key: "wins", label: "Wins", type: "number" },
        { key: "bestFinish", label: "Best finish", max: 40 },
        { key: "topScorer", label: "Top scorer", max: 60 },
        { key: "story", label: "Story", type: "textarea", required: true, max: 1500 },
        { key: "achievements", label: "Achievements", type: "list" },
        { key: "image", label: "Cover image", type: "image" },
        { key: "gallery", label: "Gallery", type: "images" },
      ]}
      columns={[
        { label: "Era", render: (e) => <span className="font-semibold">{e.game}</span> },
        { label: "Title", render: (e) => <span className="text-white/60">{e.title}</span> },
        { label: "Year", render: (e) => e.year },
        { label: "Record", render: (e) => <span className="whitespace-nowrap text-white/60">{e.wins} wins / {e.matches}</span> },
      ]}
    />
  );
}

export function ShopAdmin() {
  const club = useAdminClub();
  const { update, toast } = useStore();
  const toggle = (p: Product) => {
    update((d, log) => {
      const x = d.products.find((y) => y.id === p.id);
      if (x) x.active = !p.active;
      log(p.active ? "Product archived" : "Product restored", p.name, "", club.id);
    });
    toast(p.active ? "Product archived — it is hidden from the store." : "Product is live in the store again.");
  };
  return (
    <Crud<Product>
      collection="products" title="Shop" sub="Products, prices and stock for the public store." noun="Product"
      label={(p) => p.name} sort={(a, b) => a.sku.localeCompare(b.sku)}
      blank={() => ({ name: "", sku: "", description: "", category: "Accessories", price: 0, sizes: [], stock: 0, active: true })}
      validate={(p, d) => (p.price <= 0 ? "Price must be greater than zero." : p.salePrice != null && p.salePrice >= p.price ? "Sale price must be lower than the regular price." : p.stock < 0 || !Number.isInteger(p.stock) ? "Stock must be a whole number of zero or more." : d.products.some((x) => x.clubId === p.clubId && x.id !== p.id && x.sku.toLowerCase() === p.sku.toLowerCase()) ? `SKU ${p.sku} is already used by another product.` : null)}
      prepare={(p) => ({ ...p, salePrice: p.salePrice ? p.salePrice : undefined })}
      fields={[
        { key: "name", label: "Product", required: true, max: 80 },
        { key: "sku", label: "SKU", required: true, max: 20 },
        { key: "category", label: "Category", type: "select", required: true, options: ["Jerseys", "Hoodies", "T-Shirts", "Accessories"] },
        { key: "stock", label: "Stock", type: "number", required: true },
        { key: "price", label: "Price (£)", type: "number", step: "0.01", required: true },
        { key: "salePrice", label: "Sale price (£)", type: "number", step: "0.01", help: "Leave at 0 for no sale." },
        { key: "description", label: "Description", type: "textarea", required: true, max: 600 },
        { key: "sizes", label: "Sizes", type: "list", help: "One per line. Leave empty for single-size items." },
        { key: "image", label: "Product image", type: "image", help: "Optional. Product artwork is generated when no image is uploaded." },
        { key: "active", label: "Visible in store", type: "bool" },
      ]}
      columns={[
        { label: "Product", render: (p) => <span className="font-semibold">{p.name}</span> },
        { label: "SKU", render: (p) => <span className="text-white/60">{p.sku}</span> },
        { label: "Price", render: (p) => <span className="whitespace-nowrap">{money(p.salePrice ?? p.price)}</span> },
        { label: "Stock", render: (p) => (p.stock <= 0 ? <Badge tone="red">Out of stock</Badge> : <span className="tabular-nums">{p.stock}</span>) },
        { label: "Status", render: (p) => <Badge>{p.active ? "Active" : "Archived"}</Badge> },
      ]}
      rowActions={(p) => <button title={p.active ? "Archive" : "Restore"} aria-label={p.active ? "Archive product" : "Restore product"} onClick={() => toggle(p)} className={iconBtn}>{p.active ? <Archive size={15} /> : <RotateCcw size={15} />}</button>}
    />
  );
}
