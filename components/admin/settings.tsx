"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Crest } from "@/components/art";
import { LeagueTable, StatusBanner } from "@/components/blocks";
import { SOCIAL_META } from "@/components/SiteShell";
import { getStatsProvider, LIVE_STATS_URL, ONLINE_WINDOW_MS, useStats } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { Club, SocialKey } from "@/lib/types";
import { getPath, HOUR, setPath, slugify, timeAgo, uid } from "@/lib/utils";
import { Badge, Confirm, Modal } from "../ui";
import { AdminHead, cleanRecord, type FieldDef, FormFields, missingField, useAdminClub } from "./Crud";

/** Edits a slice of the current club with a local draft and an explicit Save. */
function ClubForm({ fields, title, note, validate }: { fields: FieldDef[]; title: string; note?: string; validate?: (c: Club) => string | null }) {
  const club = useAdminClub();
  const { update, toast } = useStore();
  const [draft, setDraft] = useState<Club>(club);
  const [error, setError] = useState("");
  useEffect(() => setDraft(club), [club.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next = cleanRecord(fields, draft);
    const err = missingField(fields, next) ?? validate?.(next) ?? null;
    setError(err ?? "");
    if (err) return;
    const ok = update((d, log) => {
      // Only this form's fields are written, so other forms' unsaved or newer values are never overwritten.
      const i = d.clubs.findIndex((c) => c.id === club.id);
      if (i >= 0) d.clubs[i] = fields.reduce((c, f) => setPath(c, f.key, getPath(next, f.key)), d.clubs[i]);
      log("Club settings changed", club.name, title, club.id);
    });
    if (ok) toast(`${title} saved. The public site has been updated.`);
  };
  return (
    <form onSubmit={save} noValidate className="card p-5">
      <h2 className="display mb-4 text-2xl">{title}</h2>
      <FormFields key={club.id} fields={fields} value={draft} onChange={setDraft} />
      {note && <p className="mt-3 text-xs text-white/40">{note}</p>}
      {error && <p role="alert" className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      <div className="mt-5 flex justify-end"><button className="btn-primary">Save changes</button></div>
    </form>
  );
}

const urlOk = (v: string) => !v || /^https:\/\/\S+\.\S+/.test(v);
const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v);

export function SocialsAdmin() {
  const keys = Object.keys(SOCIAL_META) as SocialKey[];
  return (
    <div>
      <AdminHead title="Socials" sub="Links shown in the site footer, homepage and contact page." />
      <ClubForm title="Social links" note="Leave a field empty to show that channel as “not connected” instead of a dead link."
        fields={keys.map((k) => ({ key: `socials.${k}`, label: SOCIAL_META[k].label, max: 200, help: "Full https:// address" }))}
        validate={(c) => { const bad = keys.find((k) => !urlOk(c.socials[k])); return bad ? `${SOCIAL_META[bad].label} must be a full https:// address.` : null; }} />
    </div>
  );
}

export function ContentAdmin() {
  return (
    <div className="space-y-6">
      <AdminHead title="Content" sub="Editable pages: About Us, Copyright and contact details." />
      <ClubForm title="About page" fields={[
        { key: "about.heading", label: "Heading", required: true, max: 60 },
        { key: "founded", label: "Founding year", type: "number", required: true },
        { key: "about.body", label: "Body", type: "rich", required: true },
        { key: "about.values", label: "Club values", type: "list" },
        { key: "about.image", label: "Hero image", type: "image" },
      ]} validate={(c) => (c.founded < 1990 || c.founded > new Date().getFullYear() ? "Please enter a realistic founding year." : null)} />
      <ClubForm title="Copyright & content use" note="This statement is written by the club and is not legal advice." fields={[{ key: "copyright", label: "Page content", type: "rich", required: true }]} />
      <ClubForm title="Contact details" note="Trial applications are sent to the recruitment address; shop orders to the general address." fields={[
        { key: "contact.general", label: "General contact email", required: true, max: 120 },
        { key: "contact.recruitment", label: "Recruitment email", required: true, max: 120 },
      ]} validate={(c) => (!emailOk(c.contact.general) || !emailOk(c.contact.recruitment) ? "Please enter valid email addresses." : null)} />
    </div>
  );
}

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
const rgbToHex = (rgb: string) => "#" + rgb.split(" ").map((n) => Number(n).toString(16).padStart(2, "0")).join("");

export function ClubsAdmin() {
  const club = useAdminClub();
  const { db, user, update, toast } = useStore();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", short: "", league: "" });
  const [error, setError] = useState("");
  const isSuper = user?.role === "superadmin";
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = f.name.trim();
    const slug = slugify(name.split(" ")[0] || name);
    const short = f.short.trim().toUpperCase();
    if (name.length < 3) return setError("Please enter the club name.");
    if (!/^[A-Z]{2,4}$/.test(short)) return setError("Short code must be 2–4 letters.");
    if (!slug || ["admin", "api"].includes(slug) || db.clubs.some((c) => c.slug === slug)) return setError("A club with that web address already exists. Please choose a different name.");
    update((d, log) => {
      d.clubs.push({
        id: slug, slug, name, short, tagline: "A new club on the platform.", accent: "250 204 21", founded: new Date().getFullYear(), league: f.league.trim() || "League to be confirmed",
        about: { heading: `About ${name.split(" ")[0]}`, body: `<p>${name} has just joined the platform. The club's story will be added here.</p>`, values: [] },
        copyright: "", contact: { general: "", recruitment: "" }, socials: { twitch: "", discord: "", x: "", youtube: "", tiktok: "", instagram: "" }, lastActivityAt: Date.now() - 48 * HOUR, donationGoal: 500,
      });
      d.leagues[slug] = [];
      log("Club created", name, `/${slug}`, slug);
    });
    toast(`${name} created at /${slug}. Switch to it using the club selector at the top.`);
    setAdding(false);
    setF({ name: "", short: "", league: "" });
    setError("");
  };
  return (
    <div className="space-y-6">
      <AdminHead title="Clubs" sub="Every club runs on the same template with its own branding, squad and content.">
        {isSuper && <button className="btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add club</button>}
      </AdminHead>
      <div className="grid gap-3 sm:grid-cols-3">
        {db.clubs.map((c) => (
          <div key={c.id} style={{ ["--accent" as string]: c.accent }} className={`card flex items-center gap-3 p-4 ${c.id === club.id ? "border-accent/60" : ""}`}>
            <Crest club={c} size={44} />
            <div className="min-w-0"><p className="display truncate text-xl">{c.name}</p><p className="truncate text-xs text-white/50">/{c.slug} · {c.league}</p></div>
            {c.id === club.id && <span className="ml-auto"><Badge tone="accent">Editing</Badge></span>}
          </div>
        ))}
      </div>
      {!isSuper && <p className="text-sm text-white/50">You administer {club.name}. Only a Super Admin can add clubs or manage other clubs.</p>}
      <ClubForm title={`${club.name} — branding`} fields={[
        { key: "name", label: "Club name", required: true, max: 40 },
        { key: "short", label: "Short code", required: true, max: 4, help: "Shown on the crest when no logo is uploaded." },
        { key: "tagline", label: "Tagline", required: true, max: 60 },
        { key: "league", label: "League", required: true, max: 50 },
        { key: "logo", label: "Club logo", type: "image", help: "Optional. An initials crest is used when no logo is uploaded." },
      ]} />
      <AccentPicker />
      <Modal open={adding} onClose={() => setAdding(false)} title="Add club">
        <form onSubmit={add} noValidate className="space-y-4">
          <label className="block"><span className="label">Club name <span className="text-accent">*</span></span><input className="input" maxLength={40} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="block"><span className="label">Short code <span className="text-accent">*</span></span><input className="input" maxLength={4} value={f.short} onChange={(e) => setF({ ...f, short: e.target.value })} /></label>
          <label className="block"><span className="label">League</span><input className="input" maxLength={50} value={f.league} onChange={(e) => setF({ ...f, league: e.target.value })} /></label>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3"><button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button><button className="btn-primary">Create club</button></div>
        </form>
      </Modal>
    </div>
  );
}

function AccentPicker() {
  const club = useAdminClub();
  const { update, toast } = useStore();
  const set = (hex: string) => update((d) => {
    const c = d.clubs.find((x) => x.id === club.id);
    if (c) c.accent = hexToRgb(hex);
  });
  return (
    <div className="card flex flex-wrap items-center gap-4 p-5">
      <div className="mr-auto"><h2 className="display text-2xl">Club colour</h2><p className="text-sm text-white/55">The accent colour used across this club&apos;s website. Lighter colours work best on the dark theme.</p></div>
      {["#c6ff2e", "#38bdf8", "#c4a7ff", "#facc15", "#fb7185", "#34d399"].map((h) => (
        <button key={h} aria-label={`Use colour ${h}`} onClick={() => { set(h); toast("Club colour updated."); }} style={{ background: h }} className={`h-9 w-9 rounded-full border-2 ${rgbToHex(club.accent) === h ? "border-white" : "border-transparent"}`} />
      ))}
      <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/55">Custom<input type="color" value={rgbToHex(club.accent)} onChange={(e) => set(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line bg-transparent" /></label>
    </div>
  );
}

export function StatisticsAdmin() {
  const club = useAdminClub();
  const { db, update, toast, now } = useStore();
  const stats = useStats(db, club.id);
  const [m, setM] = useState({ opponent: "", home: "Home", gf: "", ga: "" });
  const [error, setError] = useState("");
  const setActivity = (ago: number, label: string) => {
    update((d) => {
      const c = d.clubs.find((x) => x.id === club.id);
      if (c) c.lastActivityAt = Date.now() - ago;
    });
    toast(label);
  };
  const record = (e: React.FormEvent) => {
    e.preventDefault();
    const gf = Number(m.gf), ga = Number(m.ga);
    if (!m.opponent.trim()) return setError("Please enter the opponent.");
    if (m.gf === "" || m.ga === "" || ![gf, ga].every((n) => Number.isInteger(n) && n >= 0 && n <= 30)) return setError("Please enter both scores as whole numbers.");
    update((d, log) => {
      d.matches.unshift({ id: uid(), clubId: club.id, opponent: m.opponent.trim(), home: m.home === "Home", gf, ga, competition: club.league, playedAt: Date.now(), scorers: [], motm: "" });
      const c = d.clubs.find((x) => x.id === club.id);
      if (c) c.lastActivityAt = Date.now();
      log("Match result recorded", `vs ${m.opponent.trim()}`, `${gf}–${ga}`, club.id);
    });
    toast("Result recorded. The homepage results and online status have been updated.");
    setM({ opponent: "", home: "Home", gf: "", ga: "" });
    setError("");
  };
  const provider = getStatsProvider(db, club.id);
  return (
    <div className="space-y-6">
      <AdminHead title="Statistics" sub="Where club and player statistics come from, and controls for demonstrating the online status." />
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="display mr-auto text-2xl">Statistics provider</h2>
          <Badge tone={stats.source === "live" ? "green" : "amber"}>{stats.source === "live" ? "Live statistics" : stats.source === "cache" ? "Cached statistics" : "Demo statistics"}</Badge>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-line p-3"><dt className="label !mb-0.5">Active provider</dt><dd className="font-mono">{provider.name}</dd></div>
          <div className="rounded-lg border border-line p-3"><dt className="label !mb-0.5">Live endpoint</dt><dd className="truncate">{LIVE_STATS_URL || "Not configured"}</dd></div>
          <div className="rounded-lg border border-line p-3"><dt className="label !mb-0.5">Fallback order</dt><dd>Live → cache → demo data</dd></div>
        </dl>
        <p className="mt-3 text-sm text-white/55">{LIVE_STATS_URL ? "The site requests live statistics first. If the endpoint fails, the last cached response is shown, then demo data." : "No live statistics endpoint has been configured, so the site is using deterministic demo data. Set NEXT_PUBLIC_STATS_API_URL to switch to the live provider — no page changes are needed."}</p>
      </div>

      <div className="card p-5">
        <h2 className="display text-2xl">Online status</h2>
        <p className="mb-4 mt-1 text-sm text-white/55">The public banner shows ONLINE when the club&apos;s last activity was within {ONLINE_WINDOW_MS / 60000} minutes. It is calculated from the timestamp below, last set {timeAgo(club.lastActivityAt, now)}.</p>
        <StatusBanner club={club} lastActivityAt={club.lastActivityAt} />
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary !py-2 text-xs" onClick={() => setActivity(0, "Activity recorded just now — the club is online.")}>Record activity now</button>
          <button className="btn-ghost !py-2 text-xs" onClick={() => setActivity(7 * 60000, "Last activity set to 7 minutes ago.")}>Set to 7 minutes ago</button>
          <button className="btn-ghost !py-2 text-xs" onClick={() => setActivity(19 * 60000, "Last activity set to 19 minutes ago — it will go offline in about a minute.")}>Set to 19 minutes ago</button>
          <button className="btn-ghost !py-2 text-xs" onClick={() => setActivity(2 * HOUR, "Last activity set to 2 hours ago — the club is offline.")}>Set to 2 hours ago</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={record} noValidate className="card p-5">
          <h2 className="display text-2xl">Record a match result</h2>
          <p className="mb-4 mt-1 text-sm text-white/55">In demo mode you can add a result by hand. With a live provider, results arrive automatically.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block"><span className="label">Opponent <span className="text-accent">*</span></span><input className="input" maxLength={40} value={m.opponent} onChange={(e) => setM({ ...m, opponent: e.target.value })} /></label>
            <label className="col-span-2 block"><span className="label">Venue</span><select className="input" value={m.home} onChange={(e) => setM({ ...m, home: e.target.value })}><option>Home</option><option>Away</option></select></label>
            <label className="block"><span className="label">{club.name.split(" ")[0]} goals <span className="text-accent">*</span></span><input className="input" type="number" min={0} value={m.gf} onChange={(e) => setM({ ...m, gf: e.target.value })} /></label>
            <label className="block"><span className="label">Opponent goals <span className="text-accent">*</span></span><input className="input" type="number" min={0} value={m.ga} onChange={(e) => setM({ ...m, ga: e.target.value })} /></label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
          <button className="btn-primary mt-4">Record result</button>
        </form>
        <div className="card p-5">
          <h2 className="display mb-3 text-2xl">League table</h2>
          {stats.loading ? <p className="text-sm text-white/50">Loading club statistics…</p> : stats.leaderboard.length ? <LeagueTable rows={stats.leaderboard} /> : <p className="text-sm text-white/50">No league table is available for this club yet.</p>}
          <p className="mt-3 text-[11px] uppercase tracking-wider text-white/35">{stats.source === "live" ? "Live statistics" : "Demo statistics"} · supplied by the statistics provider</p>
        </div>
      </div>
    </div>
  );
}

export function SettingsAdmin() {
  const { resetDemo } = useStore();
  const [confirm, setConfirm] = useState(false);
  const integrations: [string, string, string][] = [
    ["Statistics (EA FC)", LIVE_STATS_URL ? "Live endpoint configured" : "Demo provider", LIVE_STATS_URL ? "green" : "amber"],
    ["Payments (Stripe)", "Test mode — simulated checkout", "amber"],
    ["Email notifications", "Not connected — deliveries are logged", "amber"],
    ["Twitch live status", "Not connected", "grey"],
    ["Database", "Demo store in this browser", "amber"],
  ];
  return (
    <div className="space-y-6">
      <AdminHead title="Settings" sub="Club settings, integrations and demo controls." />
      <ClubForm title="Supporter goal" fields={[{ key: "donationGoal", label: "Monthly donation goal (£)", type: "number", required: true }]} validate={(c) => (c.donationGoal < 1 ? "The goal must be at least £1." : null)} />
      <div className="card p-5">
        <h2 className="display mb-1 text-2xl">Integrations</h2>
        <p className="mb-4 text-sm text-white/55">This demonstration runs without external accounts. Each integration below has a working stand-in and is clearly labelled wherever it appears.</p>
        <ul className="divide-y divide-line text-sm">
          {integrations.map(([name, state, tone]) => <li key={name} className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="font-semibold">{name}</span><Badge tone={tone}>{state}</Badge></li>)}
        </ul>
      </div>
      <div className="card border-red-500/30 p-5">
        <h2 className="display text-2xl">Reset demo data</h2>
        <p className="mb-4 mt-1 text-sm text-white/55">Restores every club to the original sample content. Anything created during this demo will be removed.</p>
        <button className="btn-danger" onClick={() => setConfirm(true)}>Reset demo data</button>
      </div>
      <Confirm open={confirm} title="Reset demo data?" body="All news, players, orders, applications and settings will return to the original sample data. This cannot be undone." action="Reset everything" onCancel={() => setConfirm(false)} onConfirm={() => { resetDemo(); setConfirm(false); }} />
    </div>
  );
}
